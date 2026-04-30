"use client";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import {
  CheckCircle2, Clock, AlertTriangle, FolderKanban,
  Users, TrendingUp, ArrowUpRight, ListTodo, Zap, CalendarDays, Activity
} from "lucide-react";
import Link from "next/link";

interface ChartDay { date: string; completed: number; created: number }
interface UserProd { id: string; name: string; role: string; total_tasks: number; completed_tasks: number }
interface UpcomingTask { id: string; title: string; status: string; priority: string; due_date: string; assignee_name: string; project_title: string }
interface ActivityItem { id: string; user_name: string; action: string; entity_type: string; details: string; created_at: string }

interface Stats {
  tasks: { total: number; completed: number; in_progress: number; todo: number; overdue: number };
  allTasks: { total: number; completed: number; in_progress: number; todo: number; overdue: number };
  projects: number;
  users: number;
  chartData: ChartDay[];
  userProductivity: UserProd[];
  upcomingTasks: UpcomingTask[];
  recentActivity: ActivityItem[];
}

export default function DashboardPage() {
  return <AppLayout><DashboardContent /></AppLayout>;
}

function DashboardContent() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api<{ stats: Stats }>("/users/stats", { token }).then((res) => {
      if (res.data) setStats(res.data.stats);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <LoadingSkeleton />;
  if (!stats) return null;

  const kpiCards = [
    { label: "Total Tasks", value: stats.allTasks.total, icon: ListTodo, color: "#059669", bg: "bg-emerald-50 dark:bg-emerald-500/10", change: "+12%" },
    { label: "Completed", value: stats.allTasks.completed, icon: CheckCircle2, color: "#22c55e", bg: "bg-green-50 dark:bg-green-500/10", change: `${stats.allTasks.total ? Math.round((stats.allTasks.completed / stats.allTasks.total) * 100) : 0}%` },
    { label: "In Progress", value: stats.allTasks.in_progress, icon: Clock, color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", change: "Active" },
    { label: "Overdue", value: stats.allTasks.overdue, icon: AlertTriangle, color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10", change: stats.allTasks.overdue > 0 ? "Needs attention" : "All clear" },
  ];

  const completionRate = stats.allTasks.total ? Math.round((stats.allTasks.completed / stats.allTasks.total) * 100) : 0;

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #059669, #f59e0b)" }}>
              {user?.name?.split(" ")[0]}
            </span>
          </h1>
          <p className="text-surface-500 mt-1">Here&apos;s your project overview for today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/calendar" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 rounded-xl text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-all">
            <CalendarDays className="w-4 h-4" /> Calendar
          </Link>
          <Link href="/projects" className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium">
            <FolderKanban className="w-4 h-4" /> Projects <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((stat, i) => (
          <div key={stat.label} className="card-hover bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</p>
                <p className="text-xs mt-1.5 font-medium" style={{ color: stat.color }}>{stat.change}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Line Chart — Task Activity */}
        <div className="lg:col-span-3 bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Task Activity
            </h2>
            <span className="text-xs text-surface-400 font-medium">Last 7 days</span>
          </div>
          <LineChart data={stats.chartData} />
        </div>

        {/* Donut Chart — Status Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Status Distribution
          </h2>
          <DonutChart
            completed={stats.allTasks.completed}
            inProgress={stats.allTasks.in_progress}
            todo={stats.allTasks.todo}
            overdue={stats.allTasks.overdue}
          />
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Progress */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
          <h2 className="text-lg font-semibold mb-4">Project Completion</h2>
          <div className="flex items-center justify-center py-2">
            <CircularProgress value={completionRate} size={140} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-lg font-bold text-emerald-600">{stats.allTasks.completed}</p>
              <p className="text-[11px] text-surface-500 font-medium">Done</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-lg font-bold text-amber-500">{stats.allTasks.in_progress}</p>
              <p className="text-[11px] text-surface-500 font-medium">Active</p>
            </div>
            <div className="text-center p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-lg font-bold text-surface-400">{stats.allTasks.todo}</p>
              <p className="text-[11px] text-surface-500 font-medium">Todo</p>
            </div>
          </div>
        </div>

        {/* Team Productivity */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Team Performance
          </h2>
          <div className="space-y-3">
            {stats.userProductivity.map((u) => {
              const pct = u.total_tasks ? Math.round((u.completed_tasks / u.total_tasks) * 100) : 0;
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                    <span className="text-white text-xs font-semibold">{u.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{u.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                          {u.role}
                        </span>
                        <span className="text-xs text-surface-500 font-medium">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(135deg, #059669, #f59e0b)" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" /> Upcoming Deadlines
          </h2>
          {stats.upcomingTasks.length === 0 ? (
            <EmptyState icon={CalendarDays} text="No upcoming deadlines" sub="Tasks due in the next 7 days will appear here" />
          ) : (
            <div className="space-y-2.5">
              {stats.upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-surface-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-surface-400">{task.project_title} • {task.assignee_name || 'Unassigned'}</p>
                  </div>
                  <span className="text-xs text-surface-500 shrink-0">{new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Stats */}
        {user?.role === "admin" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800 flex items-center gap-4 card-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-emerald-600" />
              </div>
              <div><p className="text-2xl font-bold">{stats.projects}</p><p className="text-sm text-surface-500">Active Projects</p></div>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800 flex items-center gap-4 card-hover">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div><p className="text-2xl font-bold">{stats.users}</p><p className="text-sm text-surface-500">Team Members</p></div>
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className={`bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 ${user?.role !== 'admin' ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" /> Activity Timeline
          </h2>
          {stats.recentActivity.length === 0 ? (
            <EmptyState icon={Activity} text="No recent activity" sub="Actions will be recorded here" />
          ) : (
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-surface-200 dark:bg-surface-700" />
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 8).map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3.5 relative animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="w-[22px] h-[22px] rounded-full bg-emerald-100 dark:bg-emerald-500/15 border-2 border-white dark:border-surface-900 flex items-center justify-center z-10 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-sm"><span className="font-semibold text-emerald-800 dark:text-emerald-400">{a.user_name}</span> <span className="text-surface-500">{a.details}</span></p>
                      <p className="text-[11px] text-surface-400 mt-0.5">{new Date(a.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== SVG Chart Components ========== */

function LineChart({ data }: { data: ChartDay[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.completed, d.created)), 1);
  const w = 100, h = 50, padX = 2, padY = 5;
  const xStep = (w - padX * 2) / (data.length - 1 || 1);

  const toPoint = (val: number, i: number) => ({
    x: padX + i * xStep,
    y: padY + (h - padY * 2) - (val / maxVal) * (h - padY * 2),
  });

  const makePath = (key: 'completed' | 'created') =>
    data.map((d, i) => {
      const p = toPoint(d[key], i);
      return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`;
    }).join(' ');

  const makeArea = (key: 'completed' | 'created') => {
    const path = makePath(key);
    const lastI = data.length - 1;
    return `${path} L${padX + lastI * xStep},${h - padY} L${padX},${h - padY} Z`;
  };

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 8}`} className="w-full h-48">
        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1={padX} x2={w - padX} y1={padY + i * ((h - padY * 2) / 3)} y2={padY + i * ((h - padY * 2) / 3)}
            stroke="currentColor" strokeWidth="0.15" className="text-surface-200 dark:text-surface-700" />
        ))}
        {/* Created area */}
        <path d={makeArea('created')} fill="url(#createdGrad)" opacity="0.15" />
        <path d={makePath('created')} fill="none" stroke="#f59e0b" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Completed area */}
        <path d={makeArea('completed')} fill="url(#completedGrad)" opacity="0.2" />
        <path d={makePath('completed')} fill="none" stroke="#059669" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {data.map((d, i) => {
          const pc = toPoint(d.completed, i);
          const pp = toPoint(d.created, i);
          return (
            <g key={i}>
              <circle cx={pc.x} cy={pc.y} r="1" fill="#059669" />
              <circle cx={pp.x} cy={pp.y} r="1" fill="#f59e0b" />
            </g>
          );
        })}
        {/* Labels */}
        {data.map((d, i) => {
          const x = padX + i * xStep;
          return <text key={i} x={x} y={h + 5} textAnchor="middle" className="fill-surface-400" style={{ fontSize: '2.5px' }}>
            {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
          </text>;
        })}
        <defs>
          <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600" /><span className="text-xs text-surface-500">Completed</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-xs text-surface-500">Created</span></div>
      </div>
    </div>
  );
}

function DonutChart({ completed, inProgress, todo, overdue }: { completed: number; inProgress: number; todo: number; overdue: number }) {
  const total = completed + inProgress + todo + overdue || 1;
  const segments = [
    { value: completed, color: '#22c55e', label: 'Completed' },
    { value: inProgress, color: '#f59e0b', label: 'In Progress' },
    { value: todo, color: '#94a3b8', label: 'Todo' },
    { value: overdue, color: '#ef4444', label: 'Overdue' },
  ];

  let currentAngle = -90;
  const radius = 42, cx = 60, cy = 60, strokeW = 14;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {segments.map((seg, i) => {
            if (seg.value === 0) return null;
            const angle = (seg.value / total) * 360;
            const startRad = (currentAngle * Math.PI) / 180;
            const endRad = ((currentAngle + angle) * Math.PI) / 180;
            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);
            const largeArc = angle > 180 ? 1 : 0;
            currentAngle += angle;
            return (
              <path key={i}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none" stroke={seg.color} strokeWidth={strokeW} strokeLinecap="round"
                className="transition-all duration-1000" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-[11px] text-surface-500">Total</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-surface-500">{s.label} <span className="font-semibold text-surface-700 dark:text-surface-300">{s.value}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-100 dark:text-surface-800" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#progressGrad)" strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{value}%</span>
        <span className="text-[11px] text-surface-500">Complete</span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub }: { icon: typeof CheckCircle2; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-surface-300" />
      </div>
      <p className="text-sm font-medium text-surface-500">{text}</p>
      <p className="text-xs text-surface-400 mt-1">{sub}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div><div className="skeleton h-8 w-64 mb-2" /><div className="skeleton h-4 w-48" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 skeleton h-72 rounded-2xl" />
        <div className="lg:col-span-2 skeleton h-72 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}
