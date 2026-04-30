"use client";

import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import {
  User, Moon, Sun, Shield, Save, Loader2, Key, Activity
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  return <AppLayout><SettingsContent /></AppLayout>;
}

function SettingsContent() {
  const { user, token, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("taskforge_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("taskforge_theme", "light");
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setSavingProfile(true);
    const result = await updateProfile(name.trim());
    if (result.error) toast.error(result.error);
    else toast.success("Profile updated!");
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (currentPassword.length < 6 || newPassword.length < 6) {
      toast.error("Passwords must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    const res = await api("/auth/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
      token: token!,
    });
    if (res.error) toast.error(res.message || "Failed");
    else {
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
    }
    setSavingPassword(false);
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: Key },
    { key: "appearance", label: "Appearance", icon: darkMode ? Moon : Sun },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <div className="space-y-6 pt-12 lg:pt-0 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.key ? "bg-white dark:bg-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
              <span className="text-white text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.name}</h3>
              <p className="text-sm text-surface-500">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-xs text-primary-600 capitalize font-medium">{user?.role}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input value={user?.email || ""} disabled
              className="w-full px-4 py-2.5 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-400 cursor-not-allowed" />
          </div>

          <button onClick={handleSaveProfile} disabled={savingProfile || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold">Change Password</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="mt-1 text-xs text-red-500">Password must be at least 6 characters</p>
            )}
          </div>
          <button onClick={handleChangePassword} disabled={savingPassword || currentPassword.length < 6 || newPassword.length < 6}
            className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Change Password
          </button>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 space-y-6 animate-fade-in">
          <h3 className="text-lg font-semibold">Appearance</h3>
          <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-accent-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-surface-500">Switch between light and dark themes</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-primary-600" : "bg-surface-300"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "left-[26px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Account Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-surface-500">Account Created</span>
              <span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-surface-500">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-surface-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
