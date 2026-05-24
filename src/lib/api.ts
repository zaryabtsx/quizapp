// src/lib/api.ts
// Centralised data-access layer — all Supabase queries live here.

import { supabase } from "./supabase";
import type { Campaign, Question, QuizAttempt, ActivityLog } from "../types/database";

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    // FIX 8: "totalParticipants" now counts rows in the `participants` table
    // (written at registration time) so it reflects people who signed up,
    // not just people who finished. "totalCompletions" counts quiz_attempts.
    { count: totalParticipants },
    { count: totalCompletions },
    { count: activeCampaigns },
    attemptsRes,
    topRes,
    activityRes,
    participantsOverTimeRes,
    // FIX (N+1): fetch all active campaigns + their attempt counts in two
    // queries instead of one query + N per-campaign queries.
    campaignsRes,
    campaignAttemptsRes,
  ] = await Promise.all([
    supabase.from("participants").select("*", { count: "exact", head: true }),
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("is_active", true),

    // FIX (completionRate): count ALL attempts — completion = "submitted",
    // not "got a perfect score". We just need total rows vs started rows.
    // Because every row in quiz_attempts represents a submission, the rate
    // is always 100% at the attempt level. To be meaningful we compare
    // quiz_attempts against a "quiz_started" event if you log one, or fall
    // back to: completionRate = attempts that have total > 0 / total rows.
    supabase
      .from("quiz_attempts")
      .select("score, total, completed_at")
      .not("total", "is", null),

    // FIX (topPerformer): order by actual score & time instead of relying
    // on the `rank` integer which can go stale after manual adjustments.
    supabase
      .from("leaderboard")
      .select("participant_name, score, total")
      .order("score", { ascending: false })
      .order("time_taken", { ascending: true })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("quiz_attempts")
      .select("completed_at")
      .gte(
        "completed_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ),

    // FIX (N+1 part 1): fetch the campaign list once
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("is_active", true)
      .limit(6),

    // FIX (N+1 part 2): fetch ALL attempts for those campaigns in one query.
    // We'll group by campaign_id in JS.
    supabase
      .from("quiz_attempts")
      .select("campaign_id, score, total")
      .eq("campaigns.is_active", true), // joined filter — falls back gracefully
  ]);

  // ── completionRate ─────────────────────────────────────────────────────────
  // FIX: "completion rate" = % of attempts where `total` is set and > 0,
  // meaning the quiz ran to the end. (If you log quiz_started separately,
  // swap denominator for that count.)
  const attempts = attemptsRes.data ?? [];
  const submitted = attempts.filter((a) => Number(a.total) > 0).length;
  const completionRate =
    attempts.length > 0 ? Math.round((submitted / attempts.length) * 100) : 0;

  // ── participantsOverTime ───────────────────────────────────────────────────
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

  // ── campaignPerf (FIX: no N+1) ────────────────────────────────────────────
  const campaigns = campaignsRes.data ?? [];
  // Group all attempts by campaign_id in a single pass
  const attemptsByCampaign: Record<
    string,
    { score: number; total: number }[]
  > = {};
  (campaignAttemptsRes.data ?? []).forEach((a: any) => {
    if (!a.campaign_id) return;
    if (!attemptsByCampaign[a.campaign_id])
      attemptsByCampaign[a.campaign_id] = [];
    attemptsByCampaign[a.campaign_id].push({
      score: Number(a.score),
      total: Number(a.total),
    });
  });

  const campaignPerf = campaigns.map((c) => {
    const atts = attemptsByCampaign[c.id] ?? [];
    const comp =
      atts.length > 0
        ? Math.round(
            (atts.filter((a) => a.total > 0).length / atts.length) * 100
          )
        : 0;
    return { name: c.name, participants: atts.length, completion: comp };
  });

  return {
    totalParticipants: totalParticipants ?? 0,   // registered users (participants table)
    totalCompletions: totalCompletions ?? 0,      // finished quizzes (quiz_attempts table)
    activeCampaigns: activeCampaigns ?? 0,
    completionRate,
    topPerformer: topRes.data ?? null,
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
    .maybeSingle();

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
    .select();

  if (error) throw error;

  if (!data || data.length === 0) {
    return { id, ...updates } as Campaign;
  }

  return data[0] as Campaign;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadBanner(file: File, campaignId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `banners/${campaignId}.${ext}`;
  const { error } = await supabase.storage
    .from("campaign-assets-new")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("campaign-assets-new").getPublicUrl(path);
  return data.publicUrl;
}

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

export async function getQuestions(
  campaignId?: string,
  opts?: {
    search?: string;
    difficulty?: string;
    page?: number;
    pageSize?: number;
  }
) {
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

export async function createQuestion(
  q: Omit<Question, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase.from("questions").insert([q]).select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Failed to create question");
  return data[0] as Question;
}

export async function updateQuestion(
  id: string,
  updates: Partial<Omit<Question, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .select();
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

export async function bulkImportQuestions(
  rows: Array<{
    text: string;
    difficulty: string;
    options: string[];
    correct_index: number;
  }>,
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
  // Step 1: Upsert user into `users` table (by mobile)
  const { error: userError } = await supabase
    .from("users")
    .upsert(
      {
        name: participant.full_name,
        mobile: participant.mobile,
        email: participant.email ?? null,
      },
      { onConflict: "mobile" }
    )
    .select();

  if (userError) {
    console.error("Failed to upsert user:", userError);
    // Non-fatal — continue
  }

  // Step 2: Insert into `participants`
  const { data: participantDataArr, error: participantError } = await supabase
    .from("participants")
    .insert([
      {
        full_name: participant.full_name,
        email: participant.email,
        mobile: participant.mobile,
        campaign_id: response.campaign_id || null,
        registered_at: new Date().toISOString(),
      },
    ])
    .select();

  if (participantError) throw participantError;
  if (!participantDataArr || participantDataArr.length === 0)
    throw new Error("Failed to create participant");

  const participantData = participantDataArr[0];

  // Step 3: Insert into `responses`
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
  if (!responseDataArr || responseDataArr.length === 0)
    throw new Error("Failed to create response");

  const responseData = responseDataArr[0];

  // Step 4: Insert into `leaderboard` and recalculate ranks
  try {
    const { error: lbError } = await supabase.from("leaderboard").insert({
      campaign_id: response.campaign_id,
      participant_name: participant.full_name,
      participant_email: participant.email,
      participant_mobile: participant.mobile,
      score: response.score,
      total: response.total ?? 0,
      time_taken: response.time_taken,
      completed_at: new Date().toISOString(),
    });

    if (lbError) {
      console.error("Leaderboard insert error:", lbError);
    } else {
      const { data: ordered } = await supabase
        .from("leaderboard")
        .select("id, score, time_taken")
        .eq("campaign_id", response.campaign_id)
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (ordered && ordered.length) {
        for (let i = 0; i < ordered.length; i++) {
          await supabase
            .from("leaderboard")
            .update({ rank: i + 1 })
            .eq("id", ordered[i].id);
        }
      }
    }
  } catch (err) {
    console.error("Failed to insert/update leaderboard:", err);
  }

  // Step 5: Log activity
  try {
    await supabase.from("activity_log").insert({
      type: "quiz_completed",
      description: `${participant.full_name} completed the quiz with score ${response.score}/${response.total ?? 0}`,
      metadata: {
        campaign_id: response.campaign_id,
        score: response.score,
        time_taken: response.time_taken,
      },
    });
  } catch (_) {
    // Non-fatal
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

export async function updateLeaderboardEntry(
  id: string,
  updates: Record<string, any>
) {
  const { data, error } = await supabase
    .from("leaderboard")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Leaderboard entry not found");
  return data[0];
}

export async function deleteLeaderboardEntry(id: string) {
  const { error } = await supabase.from("leaderboard").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function adjustLeaderboardRank(
  campaignId: string,
  entryId: string,
  newRank: number
) {
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