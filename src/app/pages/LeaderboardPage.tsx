import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, RefreshCw, Search, Download } from "lucide-react";
import { supabase } from "./RegistrationPage";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  score: number;
  total_questions: number;
  time_taken: number;
  completed_at: string;
}

interface LeaderboardStats {
  entries: LeaderboardEntry[];
  userRank: number;
  userScore: number;
  userTime: number;
  totalParticipants: number;
  avgScore: number;
  fastestTime: number;
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Fetch leaderboard data based on time period
  useEffect(() => {
    fetchLeaderboardData();
  }, [activeTab, campaignId]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("sb_user_id");
      const now = new Date();
      let startDate = new Date();

      // Calculate date range based on active tab
      if (activeTab === "daily") {
        startDate.setHours(0, 0, 0, 0);
      } else if (activeTab === "weekly") {
        const day = now.getDay();
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      } else if (activeTab === "monthly") {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (activeTab === "yearly") {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
      }

      // Fetch all responses for the campaign in the date range
      const { data: responses, error } = await supabase
        .from("responses")
        .select(
          `
          id,
          score,
          time_taken,
          completed_at,
          participants (
            id,
            full_name,
            email
          )
        `
        )
        .eq("campaign_id", campaignId)
        .gte("completed_at", startDate.toISOString())
        .lte("completed_at", now.toISOString())
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (error) throw error;

      // Transform data and calculate statistics
      const entries: LeaderboardEntry[] = (responses || [])
        .map((r: any) => ({
          id: r.id,
          full_name: r.participants?.full_name || "Anonymous",
          score: r.score || 0,
          total_questions: 5, // Default or fetch from campaign
          time_taken: r.time_taken || 0,
          completed_at: r.completed_at,
        }))
        .slice(0, 100); // Top 100

      // Calculate user's rank and stats
      const userEntry = entries.find((e) => e.id === userId);
      const userRank = userEntry ? entries.findIndex((e) => e.id === userId) + 1 : 0;
      const userScore = userEntry?.score || 0;
      const userTime = userEntry?.time_taken || 0;

      const avgScore =
        entries.length > 0
          ? Math.round((entries.reduce((sum, e) => sum + e.score, 0) / entries.length) * 10) / 10
          : 0;

      const fastestTime =
        entries.length > 0
          ? Math.min(...entries.map((e) => e.time_taken))
          : 0;

      setLeaderboardData({
        entries,
        userRank,
        userScore,
        userTime,
        totalParticipants: entries.length,
        avgScore,
        fastestTime,
      });
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      // Fallback to mock data on error
      setLeaderboardData({
        entries: [],
        userRank: 0,
        userScore: 0,
        userTime: 0,
        totalParticipants: 0,
        avgScore: 0,
        fastestTime: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#4F46E5]/30 border-t-[#4F46E5] rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load leaderboard</p>
      </div>
    );
  }

  const top3 = leaderboardData.entries.slice(0, 3);
  const rest = leaderboardData.entries.slice(3);
  const totalPages = Math.ceil(rest.length / itemsPerPage);
  const paginatedRest = rest.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredEntries = leaderboardData.entries.filter((entry) =>
    entry.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/campaign/${campaignId}/results`)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">Leaderboard</h3>
          </div>
          <button
            onClick={fetchLeaderboardData}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Time Period Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border overflow-x-auto">
          {(["daily", "weekly", "monthly", "yearly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`py-3 px-4 text-sm font-semibold uppercase relative whitespace-nowrap ${
                activeTab === tab ? "text-[#4F46E5]" : "text-muted-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5]"></div>
              )}
            </button>
          ))}
        </div>

        {/* User's Rank Card */}
        {leaderboardData.userRank > 0 ? (
          <div className="bg-[#4F46E5]/10 border-l-4 border-[#4F46E5] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Rank</p>
                <p className="text-2xl font-bold text-foreground">#{leaderboardData.userRank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{leaderboardData.userScore}/5</p>
                <p className="text-xs text-muted-foreground">{formatTime(leaderboardData.userTime)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 border-l-4 border-muted rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">Complete the quiz to appear on the leaderboard</p>
          </div>
        )}

        {/* Top 3 Podium */}
        {top3.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center" style={{ width: "30%" }}>
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="w-full bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg p-4 text-center" style={{ height: "100px" }}>
                    <p className="font-bold text-sm truncate text-white">{top3[1].full_name}</p>
                    <p className="text-xs font-semibold text-white mt-1">{top3[1].score}/{top3[1].total_questions}</p>
                    <p className="text-xs text-white/80">{formatTime(top3[1].time_taken)}</p>
                  </div>
                  <div className="bg-gray-400 text-white font-bold text-lg py-1 w-full text-center rounded-b-lg">
                    2
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex flex-col items-center" style={{ width: "35%" }}>
                  <div className="text-4xl mb-2">👑</div>
                  <div className="w-full bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-lg p-4 text-center" style={{ height: "140px" }}>
                    <p className="font-bold text-sm truncate text-gray-900">{top3[0].full_name}</p>
                    <p className="text-xs font-semibold text-gray-900 mt-1">{top3[0].score}/{top3[0].total_questions}</p>
                    <p className="text-xs text-gray-800">{formatTime(top3[0].time_taken)}</p>
                  </div>
                  <div className="bg-yellow-600 text-white font-bold text-lg py-1 w-full text-center rounded-b-lg">
                    1
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center" style={{ width: "30%" }}>
                  <div className="text-3xl mb-2">🥉</div>
                  <div className="w-full bg-gradient-to-b from-orange-300 to-orange-500 rounded-t-lg p-4 text-center" style={{ height: "80px" }}>
                    <p className="font-bold text-sm truncate text-white">{top3[2].full_name}</p>
                    <p className="text-xs font-semibold text-white mt-1">{top3[2].score}/{top3[2].total_questions}</p>
                    <p className="text-xs text-white/80">{formatTime(top3[2].time_taken)}</p>
                  </div>
                  <div className="bg-orange-600 text-white font-bold text-lg py-1 w-full text-center rounded-b-lg">
                    3
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground mb-8">
            <p>No participants yet in {activeTab} leaderboard</p>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-2">Rank</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Date</div>
          </div>

          {/* Table Rows */}
          {paginatedRest.length > 0 ? (
            paginatedRest.map((entry, idx) => (
              <div
                key={entry.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 ${
                  leaderboardData.userRank === idx + 4 ? "bg-[#4F46E5]/5" : ""
                }`}
              >
                <div className="col-span-2 font-semibold">#{idx + 4}</div>
                <div className="col-span-4 truncate">{entry.full_name}</div>
                <div className="col-span-2 font-semibold">{entry.score}/{entry.total_questions}</div>
                <div className="col-span-2 text-muted-foreground">{formatTime(entry.time_taken)}</div>
                <div className="col-span-2 text-muted-foreground text-sm">
                  {new Date(entry.completed_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <p>No entries found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">👥</div>
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">{leaderboardData.totalParticipants}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
            <p className="text-lg font-bold">{leaderboardData.avgScore}/5</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs text-muted-foreground mb-1">Fastest</p>
            <p className="text-lg font-bold">{formatTime(leaderboardData.fastestTime)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
