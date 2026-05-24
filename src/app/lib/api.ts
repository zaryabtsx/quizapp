// src/lib/api.ts
// Centralised data-access layer — all Supabase queries live here.

import { supabase } from "./supabase";
import type { Campaign, Question, QuizAttempt, ActivityLog } from "../../types/database";

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    { count: totalParticipants },
    { count: activeCampaigns },
    attemptsRes,
    topRes,
    activityRes,
    participantsOverTimeRes,
    campaignPerfRes,
  ] = await Promise.all([
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("quiz_attempts").select("score, total"),
    supabase
      .from("leaderboard")
      .select("participant_name, score, total")
      .eq("rank", 1)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    // Participants over last 7 days (group by date)
    supabase
      .from("quiz_attempts")
      .select("completed_at")
      .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    // Campaign performance
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("is_active", true)
      .limit(6),
  ]);

  // Compute completion rate
  const attempts = attemptsRes.data ?? [];
  const completionRate =
    attempts.length > 0
      ? Math.round(
          (attempts.filter((a) => a.score === a.total && a.total > 0).length /
            attempts.length) *
            100
        )
      : 0;

  // Build participants-over-time buckets (last 7 days)
  const buckets: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets[key] = 0;
  }
  (participantsOverTimeRes.data ?? []).forEach((a) => {
    const key = new Date(a.completed_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (key in buckets) buckets[key]++;
  });
  const participantsOverTime = Object.entries(buckets).map(([date, count]) => ({
    date,
    count,
  }));

  // Campaign performance — fetch attempt counts per campaign
  const campaigns = campaignPerfRes.data ?? [];
  const campaignPerf = await Promise.all(
    campaigns.map(async (c) => {
      const { count } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", c.id);
      const { data: atts } = await supabase
        .from("quiz_attempts")
        .select("score, total")
        .eq("campaign_id", c.id);
      const comp =
        atts && atts.length > 0
          ? Math.round(
              (atts.filter((a) => a.score === a.total && a.total > 0).length /
                atts.length) *
                100
            )
          : 0;
      return { name: c.name, participants: count ?? 0, completion: comp };
    })
  );

  return {
    totalParticipants: totalParticipants ?? 0,
    activeCampaigns: activeCampaigns ?? 0,
    completionRate,
    topPerformer: topRes.data,
    activities: activityRes.data ?? [],
    participantsOverTime,
    campaignPerf,
  };
}

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────

export async function getCampaigns() {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

export async function getCampaign(id: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();                    // ← Improved

  if (error) {
    console.error("Supabase getCampaign error:", error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Campaign not found or you don't have permission to view it.");
  }

  return data as Campaign;
}

export async function createCampaign(
  campaign: Omit<Campaign, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("campaigns")
    .insert([campaign])
    .select();
  
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Failed to create campaign");

  const createdCampaign = data[0] as Campaign;

  // Log activity
  await supabase.from("activity_log").insert({
    type: "campaign_created",
    description: `New campaign '${campaign.name}' created`,
    metadata: { campaign_id: createdCampaign.id },
  });

  return createdCampaign;
}

export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update campaign error:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Campaign not found or you don't have permission to update it.");
  }

  return data as Campaign;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

// Upload campaign banner to Supabase Storage
export async function uploadBanner(file: File, campaignId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `banners/${campaignId}.${ext}`;
  const { error } = await supabase.storage
    .from("campaign-assets")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("campaign-assets").getPublicUrl(path);
  return data.publicUrl;
}

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

export async function getQuestions(campaignId?: string, opts?: { search?: string; difficulty?: string; page?: number; pageSize?: number }) {
  let query = supabase.from("questions").select("*", { count: "exact" });

  if (campaignId) query = query.eq("campaign_id", campaignId);
  if (opts?.search) query = query.ilike("text", `%${opts.search}%`);
  if (opts?.difficulty && opts.difficulty !== "all")
    query = query.eq("difficulty", opts.difficulty);

  const pageSize = opts?.pageSize ?? 25;
  const page = opts?.page ?? 0;
  query = query
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Question[], count: count ?? 0 };
}

export async function createQuestion(q: Omit<Question, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("questions").insert([q]).select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Failed to create question");
  return data[0] as Question;
}

