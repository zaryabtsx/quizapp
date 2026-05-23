import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Target, HelpCircle, Trophy, Settings, LogOut, Bell, ChevronDown } from "lucide-react";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Target, label: "Campaigns", path: "/admin/campaigns" },
    { icon: HelpCircle, label: "Questions Bank", path: "/admin/questions" },
    { icon: Trophy, label: "Leaderboards", path: "/admin/leaderboard" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1F2937] text-white flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#374151]">
          <h1 className="text-lg font-bold">Quiz Platform</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                  isActive(item.path)
                    ? "bg-[#4F46E5] text-white"
                    : "text-gray-300 hover:bg-[#374151]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-px bg-[#374151] my-4"></div>

          <button
            onClick={() => navigate("/admin/login")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-[#374151] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#374151]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">Admin User</p>
              <p className="text-xs text-gray-400 truncate">admin@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Good morning, Admin</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Date Range Selector */}
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm">
              Last 7 days
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <button 
              className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted\"
              title="User menu"
              aria-label="Open user menu"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full"></span>
            </button>

            {/* Avatar */}
            <button className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-semibold">
              A
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 flex justify-around z-20">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                isActive(item.path) ? "text-[#4F46E5]" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
