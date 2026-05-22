import { AdminLayout } from "../../components/AdminLayout";
import { Users, Target, TrendingUp, Trophy, Plus, Upload, Eye } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const participantsData = [
  { date: "May 1", count: 120 },
  { date: "May 5", count: 180 },
  { date: "May 10", count: 250 },
  { date: "May 15", count: 320 },
  { date: "May 20", count: 410 },
  { date: "May 22", count: 480 },
];

const campaignData = [
  { name: "Summer Quiz 2024", participants: 1247, completion: 76 },
  { name: "Tech Knowledge Test", participants: 892, completion: 82 },
  { name: "General Awareness", participants: 654, completion: 68 },
  { name: "History Challenge", participants: 423, completion: 71 },
];

const activities = [
  { icon: "🎉", text: "John scored 5/5", time: "2 mins ago" },
  { icon: "📁", text: "New campaign 'Summer Quiz' created", time: "1 hour ago" },
  { icon: "📤", text: "500 questions uploaded", time: "yesterday" },
  { icon: "👑", text: "Weekly winner announced", time: "yesterday" },
];

export function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Participants */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#4F46E5]" />
              </div>
              <span className="text-xs px-2 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full font-semibold">
                ↑12%
              </span>
            </div>
            <p className="text-3xl font-bold mb-1">12,847</p>
            <p className="text-sm text-muted-foreground">Total Participants</p>
          </div>

          {/* Active Campaigns */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">8</p>
            <p className="text-sm text-muted-foreground">Active Campaigns</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-3xl font-bold">76%</p>
              <div className="flex-1">
                {/* Progress Ring */}
                <svg className="w-12 h-12" viewBox="0 0 36 36">
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
                    strokeDasharray="76, 100"
                  />
                </svg>
              </div>
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
            <p className="text-lg font-bold mb-1">Rajesh K.</p>
            <p className="text-sm text-muted-foreground">5/5 • Top Performer</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Participants Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={participantsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} dot={{ fill: "#4F46E5" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={campaignData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={12} width={120} />
                <Tooltip />
                <Bar dataKey="participants" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Campaign</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border hover:border-[#4F46E5] rounded-lg transition-colors">
                <Upload className="w-5 h-5" />
                <span className="font-medium">Upload Questions</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border hover:border-[#4F46E5] rounded-lg transition-colors">
                <Eye className="w-5 h-5" />
                <span className="font-medium">View Leaderboards</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
