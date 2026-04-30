"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Sparkles, Leaf, Shield, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, signup, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isLogin && (!name || name.trim().length < 2)) errs.name = "Name must be at least 2 characters";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password || password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const result = isLogin ? await login(email, password) : await signup(name, email, password);
      if (result.error) {
        toast.error(result.error);
        setErrors({ form: result.error });
      } else {
        toast.success(isLogin ? "Welcome back!" : "Account created!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* ===== LEFT PANEL — Decorative Brand Side ===== */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center"
        style={{ background: "linear-gradient(160deg, #022c22 0%, #064e3b 30%, #047857 60%, #065f46 100%)" }}>

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full opacity-20 animate-float"
            style={{ background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)" }} />
          <div className="absolute bottom-[15%] right-[10%] w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", animation: "float 8s ease-in-out infinite reverse" }} />
          <div className="absolute top-[50%] left-[60%] w-48 h-48 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #fde68a 0%, transparent 70%)", animation: "float 10s ease-in-out infinite 2s" }} />

          {/* Leaf particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="absolute"
              style={{
                top: `${15 + i * 14}%`,
                left: `${10 + i * 15}%`,
                animation: `leaf-drift ${6 + i * 2}s ease-in-out infinite ${i * 0.8}s`,
              }}>
              <Leaf className="w-5 h-5 text-emerald-300/30" style={{ transform: `rotate(${i * 60}deg)` }} />
            </div>
          ))}

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, #fbbf24 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg px-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
              <Zap className="w-8 h-8 text-emerald-900" />
            </div>
            <span className="text-3xl font-extrabold text-white tracking-tight">TaskForge</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-[1.15] mb-6">
            Manage projects
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #fbbf24, #fde68a)" }}>
              with clarity.
            </span>
          </h1>

          <p className="text-lg text-emerald-100/70 leading-relaxed mb-10">
            A premium workspace for teams to plan, track, and deliver exceptional work — beautifully.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Shield, text: "Role-based access" },
              { icon: Sparkles, text: "Real-time analytics" },
              { icon: Leaf, text: "Clean & intuitive" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 backdrop-blur-sm">
                <item.icon className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-emerald-100/80 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Auth Form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative"
        style={{ background: "linear-gradient(180deg, #fefdf8 0%, #f5f0e1 50%, #fefdf8 100%)" }}>

        {/* Subtle corner accents */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-30"
          style={{ background: "radial-gradient(circle at top right, #d1fae5 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-20"
          style={{ background: "radial-gradient(circle at bottom left, #fde68a 0%, transparent 60%)" }} />

        <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                <Zap className="w-6 h-6 text-amber-300" />
              </div>
              <span className="text-2xl font-bold text-emerald-900 tracking-tight">TaskForge</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-emerald-950 tracking-tight">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-surface-500 mt-2">
              {isLogin ? "Enter your credentials to access your workspace." : "Fill in your details to get started."}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-surface-200 p-7 shadow-[0_8px_40px_-12px_rgba(6,78,59,0.08)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name (signup) */}
              {!isLogin && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-emerald-900 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                    <input id="auth-name" type="text" value={name}
                      onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
                      placeholder="Your full name"
                      className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-emerald-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all text-[15px]" />
                  </div>
                  {errors.name && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name}</p>}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-emerald-900 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                  <input id="auth-email" type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                    placeholder="you@company.com"
                    className="w-full pl-11 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-emerald-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all text-[15px]" />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-emerald-900 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                  <input id="auth-password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                    placeholder="Min. 6 characters"
                    className="w-full pl-11 pr-12 py-3 bg-surface-50 border border-surface-200 rounded-xl text-emerald-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all text-[15px]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-emerald-700 transition-colors p-0.5">
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password}</p>}

                {/* Password strength */}
                {password.length > 0 && (
                  <div className="mt-2.5 flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          password.length >= i * 3
                            ? password.length >= 12 ? "bg-emerald-500" : password.length >= 8 ? "bg-amber-400" : "bg-orange-400"
                            : "bg-surface-200"
                        }`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Error banner */}
              {errors.form && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                  <p className="text-sm text-red-600 font-medium">{errors.form}</p>
                </div>
              )}

              {/* Submit */}
              <button id="auth-submit" type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-[15px] text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #059669, #047857, #065f46)",
                  boxShadow: "0 4px 15px -3px rgba(5, 150, 105, 0.3)"
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 25px -5px rgba(5, 150, 105, 0.4)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px -3px rgba(5, 150, 105, 0.3)"; }}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>{isLogin ? "Sign In" : "Create Account"}<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-surface-200" />
              <span className="text-xs text-surface-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-surface-200" />
            </div>

            {/* Demo credentials */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button"
                onClick={() => { setEmail("admin@taskforge.com"); setPassword("admin123"); setIsLogin(true); }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-surface-200 text-sm font-medium text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                <Shield className="w-4 h-4 text-emerald-600" />
                Admin Demo
              </button>
              <button type="button"
                onClick={() => { setEmail("john@taskforge.com"); setPassword("member123"); setIsLogin(true); }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-surface-200 text-sm font-medium text-amber-800 hover:bg-amber-50 hover:border-amber-200 transition-all">
                <User className="w-4 h-4 text-amber-600" />
                Member Demo
              </button>
            </div>
          </div>

          {/* Toggle */}
          <p className="text-center mt-6 text-sm text-surface-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button id="auth-toggle" onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
              className="ml-1.5 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-all">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
