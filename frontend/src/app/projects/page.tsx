"use client";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, FolderKanban, Users, CheckCircle2, AlertTriangle,
  Calendar, X, Loader2, Trash2
} from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string; title: string; description: string; deadline: string; status: string;
  creator_name: string; total_tasks: number; completed_tasks: number;
  overdue_tasks: number; member_count: number; created_at: string;
}

export default function ProjectsPage() {
  return <AppLayout><ProjectsContent /></AppLayout>;
}

function ProjectsContent() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    const res = await api<{ projects: Project[] }>("/projects", { token });
    if (res.data) setProjects(res.data.projects);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    const res = await api("/projects/" + id, { method: "DELETE", token: token! });
    if (!res.error) { toast.success("Project deleted"); fetchProjects(); }
    else toast.error(res.message || "Failed");
  };

  if (loading) return <div className="space-y-4 pt-12 lg:pt-0">{[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-surface-500 mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        {user?.role === "admin" && (
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800">
          <FolderKanban className="w-12 h-12 mx-auto text-surface-300 mb-4" />
          <h3 className="text-lg font-semibold text-surface-600">No projects yet</h3>
          <p className="text-surface-400 mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const progress = project.total_tasks ? Math.round((project.completed_tasks / project.total_tasks) * 100) : 0;
            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="card-hover bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800 block group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  {user?.role === "admin" && (
                    <button onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                <p className="text-sm text-surface-500 line-clamp-2 mb-4">{project.description || "No description"}</p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-surface-500">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ background: "linear-gradient(135deg, #059669, #f59e0b)", width: `${progress}%` }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-surface-500">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {project.completed_tasks}/{project.total_tasks}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {project.member_count}</span>
                  {project.overdue_tasks > 0 && (
                    <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-3.5 h-3.5" /> {project.overdue_tasks} overdue</span>
                  )}
                  {project.deadline && (
                    <span className="flex items-center gap-1 ml-auto"><Calendar className="w-3.5 h-3.5" /> {new Date(project.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchProjects(); }} token={token!} />}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated, token }: { onClose: () => void; onCreated: () => void; token: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const res = await api("/projects", { method: "POST", body: { title, description, deadline: deadline || undefined }, token });
    if (!res.error) { toast.success("Project created!"); onCreated(); }
    else { toast.error(res.message || "Failed"); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 w-full max-w-md border border-surface-200 dark:border-surface-800 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Create Project</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project name"
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this project about?"
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <button type="submit" disabled={loading || !title.trim()}
            className="w-full py-2.5 btn-gradient text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Project</>}
          </button>
        </form>
      </div>
    </div>
  );
}
