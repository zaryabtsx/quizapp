import { useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Download, RefreshCw, Calendar, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Priya Sharma", mobile: "98765****0", email: "priya@example.com", score: "5/5", time: "1:45", date: "May 22", sessionId: "sess_123" },
  { rank: 2, name: "Amit Patel", mobile: "98765****1", email: "amit@example.com", score: "5/5", time: "2:12", date: "May 22", sessionId: "sess_124" },
  { rank: 3, name: "Rajesh Kumar", mobile: "98765****2", email: "rajesh@example.com", score: "4/5", time: "2:35", date: "May 22", sessionId: "sess_125" },
  { rank: 4, name: "Sneha Reddy", mobile: "98765****3", email: "sneha@example.com", score: "4/5", time: "2:48", date: "May 22", sessionId: "sess_126" },
  { rank: 5, name: "Vikram Singh", mobile: "98765****4", email: "vikram@example.com", score: "4/5", time: "3:02", date: "May 22", sessionId: "sess_127" },
];

const questionAnalysis = [
  { question: "Q1", correct: 85 },
  { question: "Q2", correct: 78 },
  { question: "Q3", correct: 62 },
  { question: "Q4", correct: 45 },
  { question: "Q5", correct: 71 },
];

export function AdminLeaderboard() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<typeof MOCK_LEADERBOARD[0] | null>(null);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Leaderboard Management</h1>
          <p className="text-sm text-muted-foreground">View and manage campaign rankings</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              <select className="px-4 py-2 border border-border rounded-lg bg-input-background">
                <option>Summer Quiz Challenge 2024</option>
                <option>Tech Knowledge Test</option>
                <option>General Awareness</option>
              </select>
              
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                May 1 - May 31
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-medium transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Time Period Tabs */}
        <div className="flex gap-0 mb-6 border-b border-border">
          {(["daily", "weekly", "monthly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold uppercase relative ${
                activeTab === tab ? "text-[#4F46E5]" : "text-muted-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5]"></div>
              )}
            </button>
          ))}
          <div className="flex-1"></div>
          <div className="flex items-center gap-2 px-4">
            <button className="px-4 py-2 border-2 border-border hover:border-[#4F46E5] rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button className="px-4 py-2 border-2 border-border hover:border-[#4F46E5] rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button className="p-2 hover:bg-muted rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-1">Rank</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Mobile</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-1">Score</div>
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Table Rows */}
          {MOCK_LEADERBOARD.map((entry) => (
            <div key={entry.rank} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 hover:bg-muted/30">
              <div className="col-span-1 font-semibold">#{entry.rank}</div>
              <div className="col-span-2 truncate">{entry.name}</div>
              <div className="col-span-2 text-muted-foreground text-sm font-mono">{entry.mobile}</div>
              <div className="col-span-2 truncate text-sm">{entry.email}</div>
              <div className="col-span-1 font-semibold">{entry.score}</div>
              <div className="col-span-1 text-muted-foreground">{entry.time}</div>
              <div className="col-span-1 text-muted-foreground text-sm">{entry.date}</div>
              <div className="col-span-2 flex gap-2">
                <button className="px-3 py-1 text-xs border border-border hover:border-[#4F46E5] rounded-lg transition-colors">
                  View Details
                </button>
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowAdjustModal(true);
                  }}
                  className="px-3 py-1 text-xs bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg transition-colors"
                >
                  Adjust Rank
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Question Difficulty Analysis */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Question Difficulty Analysis</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={questionAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="question" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="correct" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Percentage of correct answers per question
            </p>
          </div>

          {/* Drop-off Analysis */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Participation Funnel</h3>
            <div className="space-y-3">
              {[
                { stage: "Scan QR", count: 2500, percentage: 100 },
                { stage: "Register", count: 2347, percentage: 94 },
                { stage: "Start Quiz", count: 2200, percentage: 88 },
                { stage: "Complete Q3", count: 1980, percentage: 79 },
                { stage: "Complete Quiz", count: 1785, percentage: 71 },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4F46E5] transition-all"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Winner History */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Previous Winners</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { period: "This Week", name: "Priya Sharma", score: "5/5", time: "1:45" },
              { period: "Last Week", name: "Amit Patel", score: "5/5", time: "2:01" },
              { period: "This Month", name: "Rajesh Kumar", score: "5/5", time: "1:38" },
            ].map((winner, index) => (
              <div key={index} className="border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">{winner.period}</p>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🏆"}</div>
                  <div>
                    <p className="font-semibold">{winner.name}</p>
                    <p className="text-sm text-muted-foreground">{winner.score} • {winner.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adjust Rank Modal */}
      {showAdjustModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Adjust Rank</h3>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Participant</p>
              <p className="font-semibold">{selectedEntry.name}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Current Rank</p>
              <p className="text-2xl font-bold">#{selectedEntry.rank}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">New Rank</label>
              <select className="w-full h-12 px-4 rounded-lg border border-border bg-input-background">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rank => (
                  <option key={rank} value={rank}>#{rank}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Reason (Required)</label>
              <textarea
                rows={3}
                placeholder="Enter reason for adjustment..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-3 border-2 border-border hover:border-[#4F46E5] rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-semibold transition-colors">
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