export async function updateQuestion(id: string, updates: Partial<Omit<Question, "id" | "created_at" | "updated_at">>) {
  const { data, error } = await supabase.from("questions").update(updates).eq("id", id).select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Question not found");
  return data[0] as Question;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteQuestions(ids: string[]) {
  const { error } = await supabase.from("questions").delete().in("id", ids);
  if (error) throw error;
}

// Bulk-import questions from parsed Excel rows
export async function bulkImportQuestions(
  rows: Array<{ text: string; difficulty: string; options: string[]; correct_index: number }>,
  campaignId: string
) {
  const payload = rows.map((r) => ({
    campaign_id: campaignId,
    text: r.text,
    difficulty: r.difficulty as Question["difficulty"],
    options: r.options,
    correct_index: r.correct_index,
  }));
  const { data, error } = await supabase.from("questions").insert(payload).select();
  if (error) throw error;

  await supabase.from("activity_log").insert({
    type: "question_uploaded",
    description: `${rows.length} questions uploaded`,
    metadata: { campaign_id: campaignId, count: rows.length },
  });

  return data as Question[];
}

// ─── QUIZ RESULTS ─────────────────────────────────────────────────────────────

type ParticipantPayload = {
  full_name: string;
  email: string | null;
  mobile: string;
};

type ResponsePayload = {
  campaign_id: string;
  score: number;
  time_taken: number;
  total?: number;
};

export async function saveQuizResult(
  participant: ParticipantPayload,
  response: ResponsePayload
) {
  if (typeof window !== "undefined") {
    const res = await fetch("/api/save-quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant, response }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Failed to persist quiz result (server)");
    }

    return res.json();
  }

  // Server-side fallback
  const { data: participantDataArr, error: participantError } = await supabase
    .from("participants")
    .insert([participant])
    .select();

  if (participantError) throw participantError;
  if (!participantDataArr || participantDataArr.length === 0) throw new Error("Failed to create participant");
  const participantData = participantDataArr[0];

  const { data: responseDataArr, error: responseError } = await supabase
    .from("responses")
    .insert([
      {
        campaign_id: response.campaign_id,
        participant_id: participantData.id,
        score: response.score,
        time_taken: response.time_taken,
        completed_at: new Date().toISOString(),
      },
    ])
    .select();

  if (responseError) throw responseError;
  if (!responseDataArr || responseDataArr.length === 0) throw new Error("Failed to create response");
  const responseData = responseDataArr[0];

  // Insert leaderboard entry and recalculate ranks
  try {
    await supabase.from("leaderboard").insert({
      campaign_id: response.campaign_id,
      participant_name: participant.full_name,
      participant_email: participant.email,
      participant_mobile: participant.mobile,
      score: response.score,
      total: response.total || 0,
      time_taken: response.time_taken,
      completed_at: new Date().toISOString(),
    });

    const { data: ordered } = await supabase
      .from("leaderboard")
      .select("id, score, time_taken")
      .eq("campaign_id", response.campaign_id)
      .order("score", { ascending: false })
      .order("time_taken", { ascending: true });

    if (ordered && ordered.length) {
      for (let i = 0; i < ordered.length; i++) {
        const row: any = ordered[i];
        await supabase.from("leaderboard").update({ rank: i + 1 }).eq("id", row.id);
      }
    }
  } catch (err) {
    console.error("Failed to insert/update leaderboard:", err);
  }

  return { participant: participantData, response: responseData };
}

// ─── PARTICIPANTS ────────────────────────────────────────────────────────────

export async function saveParticipantRegistration(
  participant: ParticipantPayload,
  campaignId?: string
) {
  try {
    const payload: any = {
      full_name: participant.full_name,
      email: participant.email,
      mobile: participant.mobile,
      registered_at: new Date().toISOString(),
    };

    if (campaignId) {
      payload.campaign_id = campaignId;
    }

    const { data, error } = await supabase
      .from("participants")
      .insert([payload])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create participant");
    return data[0];
  } catch (err) {
    console.warn("Failed to save participant registration:", err);
    return null;
  }
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

export async function getLeaderboard(campaignId?: string, limit = 50) {
  let query = supabase
    .from("leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(limit);

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateLeaderboardEntry(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from("leaderboard").update(updates).eq("id", id).select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Leaderboard entry not found");
  return data[0];
}

export async function deleteLeaderboardEntry(id: string) {
  const { error } = await supabase.from("leaderboard").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function adjustLeaderboardRank(campaignId: string, entryId: string, newRank: number) {
  const { data: current } = await supabase
    .from("leaderboard")
    .select("id")
    .eq("campaign_id", campaignId)
    .order("rank", { ascending: true });

  if (!current) return null;

  const ids = current.map((r: any) => r.id).filter(Boolean);
  const idx = ids.indexOf(entryId);
  if (idx === -1) return null;
  ids.splice(idx, 1);
  const insertAt = Math.max(0, Math.min(newRank - 1, ids.length));
  ids.splice(insertAt, 0, entryId);

  for (let i = 0; i < ids.length; i++) {
    await supabase.from("leaderboard").update({ rank: i + 1 }).eq("id", ids[i]);
  }

  return true;
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

export async function getRecentActivity(limit = 10) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as ActivityLog[];
}

export async function logActivity(entry: Omit<ActivityLog, "id" | "created_at">) {
  const { error } = await supabase.from("activity_log").insert(entry);
  if (error) throw error;
}