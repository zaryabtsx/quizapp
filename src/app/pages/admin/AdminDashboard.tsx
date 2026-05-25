// src/pages/admin/AdminDashboard.tsx
import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Users, Target, TrendingUp, Trophy, Plus, Upload, Eye, RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";
import type { ActivityLog } from "../../../types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopPerformer {
  participant_name: string;
  score: number;
  total: number;
}

interface DashboardStats {
  totalParticipants: number;   // registrations
  totalCompletions: number;    // finished quizzes
  activeCampaigns: number;
  completionRate: number;       // % of attempts that were fully submitted (not perfect-score %)
  topPerformer: TopPerformer | null;
  activities: ActivityLog[];
  participantsOverTime: { date: string; count: number }[];
  campaignPerf: { name: string; participants: number; completion: number }[];
}

const EMPTY_STATS: DashboardStats = {
  totalParticipants: 0,
  totalCompletions: 0,
  activeCampaigns: 0,
  completionRate: 0,
  topPerformer: null,
  activities: [],
  participantsOverTime: [],
  campaignPerf: [],
};

const ACTIVITY_ICONS: Record<string, string> = {
  campaign_created: "📁",
  question_uploaded: "📤",
  winner_announced: "👑",
  quiz_completed: "🎉",
};

const POLL_MS = 30_000; // Fallback polling interval

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className}`} />;
}

// ─── formatRelative ───────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchStats(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data as DashboardStats);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    pollingRef.current = setInterval(() => fetchStats(true), POLL_MS);

    // Real-time subscriptions — automatically refetch when data changes
    const participantsSubscription = supabase
      .channel("participants_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => fetchStats(true)
      )
      .subscribe();

    const quizAttemptsSubscription = supabase
      .channel("quiz_attempts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_attempts" },
        () => fetchStats(true)
      )
      .subscribe();

    const activityLogSubscription = supabase
      .channel("activity_log_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log" },
        () => fetchStats(true)
      )
      .subscribe();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      participantsSubscription.unsubscribe();
      quizAttemptsSubscription.unsubscribe();
      activityLogSubscription.unsubscribe();
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>⚠️ {error.message}</span>
            <button onClick={() => fetchStats()} className="underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Page header with live indicator */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-0.5">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {lastRefreshed
                ? `Last updated ${lastRefreshed.toLocaleTimeString()}`
                : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
            <button
              onClick={() => fetchStats()}
              disabled={loading}
              title="Refresh now"
              className="flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-lg hover:border-[#4F46E5] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Registrations vs Completions */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#4F46E5]" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-9 w-24 mb-2" />
            ) : (
              <p className="text-3xl font-bold mb-1">
                {stats.totalParticipants.toLocaleString()}
              </p>
            )}
            <p className="text-sm text-muted-foreground">Registered</p>
            {!loading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.totalCompletions.toLocaleString()} completed quiz
              </p>
            )}
          </div>

          {/* Active Campaigns */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-9 w-12 mb-2" />
            ) : (
              <p className="text-3xl font-bold mb-1">{stats.activeCampaigns}</p>
            )}
            <p className="text-sm text-muted-foreground">Active Campaigns</p>
          </div>

          {/* Completion Rate — now means "% of started quizzes that were submitted" */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              {loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <>
                  <p className="text-3xl font-bold">{stats.completionRate}%</p>
                  {/* Mini donut — always driven by the real value */}
                  <svg className="w-12 h-12 shrink-0" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeDasharray={`${stats.completionRate}, 100`}
                    />
                  </svg>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </div>

          {/* Top Performer */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <span className="text-2xl">🥇</span>
            </div>
            {loading ? (
              <Skeleton className="h-6 w-28 mb-2" />
            ) : (
              <p className="text-lg font-bold mb-1 truncate">
                {stats.topPerformer?.participant_name ?? "—"}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {stats.topPerformer
                ? `${stats.topPerformer.score}/${stats.topPerformer.total} • Top Performer`
                : "No data yet"}
            </p>
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Line Chart — Participants over 7 days */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Participants Over Time (7 days)</h3>
            {loading ? (
              <Skeleton className="h-64" />
            ) : stats.participantsOverTime.every((d) => d.count === 0) ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                <span className="text-3xl opacity-30">📈</span>
                No participation data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.participantsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ fill: "#4F46E5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart — Campaign performance */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
            {loading ? (
              <Skeleton className="h-64" />
            ) : stats.campaignPerf.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                <span className="text-3xl opacity-30">📊</span>
                No campaign data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.campaignPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#6B7280"
                    fontSize={11}
                    width={130}
                    tickFormatter={(v: string) =>
                      v.length > 18 ? v.slice(0, 18) + "…" : v
                    }
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "completion" ? [`${value}%`, "Completion"] : [value, "Participants"]
                    }
                  />
                  <Bar dataKey="participants" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Participants" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Recent Activity & Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              {!loading && stats.activities.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {stats.activities.length} event{stats.activities.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-4xl mb-3 opacity-30">📋</span>
                <p className="text-sm text-muted-foreground">No activity yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity appears here as users complete quizzes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.activities.map((activity: ActivityLog) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
                      {ACTIVITY_ICONS[activity.type] ?? "📌"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/admin/campaigns/new")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Campaign</span>
              </button>
              <button
                onClick={() => navigate("/admin/questions")}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border hover:border-[#4F46E5] rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Upload Questions</span>
              </button>
              <button
                onClick={() => navigate("/admin/leaderboard")}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border hover:border-[#4F46E5] rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span className="font-medium">View Leaderboards</span>
              </button>
            </div>

            {/* Mini leaderboard snapshot */}
            {!loading && stats.topPerformer && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Current Leader
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] font-bold text-sm">
                    {stats.topPerformer.participant_name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {stats.topPerformer.participant_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.topPerformer.score}/{stats.topPerformer.total} correct
                    </p>
                  </div>
                  <span className="text-xl">🥇</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}