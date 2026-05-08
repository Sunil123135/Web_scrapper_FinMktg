import { UserButton } from "@clerk/clerk-react";
import { BarChart3, FileText, Link2, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/sources", label: "Sources", icon: Link2 },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/brief", label: "Brief", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-blue text-sm font-bold text-white">
            SS
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">ScrapeSignal</h1>
          <p className="mt-1 text-sm text-slate-600">Daily signal from scattered sources.</p>
        </div>
        <nav className="space-y-2" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                )
              }
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-slate-200 p-3">
          <span className="text-sm font-semibold text-slate-900">Account</span>
          <UserButton />
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ScrapeSignal</p>
            <h1 className="text-lg font-bold text-slate-900">Daily Brief Builder</h1>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="pb-24 lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white lg:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "focus-ring flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold",
                isActive ? "text-accent-blue" : "text-slate-500",
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
