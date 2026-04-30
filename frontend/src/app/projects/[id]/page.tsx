"use client";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Users, Plus, X, Loader2, CheckCircle2,
  Clock, AlertTriangle, UserMinus, Mail
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Member { id: string; name: string; email: string; system_role: string; project_role: string }
interface ProjectStats { total: number; completed: number; in_progress: number; todo: number; overdue: number }
interface Project {
  id: string; title: string; description: string; deadline: string;
  status: string; creator_name: string; members: Member[]; stats: ProjectStats;
}
interface Task {
  id: string; title: string; status: string; priority: string;
  due_date: string; assignee_name: string;
}

export default function ProjectDetailPage() {
  return <AppLayout><ProjectDetail /></AppLayout>;
}

function ProjectDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!token || !id) return;
    const [pRes, tRes] = await Promise.all([
      api<{ project: Project }>(`/projects/${id}`, { token }),
      api<{ tasks: Task[] }>(`/tasks?project_id=${id}`, { token }),
    ]);
    if (pRes.data) setProject(pRes.data.project);
    if (tRes.data) setTasks(tRes.data.tasks);
    setLoading(false);
  }, [token, id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    const res = await api(`/projects/${id}/members/${userId}`, { method: "DELETE", token: token! });
    if (!res.error) { toast.success("Member removed"); fetchProject(); }
    else toast.error(res.message || "Failed");
  };

  if (loading) return <div className="space-y-4 pt-12 lg:pt-0"><div className="skeleton h-12 w-48" /><div className="skeleton h-64 rounded-2xl" /></div>;
  if (!project) return <div className="pt-12 lg:pt-0"><p>Project not found</p></div>;

  const statusColors: Record<string, string> = {
    todo: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400",
    "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
        <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
        <p className="text-surface-500">{project.description || "No description"}</p>
        <div className="flex items-center gap-4 mt-4 text-sm text-surface-500">
          <span>Created by {project.creator_name}</span>
          {project.deadline && <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: project.stats.total, icon: CheckCircle2, color: "text-primary-500" },
          { label: "Completed", value: project.stats.completed, icon: CheckCircle2, color: "text-green-500" },
          { label: "In Progress", value: project.stats.in_progress, icon: Clock, color: "text-amber-500" },
          { label: "Overdue", value: project.stats.overdue, icon: AlertTriangle, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-surface-900 rounded-xl p-4 border border-surface-200 dark:border-surface-800 text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-surface-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <Link href={`/tasks?project=${id}`} className="text-sm text-primary-600 hover:text-primary-700">View All →</Link>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-center py-8 text-surface-400">No tasks yet</p>
            ) : tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.status === "completed" ? "bg-green-500" : task.status === "in-progress" ? "bg-amber-500" : "bg-surface-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-surface-400">{task.assignee_name || "Unassigned"}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[task.status] || ""}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-primary-500" /> Team</h2>
            {user?.role === "admin" && (
              <button onClick={() => setShowAddMember(true)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {project.members.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                  <span className="text-white text-xs font-semibold">{m.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-surface-400 capitalize">{m.project_role}</p>
                </div>
                {user?.role === "admin" && m.id !== user.id && (
                  <button onClick={() => removeMember(m.id)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal projectId={project.id} token={token!} onClose={() => setShowAddMember(false)} onAdded={() => { setShowAddMember(false); fetchProject(); }} />
      )}
    </div>
  );
}

function AddMemberModal({ projectId, token, onClose, onAdded }: { projectId: string; token: string; onClose: () => void; onAdded: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const res = await api(`/projects/${projectId}/members`, { method: "POST", body: { email }, token });
    if (!res.error) { toast.success("Member added!"); onAdded(); }
    else { toast.error(res.message || "Failed"); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 w-full max-w-sm border border-surface-200 dark:border-surface-800 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Add Member</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
          </div>
          <button type="submit" disabled={loading || !email.trim()}
            className="w-full py-2.5 btn-gradient text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Member</>}
          </button>
        </form>
      </div>
    </div>
  );
}
