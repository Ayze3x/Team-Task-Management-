"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Settings,
  LogOut, Zap, ChevronLeft, Menu, Shield, User, CalendarDays
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700">
        <Menu className="w-5 h-5 text-emerald-800" />
      </button>

      {/* Overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col transition-all duration-300 ease-out
        ${collapsed ? "w-[72px]" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-surface-200 dark:border-surface-800">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-400">TaskForge</span>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden lg:flex p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
            <ChevronLeft className={`w-4 h-4 text-surface-400 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 shadow-sm"
                    : "text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-emerald-800 dark:hover:text-surface-200"
                  }
                `}>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-surface-200 dark:border-surface-800">
          <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
              <span className="text-white text-sm font-semibold">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-emerald-900 dark:text-surface-100">{user?.name}</p>
                <div className="flex items-center gap-1">
                  {user?.role === "admin" ? <Shield className="w-3 h-3 text-amber-500" /> : <User className="w-3 h-3 text-surface-400" />}
                  <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout}
            className={`flex items-center gap-3 w-full mt-1 px-3 py-2.5 rounded-xl text-sm text-surface-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${collapsed ? "justify-center" : ""}`}>
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
