import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, RefreshCw, Search, Download } from "lucide-react";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Priya Sharma", score: "5/5", time: "1:45", date: "May 22" },
  { rank: 2, name: "Amit Patel", score: "5/5", time: "2:12", date: "May 22" },
  { rank: 3, name: "Rajesh Kumar", score: "4/5", time: "2:35", date: "May 22" },
  { rank: 4, name: "Sneha Reddy", score: "4/5", time: "2:48", date: "May 22" },
  { rank: 5, name: "Vikram Singh", score: "4/5", time: "3:02", date: "May 22" },
  { rank: 6, name: "Anita Desai", score: "4/5", time: "3:15", date: "May 21" },
  { rank: 7, name: "Deepak Verma", score: "3/5", time: "2:20", date: "May 21" },
  { rank: 8, name: "Kavita Joshi", score: "3/5", time: "2:55", date: "May 21" },
  { rank: 9, name: "Sanjay Gupta", score: "3/5", time: "3:10", date: "May 21" },
  { rank: 10, name: "Meera Nair", score: "3/5", time: "3:30", date: "May 21" }
];

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUserRank = 3;

  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const rest = MOCK_LEADERBOARD.slice(3);

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
          <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Time Period Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border">
          {(["daily", "weekly", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold uppercase relative ${
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
        <div className="bg-[#4F46E5]/10 border-l-4 border-[#4F46E5] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Your Rank</p>
              <p className="text-2xl font-bold text-foreground">#{currentUserRank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">4/5</p>
              <p className="text-xs text-muted-foreground">2:35</p>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-8">
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center" style={{ width: "30%" }}>
              <div className="text-3xl mb-2">🥈</div>
              <div className="w-full bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg p-4 text-center" style={{ height: "100px" }}>
                <p className="font-bold text-sm truncate text-white">{top3[1].name}</p>
                <p className="text-xs font-semibold text-white mt-1">{top3[1].score}</p>
                <p className="text-xs text-white/80">{top3[1].time}</p>
              </div>
              <div className="bg-gray-400 text-white font-bold text-lg py-1 w-full text-center rounded-b-lg">
                2
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center" style={{ width: "35%" }}>
              <div className="text-4xl mb-2">👑</div>
              <div className="w-full bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-lg p-4 text-center" style={{ height: "140px" }}>
                <p className="font-bold text-sm truncate text-gray-900">{top3[0].name}</p>
                <p className="text-xs font-semibold text-gray-900 mt-1">{top3[0].score}</p>
                <p className="text-xs text-gray-800">{top3[0].time}</p>
              </div>
              <div className="bg-yellow-600 text-white font-bold text-lg py-1 w-full text-center rounded-b-lg">
                1
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center" style={{ width: "30%" }}>
              <div className="text-3xl mb-2">🥉</div>
              <div className="w-full bg-gradient-to-b from-orange-300 to-orange-500 rounded-t-lg p-4 text-center" style={{ height: "80px" }}>
                <p className="font-bold text-sm truncate text-white">{top3[2].name}</p>
                <p className="text-xs font-semibold text-white mt-1">{top3[2].score}</p>
                <p className="text-xs text-white/80">{top3[2].time}</p>
              </div>
              <div className="bg-orange-600 text-white font-bold text-lg py-1 w-full text-center rounded-b-lg">
                3
              </div>
            </div>
          </div>
        </div>

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
          {rest.map((entry) => (
            <div
              key={entry.rank}
              className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 ${
                entry.rank === currentUserRank ? "bg-[#4F46E5]/5" : ""
              }`}
            >
              <div className="col-span-2 font-semibold">#{entry.rank}</div>
              <div className="col-span-4 truncate">{entry.name}</div>
              <div className="col-span-2 font-semibold">{entry.score}</div>
              <div className="col-span-2 text-muted-foreground">{entry.time}</div>
              <div className="col-span-2 text-muted-foreground text-sm">{entry.date}</div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mb-6">
          <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page 1 of 5</span>
          <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted">
            Next
          </button>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">👥</div>
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">2,347</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
            <p className="text-lg font-bold">3.8/5</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs text-muted-foreground mb-1">Fastest</p>
            <p className="text-lg font-bold">45s</p>
          </div>
        </div>
      </div>
    </div>
  );
}
