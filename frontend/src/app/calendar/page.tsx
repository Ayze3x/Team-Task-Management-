"use client";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface CalTask {
  id: string; title: string; status: string; priority: string;
  due_date: string; assignee_name: string; project_title: string;
}

export default function CalendarPage() {
  return <AppLayout><CalendarContent /></AppLayout>;
}

function CalendarContent() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalTask[]>([]);
  const [loading, setLoading] = useState(true);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await api<{ tasks: CalTask[] }>(`/users/calendar?month=${month + 1}&year=${year}`, { token });
    if (res.data) setTasks(res.data.tasks);
    setLoading(false);
  }, [token, month, year]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date();
  const isToday = (day: number) => day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.due_date?.startsWith(dateStr));
  };

  const statusColor = (s: string) => {
    if (s === 'completed') return 'bg-emerald-500';
    if (s === 'in-progress') return 'bg-amber-500';
    return 'bg-surface-400';
  };

  const priorityBorder = (p: string) => {
    if (p === 'high') return 'border-l-red-500';
    if (p === 'medium') return 'border-l-amber-500';
    return 'border-l-surface-300';
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = currentDate.toLocaleString('en', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-surface-500 mt-1">View tasks by due date</p>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold ml-2">{monthName}</h2>
          </div>
          <button onClick={today} className="text-sm px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
            Today
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-surface-200 dark:border-surface-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const isTodayCell = day ? isToday(day) : false;
            return (
              <div key={i}
                className={`min-h-[100px] sm:min-h-[120px] p-1.5 border-b border-r border-surface-100 dark:border-surface-800 transition-colors
                  ${!day ? 'bg-surface-50/50 dark:bg-surface-950/30' : 'hover:bg-surface-50 dark:hover:bg-surface-800/30'}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                `}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                      ${isTodayCell ? 'bg-emerald-600 text-white' : 'text-surface-600 dark:text-surface-400'}
                    `}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map(task => (
                        <div key={task.id}
                          className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded border-l-2 truncate font-medium transition-colors
                            ${priorityBorder(task.priority)}
                            ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 line-through' :
                              task.status === 'in-progress' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                              'bg-surface-50 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}
                          `}
                          title={`${task.title} — ${task.assignee_name || 'Unassigned'} (${task.project_title})`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-[10px] text-surface-400 pl-1.5 font-medium">+{dayTasks.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500">
        <span className="font-semibold text-surface-600 dark:text-surface-300">Legend:</span>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-surface-400" /> Todo</div>
        <span className="mx-2 text-surface-300">|</span>
        <div className="flex items-center gap-1.5"><div className="w-1 h-3 rounded-full bg-red-500" /> High Priority</div>
        <div className="flex items-center gap-1.5"><div className="w-1 h-3 rounded-full bg-amber-500" /> Medium</div>
        <div className="flex items-center gap-1.5"><div className="w-1 h-3 rounded-full bg-surface-300" /> Low</div>
      </div>
    </div>
  );
}
