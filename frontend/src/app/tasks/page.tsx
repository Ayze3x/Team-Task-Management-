"use client";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, X, Loader2, CheckCircle2, Clock, AlertTriangle,
  Filter, Trash2, Edit3, GripVertical, Calendar, User as UserIcon
} from "lucide-react";
import toast from "react-hot-toast";

interface Task {
  id: string; title: string; description: string; status: string;
  priority: string; due_date: string; project_id: string;
  project_title: string; assigned_to: string; assignee_name: string;
  created_by: string;
}
interface Project { id: string; title: string }
interface UserItem { id: string; name: string; email: string }

export default function TasksPage() {
  return <AppLayout><TasksContent /></AppLayout>;
}

function TasksContent() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState({ status: "", project: "" });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    let url = "/tasks?";
    if (filter.status) url += `status=${filter.status}&`;
    if (filter.project) url += `project_id=${filter.project}&`;
    const [tRes, pRes, uRes] = await Promise.all([
      api<{ tasks: Task[] }>(url, { token }),
      api<{ projects: Project[] }>("/projects", { token }),
      api<{ users: UserItem[] }>("/users", { token }),
    ]);
    if (tRes.data) setTasks(tRes.data.tasks);
    if (pRes.data) setProjects(pRes.data.projects);
    if (uRes.data) setUsers(uRes.data.users);
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (taskId: string, status: string) => {
    const res = await api(`/tasks/${taskId}`, { method: "PUT", body: { status }, token: token! });
    if (!res.error) { toast.success("Status updated"); fetchData(); }
    else toast.error(res.message || "Failed");
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    const res = await api(`/tasks/${taskId}`, { method: "DELETE", token: token! });
    if (!res.error) { toast.success("Task deleted"); fetchData(); }
    else toast.error(res.message || "Failed");
  };

  // Drag and drop handlers
  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragEnd = () => { setDraggedTask(null); setDragOverCol(null); };
  const handleDragOver = (e: React.DragEvent, col: string) => { e.preventDefault(); setDragOverCol(col); };
  const handleDrop = (col: string) => {
    if (draggedTask && draggedTask.status !== col) {
      updateStatus(draggedTask.id, col);
    }
    setDraggedTask(null);
    setDragOverCol(null);
  };

  const columns = [
    { key: "todo", label: "To Do", color: "#94a3b8", borderColor: "border-surface-300 dark:border-surface-600", icon: <div className="w-4 h-4 rounded-full border-2 border-surface-300" /> },
    { key: "in-progress", label: "In Progress", color: "#f59e0b", borderColor: "border-amber-400", icon: <Clock className="w-4 h-4 text-amber-500" /> },
    { key: "completed", label: "Completed", color: "#22c55e", borderColor: "border-emerald-400", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  ];

  if (loading) return <div className="space-y-3 pt-12 lg:pt-0">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-surface-500 mt-1">{tasks.length} task{tasks.length !== 1 ? "s" : ""} • Drag cards between columns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-surface-900 rounded-xl p-3 border border-surface-200 dark:border-surface-800">
        <Filter className="w-4 h-4 text-surface-400" />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="text-sm px-3 py-1.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filter.project} onChange={e => setFilter(f => ({ ...f, project: e.target.value }))}
          className="text-sm px-3 py-1.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {(filter.status || filter.project) && (
          <button onClick={() => setFilter({ status: "", project: "" })} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Clear Filters</button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          const isDragOver = dragOverCol === col.key && draggedTask?.status !== col.key;
          return (
            <div key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.key)}
              className={`rounded-2xl p-4 transition-all duration-200 min-h-[300px]
                ${isDragOver
                  ? 'bg-emerald-50/80 dark:bg-emerald-500/5 ring-2 ring-emerald-400/30 ring-dashed'
                  : 'bg-surface-50/60 dark:bg-surface-900/30'}
              `}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400">{col.label}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: col.color + '18', color: col.color }}>{colTasks.length}</span>
              </div>

              {/* Task Cards */}
              <div className="space-y-2.5">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-2">
                      {col.key === 'todo' ? <AlertTriangle className="w-5 h-5 text-surface-300" /> :
                       col.key === 'in-progress' ? <Clock className="w-5 h-5 text-surface-300" /> :
                       <CheckCircle2 className="w-5 h-5 text-surface-300" />}
                    </div>
                    <p className="text-xs text-surface-400 font-medium">No {col.label.toLowerCase()} tasks</p>
                    <p className="text-[11px] text-surface-300 mt-0.5">Drag tasks here</p>
                  </div>
                ) : colTasks.map(task => (
                  <TaskCard key={task.id} task={task} user={user}
                    onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                    onStatusChange={updateStatus} onDelete={deleteTask}
                    onEdit={setEditTask} isDragging={draggedTask?.id === task.id} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && <TaskModal projects={projects} users={users} token={token!} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchData(); }} />}
      {editTask && <TaskModal task={editTask} projects={projects} users={users} token={token!} onClose={() => setEditTask(null)} onSaved={() => { setEditTask(null); fetchData(); }} />}
    </div>
  );
}

