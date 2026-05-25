import { useState, useEffect, useRef, useCallback } from "react";
import { Download, Trophy, Users, Clock, Target, RefreshCw, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { maskMobile } from "../../store/utils";
import { supabase } from "../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimePeriod = "all" | "daily" | "weekly" | "monthly";

interface LeaderboardRow {
  id: string;           // this is the response ID exposed by the view
  rank: number;         // computed by the view — read-only
  participant_name: string;
  participant_mobile: string;
  participant_email: string;
  score: number;
  total_questions: number;  // correct column name (NOT `total`)
  time_taken: number;
  completed_at: string;
  campaign_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(sec: number | null | undefined): string {
  if (sec == null || (sec === 0 && sec !== 0)) return "—";
  const s = Number(sec);
  if (!isFinite(s)) return "—";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getPeriodCutoff(period: TimePeriod): Date | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "daily")   { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  if (period === "weekly")  return new Date(now.getTime() - 7  * 86_400_000);
  if (period === "monthly") return new Date(now.getTime() - 30 * 86_400_000);
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLeaderboard() {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>("all");
  const [allEntries,   setAllEntries]   = useState<LeaderboardRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch straight from Supabase (SELECT on view is always fine) ───────────
  const fetchEntries = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true })
        .limit(500);

      if (sbError) {
        setError(`Database error: ${sbError.message} (code: ${sbError.code})`);
        return;
      }
      setAllEntries((data as LeaderboardRow[]) ?? []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Unknown error fetching leaderboard");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    pollingRef.current = setInterval(() => fetchEntries(true), 30_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchEntries]);

  // ── Filter by period ───────────────────────────────────────────────────────
  const entries: LeaderboardRow[] = (() => {
    const cutoff = getPeriodCutoff(activePeriod);
    if (!cutoff) return allEntries;
    return allEntries.filter((e) => {
      const ts = e.completed_at ? new Date(e.completed_at) : null;
      return ts && ts >= cutoff;
    });
  })();

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total = entries.length;

  const avgScore = total
    ? (entries.reduce((a, p) => a + (p.score ?? 0), 0) / total).toFixed(1)
    : "—";

  // FIX: compare against total_questions (not `total`)
  const perfectScores = entries.filter(
    (p) => Number(p.score) === Number(p.total_questions) && Number(p.total_questions) > 0
  ).length;

  const avgTimeSec = total
    ? Math.round(entries.reduce((a, p) => a + (Number(p.time_taken) || 0), 0) / total)
    : 0;

  // ── Score distribution chart ───────────────────────────────────────────────
  const scoreDistribution = (() => {
    if (!total) return [];
    const maxQ = entries[0]?.total_questions ?? 5;  // FIX: total_questions
    const buckets: Record<number, number> = {};
    for (let i = 0; i <= maxQ; i++) buckets[i] = 0;
    entries.forEach((e) => { const s = Number(e.score) || 0; if (s in buckets) buckets[s]++; });
    return Object.entries(buckets).map(([score, count]) => ({
      score:  `${score}/${maxQ}`,
      count,
      pct: Math.round((count / total) * 100),
    }));
  })();

  // ── Top 5 fastest perfect-scorers ─────────────────────────────────────────
  const top5Fastest = [...entries]
    .filter((e) => Number(e.score) === Number(e.total_questions) && Number(e.total_questions) > 0)
    .sort((a, b) => Number(a.time_taken) - Number(b.time_taken))
    .slice(0, 5);

  // ── Delete: remove the underlying `responses` row, view updates itself ─────
  const handleDelete = async (responseId: string) => {
    if (!confirm("Delete this entry? The response record will be permanently removed.")) return;
    const { error: delErr } = await supabase.from("responses").delete().eq("id", responseId);
    if (delErr) { alert(`Delete failed: ${delErr.message}`); return; }
    await fetchEntries();
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!entries.length) return;
    const headers = ["Rank", "Name", "Mobile", "Email", "Score", "Time", "Date"];
    const rows = entries.map((p) => [
      p.rank,
      p.participant_name,
      p.participant_mobile,
      p.participant_email,
      `${p.score}/${p.total_questions}`,  // FIX: total_questions
      fmtTime(p.time_taken),
      fmtDate(p.completed_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a   = document.createElement("a");
    a.href    = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `leaderboard_${activePeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const scorePillClass = (score: number, tot: number) => {
    if (score === tot && tot > 0) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (score >= tot / 2)         return "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400";
    return                               "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400";
  };

  const rankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 bg-muted rounded-lg text-xs font-bold text-muted-foreground">
        #{rank}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <nav className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#4F46E5]" />
          <span className="font-bold text-lg">Leaderboard</span>
          <span className="text-xs text-muted-foreground font-normal">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live · 30s
          </span>
          <button
            onClick={() => fetchEntries()}
            disabled={loading}
            title="Refresh now"
            className="flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-lg hover:border-[#4F46E5] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-lg hover:border-[#4F46E5] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Leaderboard Management</h1>
          <p className="text-sm text-muted-foreground">
            Quiz Challenge · All Campaigns ·{" "}
            <span className="text-[#4F46E5] font-medium">
              Rankings are auto-calculated by score then time
            </span>
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 mb-1">Failed to load leaderboard</p>
              <p className="text-xs text-red-600 font-mono">{error}</p>
            </div>
            <button onClick={() => fetchEntries()} className="text-xs text-red-600 underline flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Participants",
              value: loading ? "…" : total,
              icon: <Users className="w-4 h-4" />,
              sub: activePeriod === "all" ? "All time" : `This ${activePeriod}`,
            },
            {
              label: "Avg Score",
              value: loading ? "…" : (total ? `${avgScore}/${entries[0]?.total_questions ?? 5}` : "—"),
              icon: <Target className="w-4 h-4" />,
              sub: "Per participant",
            },
            {
              label: "Perfect Scores",
              value: loading ? "…" : perfectScores,
              icon: <Trophy className="w-4 h-4" />,
              sub: total > 0 ? `${Math.round((perfectScores / total) * 100)}% of total` : "—",
            },
            {
              label: "Avg Time",
              value: loading ? "…" : (total ? fmtTime(avgTimeSec) : "—"),
              icon: <Clock className="w-4 h-4" />,
              sub: "To complete quiz",
            },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#4F46E5] mb-2">
                {s.icon}
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {s.label}
                </span>
              </div>
              <div className="text-3xl font-bold mb-0.5">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* Score Distribution */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-1">Score Distribution</h3>
            <p className="text-xs text-muted-foreground mb-4">Participants per score</p>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : total === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="score" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number, _: string, props: any) => [
                      `${v} (${props.payload.pct}%)`, "Count",
                    ]}
                  />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top 5 Fastest */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-1">Top 5 Fastest (Perfect Score)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Among participants with 100% score
            </p>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : top5Fastest.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No perfect scores yet
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {top5Fastest.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">
                      {["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.participant_name}</p>
                      <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#4F46E5] rounded-full transition-all"
                          style={{
                            width: `${Math.max(10, 100 - (Number(e.time_taken) / 300) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-mono font-semibold text-muted-foreground flex-shrink-0">
                      {fmtTime(e.time_taken)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">Rankings</h3>
              {!loading && total > 0 && (
                <span className="text-xs bg-[#4F46E5]/10 text-[#4F46E5] px-2 py-0.5 rounded-full font-semibold">
                  {total} entries
                </span>
              )}
              {/* Inform admins that rank is computed — no manual adjustment possible */}
              <span className="text-xs text-muted-foreground hidden sm:block">
                Auto-ranked by score ↓ then time ↑
              </span>
            </div>
            <div className="flex gap-1">
              {(["all", "daily", "weekly", "monthly"] as TimePeriod[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActivePeriod(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                    activePeriod === t
                      ? "bg-[#4F46E5] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#4F46E5] mb-3" />
              <p className="text-muted-foreground text-sm">Loading rankings…</p>
            </div>
          ) : total === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3 opacity-30">📊</div>
              <p className="text-muted-foreground text-sm">
                {activePeriod === "all"
                  ? "No participants yet. Complete the quiz flow to see rankings."
                  : `No entries for the ${activePeriod} period.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Rank", "Name", "Mobile", "Email", "Score", "Time", "Date", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((p, i) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">{rankBadge(p.rank ?? i + 1)}</td>
                      <td className="px-5 py-3.5 font-medium text-sm">{p.participant_name || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {maskMobile(p.participant_mobile || "")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground truncate max-w-[140px]">
                        {p.participant_email || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {/* FIX: total_questions */}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          scorePillClass(Number(p.score) || 0, Number(p.total_questions) || 5)
                        }`}>
                          {p.score ?? 0}/{p.total_questions ?? 5}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">
                        {fmtTime(p.time_taken)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {fmtDate(p.completed_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        {/* Adjust removed: rank is computed by the view, cannot be manually set */}
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-xs px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}