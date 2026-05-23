import { useState, useEffect } from "react";
import { Download, Trophy, Users, Clock, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useStore } from "../../../store/StoreContext";
import { QUESTIONS } from "../../../store/questions";
import { maskMobile } from "../../../store/utils";
import { Participant } from "../../../types";
import { getLeaderboard, deleteLeaderboardEntry, adjustLeaderboardRank } from "../../lib/api";

type TimePeriod = "all" | "daily" | "weekly" | "monthly";

export function AdminLeaderboard() {
  const { participants: storeParticipants = [] } = useStore();

  const [activePeriod, setActivePeriod] = useState<TimePeriod>("all");
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [adjustModal, setAdjustModal] = useState<any | null>(null);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustNewRank, setAdjustNewRank] = useState(1);

  const totalPart = entries.length || storeParticipants.length;

  // Safe Stats Calculations
  const dataSource = entries.length ? entries : storeParticipants;

  const avgScore = totalPart
    ? (dataSource.reduce((a: number, p: any) => a + (Number(p?.score) || 0), 0) / totalPart).toFixed(1)
    : "—";

  const perfectScores = (entries.length ? entries : storeParticipants).filter((p: any) =>
    Number(p?.score) === Number(p?.totalQuestions)
  ).length;

  const avgTimeSec = totalPart
    ? Math.round((entries.length ? entries : storeParticipants).reduce((a: number, p: any) => a + (Number(p?.timeSec) || 0), 0) / totalPart)
    : 0;

  const avgTimeStr = totalPart
    ? `${Math.floor(avgTimeSec / 60)}:${String(avgTimeSec % 60).padStart(2, "0")}`
    : "—";

  // Safe Question Analysis
  const questionAnalysis = Array.isArray(QUESTIONS)
    ? QUESTIONS.map((q: any, i: number) => ({
        question: `Q${i + 1}`,
        label: (q?.text || "Question").slice(0, 20) + "…",
        correct: totalPart
          ? Math.round(
              dataSource.filter((p: any) =>
                Array.isArray(p?.answers) && p.answers[i] === q?.correctAnswer
              ).length / totalPart * 100
            )
          : 0,
        difficulty: q?.difficulty || "medium",
      }))
    : [];

  useEffect(() => {
    fetchEntries();
  }, [activePeriod]);

  async function fetchEntries() {
    setLoadingEntries(true);
    try {
      // fetch up to 200 entries for admin view
      const data = await getLeaderboard(undefined, 200);
      setEntries(data || []);
    } catch (err) {
      console.error("Failed to load leaderboard entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this leaderboard entry? This cannot be undone.")) return;
    try {
      await deleteLeaderboardEntry(id);
      await fetchEntries();
    } catch (err) {
      console.error("Failed to delete entry:", err);
      alert("Failed to delete entry.");
    }
  };

  const handleApplyAdjustment = async (entryId: string | number, newRank: number) => {
    try {
      const entry = entries.find((e) => e.id === entryId) || storeParticipants.find((e: any) => e.id === entryId);
      const campaignId = entry?.campaign_id || entry?.campaignId || undefined;
      await adjustLeaderboardRank(campaignId as string, String(entryId), newRank);
      await fetchEntries();
      setAdjustModal(null);
    } catch (err) {
      console.error("Failed to adjust rank:", err);
      alert("Failed to adjust rank.");
    }
  };

  const exportCSV = () => {
    if (!dataSource.length) return;
    const headers = ["Rank", "Name", "Mobile", "Email", "Score", "Time", "Date", "SessionID"];
    const rows = dataSource.map((p: any, i: number) => [
      p?.rank || i + 1,
      p?.participant_name || p?.name || "",
      p?.participant_mobile || p?.mobile || "",
      p?.participant_email || p?.email || "",
      `${p?.score || 0}/${p?.total ?? p?.totalQuestions ?? 5}`,
      p?.time_taken ? `${Math.floor(p.time_taken/60)}:${String(p.time_taken%60).padStart(2,'0')}` : p?.timeStr || "",
      p?.created_at || p?.date || "",
      p?.session_id || p?.sessionId || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "leaderboard.csv";
    a.click();
  };

  const scorePillClass = (score: number, total: number) => {
    if (score === total) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (score >= total / 2) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
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
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
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
          <p className="text-sm text-muted-foreground">Summer Quiz Challenge 2025</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Participants", value: totalPart, icon: <Users className="w-4 h-4" />, sub: "Completed quiz" },
            { label: "Avg Score", value: totalPart ? `${avgScore}/5` : "—", icon: <Target className="w-4 h-4" />, sub: "Out of 5 questions" },
            { label: "Perfect Scores", value: perfectScores, icon: <Trophy className="w-4 h-4" />, sub: "5/5 correct" },
            { label: "Avg Time", value: avgTimeStr, icon: <Clock className="w-4 h-4" />, sub: "To complete" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#4F46E5] mb-2 text-sm">
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
          {/* Question Analysis */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-1">Question Difficulty Analysis</h3>
            <p className="text-xs text-muted-foreground mb-4">% correct per question</p>
            {totalPart === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={questionAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="question" fontSize={12} />
                  <YAxis fontSize={12} domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="correct" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Participation Funnel */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-1">Participation Funnel</h3>
            <p className="text-xs text-muted-foreground mb-4">Drop-off at each stage</p>
            <div className="space-y-3">
              {[
                { stage: "QR Scan / Visit", count: Math.max(totalPart + Math.floor(totalPart * 0.4), 0), pct: 100 },
                { stage: "Registered", count: Math.max(totalPart + Math.floor(totalPart * 0.05), 0), pct: totalPart > 0 ? 94 : 0 },
                { stage: "OTP Verified", count: Math.max(totalPart + 2, 0), pct: totalPart > 0 ? 89 : 0 },
                { stage: "Started Quiz", count: Math.max(totalPart + 1, 0), pct: totalPart > 0 ? 85 : 0 },
                { stage: "Completed Quiz", count: totalPart, pct: totalPart > 0 ? 79 : 0 },
              ].map((item) => (
                <div key={item.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.stage}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4F46E5] rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-lg">Rankings</h3>
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

          {totalPart === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3 opacity-30">📊</div>
              <p className="text-muted-foreground text-sm">
                No participants yet. Complete the quiz flow to see rankings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rank</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mobile</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(entries.length ? entries : storeParticipants).map((p: any, i: number) => (
                    <tr key={p?.id || i} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">{rankBadge(p?.rank ?? i + 1)}</td>
                      <td className="px-5 py-3.5 font-medium text-sm">{p?.participant_name || p?.name || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {maskMobile(p?.participant_mobile || p?.mobile || "")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground truncate max-w-[140px]">
                        {p?.participant_email || p?.email || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scorePillClass(p?.score || 0, p?.total ?? 5)}`}>
                          {p?.score || 0}/{p?.total ?? 5}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">
                        {p?.time_taken ? `${Math.floor(p.time_taken / 60)}:${String(p.time_taken % 60).padStart(2, "0")}` : p?.timeStr || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{p?.created_at || p?.date || "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button className="text-xs px-3 py-1.5 border border-border hover:border-[#4F46E5] rounded-lg transition-colors">
                            Details
                          </button>
                          <button
                            onClick={() => {
                              setAdjustModal(p);
                              setAdjustNewRank(p?.rank ?? i + 1);
                              setAdjustReason("");
                            }}
                            className="text-xs px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg transition-colors"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleDelete(p?.id)}
                            className="text-xs px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Rank Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">Adjust Rank</h3>

            <div className="bg-muted/30 rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-0.5">Participant</p>
              <p className="font-semibold">{adjustModal.participant_name || adjustModal.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Current score: {adjustModal.score}/{adjustModal.total ?? (adjustModal.totalQuestions || 5)} · {adjustModal.time_taken ? `${Math.floor(adjustModal.time_taken/60)}:${String(adjustModal.time_taken%60).padStart(2,'0')}` : adjustModal.timeStr}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Move to Rank</label>
              <select
                aria-label="Move to rank"
                value={adjustNewRank}
                onChange={(e) => setAdjustNewRank(Number(e.target.value))}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
              >
                {Array.from({ length: Math.max(1, dataSource.length) }).map((_, i: number) => (
                  <option key={i + 1} value={i + 1}>#{i + 1}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Enter reason for manual adjustment..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 resize-none text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAdjustModal(null)}
                className="flex-1 py-3 border-2 border-border hover:border-[#4F46E5] rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!adjustReason.trim()}
                className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors disabled:opacity-40"
                onClick={() => handleApplyAdjustment(adjustModal.id, adjustNewRank)}
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}