/* ========== Task Card ========== */
function TaskCard({ task, user, onDragStart, onDragEnd, onStatusChange, onDelete, onEdit, isDragging }: {
  task: Task; user: { id: string; role: string } | null;
  onDragStart: (t: Task) => void; onDragEnd: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void; onEdit: (t: Task) => void;
  isDragging: boolean;
}) {
  const priorityStyles: Record<string, { bg: string; text: string; dot: string }> = {
    high: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    low: { bg: 'bg-surface-100 dark:bg-surface-800', text: 'text-surface-500', dot: 'bg-surface-400' },
  };
  const ps = priorityStyles[task.priority] || priorityStyles.low;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-surface-900 rounded-xl p-4 border border-surface-200 dark:border-surface-800 group cursor-grab active:cursor-grabbing transition-all duration-200
        ${isDragging ? 'opacity-40 scale-95 rotate-1' : 'hover:shadow-md hover:-translate-y-0.5'}
      `}
    >
      {/* Top row: grip + priority + actions */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${ps.bg} ${ps.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
            {task.priority}
          </span>
          {isOverdue && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-emerald-600 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {(user?.role === "admin" || task.created_by === user?.id) && (
            <button onClick={() => onDelete(task.id)} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className={`text-sm font-semibold leading-snug mb-2 ${task.status === 'completed' ? 'line-through text-surface-400' : 'text-surface-800 dark:text-surface-100'}`}>
        {task.title}
      </h4>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
          {task.assignee_name ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                {task.assignee_name.charAt(0)}
              </div>
              <span className="text-[11px] text-surface-500 truncate max-w-[80px]">{task.assignee_name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-surface-400">
              <UserIcon className="w-3.5 h-3.5" /> Unassigned
            </div>
          )}
        </div>

        {/* Due date */}
        {task.due_date && (
          <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-500 font-semibold' : 'text-surface-400'}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

      {/* Project tag */}
      <div className="mt-2.5 pt-2.5 border-t border-surface-100 dark:border-surface-800">
        <span className="text-[11px] text-surface-400 font-medium">{task.project_title}</span>
      </div>
    </div>
  );
}

/* ========== Task Modal ========== */
function TaskModal({ task, projects, users, token, onClose, onSaved }: {
  task?: Task; projects: Project[]; users: UserItem[]; token: string; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "todo");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(task?.due_date?.split("T")[0] || "");
  const [projectId, setProjectId] = useState(task?.project_id || "");
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const body = { title, description, status, priority, due_date: dueDate || undefined, project_id: projectId || undefined, assigned_to: assignedTo || undefined };
    const res = task
      ? await api(`/tasks/${task.id}`, { method: "PUT", body, token })
      : await api("/tasks", { method: "POST", body, token });
    if (!res.error) { toast.success(task ? "Task updated!" : "Task created!"); onSaved(); }
    else { toast.error(res.message || "Failed"); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-800 animate-fade-in max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{task ? "Edit Task" : "Create Task"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task name"
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Details..."
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all resize-none" />
          </div>
          {!task && (
            <div>
              <label className="block text-sm font-semibold mb-1.5">Project</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none text-sm">
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none text-sm">
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Assign To</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none text-sm">
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none" />
          </div>
          <button type="submit" disabled={loading || !title.trim()}
            className="w-full py-2.5 btn-gradient text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{task ? "Update" : "Create"} Task</>}
          </button>
        </form>
      </div>
    </div>
  );
}
