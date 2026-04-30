"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatar: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateProfile: (name: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("taskforge_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (t: string) => {
    const result = await api<{ user: User }>("/auth/me", { token: t });
    if (result.data) {
      setUser(result.data.user);
      setToken(t);
    } else {
      localStorage.removeItem("taskforge_token");
      setToken(null);
    }
    setLoading(false);
  };

  const login = useCallback(async (email: string, password: string) => {
    // Frontend validation - ensures password field is properly passed
    if (!email || !password) {
      return { error: "Email and password are required" };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    console.log("[AUTH] Attempting login with:", { email, password: "***" });

    const result = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password }, // Ensures correct fields: { email, password }
    });

    if (result.data) {
      const { token: newToken, user: newUser } = result.data;
      localStorage.setItem("taskforge_token", newToken);
      setToken(newToken);
      setUser(newUser);
      return {};
    }

    return { error: result.message || "Login failed" };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    // Frontend validation
    if (!name || !email || !password) {
      return { error: "All fields are required" };
    }
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    console.log("[AUTH] Attempting signup with:", { name, email, password: "***" });

    const result = await api<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: { name, email, password }, // Correct request body: { name, email, password }
    });

    if (result.data) {
      const { token: newToken, user: newUser } = result.data;
      localStorage.setItem("taskforge_token", newToken);
      setToken(newToken);
      setUser(newUser);
      return {};
    }

    return { error: result.message || "Signup failed" };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("taskforge_token");
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    if (!token) return { error: "Not authenticated" };
    const result = await api<{ user: User }>("/auth/profile", {
      method: "PUT",
      body: { name },
      token,
    });
    if (result.data) {
      setUser(result.data.user);
      return {};
    }
    return { error: result.message || "Update failed" };
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
