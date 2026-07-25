"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { getDashboardPath } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertCircle,
  Mail,
  Lock,
  Users,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import HeroParticles from "@/components/ui/hero-particles";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    router.prefetch("/admin/dashboard");
    router.prefetch("/student/dashboard");
    router.prefetch("/alumni/dashboard");
  }, [router]);

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;

    if (!role) {
      setError("Sign-in succeeded but the session could not be loaded. Please try again.");
      setLoading(false);
      return;
    }

    window.location.assign(callbackUrl || getDashboardPath(role));
  };

  return (
    <div className="flex min-h-screen bg-[#1A1A1A]">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden items-center justify-center">
        {/* Particle layer */}
        <div className="absolute inset-0">
          <HeroParticles />
        </div>

        {/* Atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[-5%] w-[65%] h-[65%] rounded-full bg-[#E31E24]/6 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[55%] h-[55%] rounded-full bg-[#1A1A1A]/4 blur-[140px]" />
        </div>

        {/* Decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(227,30,36,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(227,30,36,1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 px-14 max-w-lg w-full"
        >
          {/* Brand */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-[#E31E24]/20" />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#E31E24]/60">Alumni Network</span>
              <div className="h-px flex-1 bg-[#E31E24]/20" />
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.1] text-white mb-4">
              Where careers<br />
              <em className="not-italic gradient-red">take root.</em>
            </h1>
            <p className="text-[#666666] text-sm leading-relaxed font-light">
              The private platform for students and alumni to connect, mentor, and grow together.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 mb-12">
            {[
              { icon: Users, title: "Verified alumni profiles", desc: "Every mentor is authenticated by admins" },
              { icon: MessageSquare, title: "Direct mentorship chat", desc: "Real-time, private conversations" },
              { icon: CheckCircle2, title: "Curated events", desc: "Career fairs, talks, and networking" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E31E24]/15 bg-[#E31E24]/6">
                  <f.icon className="h-4 w-4 text-[#E31E24]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="text-xs text-[#666666]">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E31E24]/12" />
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#E31E24]/40">Exclusive Network</span>
            <div className="h-px flex-1 bg-[#E31E24]/12" />
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-[#1A1A1A] lg:bg-[#F5F5F5]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile heading */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-[#1A1A1A]">Alumni Network</h1>
            <p className="text-[#666666] mt-1 text-sm">Sign in to your account</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#E31E24] mb-3">Welcome back</p>
            <h2 className="font-display text-3xl font-bold text-[#1A1A1A] leading-tight">Sign in to<br />your account</h2>
          </div>

          {/* Alerts */}
          {registered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 flex items-center gap-2 rounded-xl bg-[#E31E24]/8 border border-[#E31E24]/20 p-3 text-sm text-[#E31E24]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Account created successfully. Please sign in below.
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#E31E24]/50" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 pl-10 bg-white border-[#E31E24]/12 text-[#1A1A1A] placeholder:text-[#666666]/60 focus-visible:ring-[#E31E24]/40 focus-visible:border-[#E31E24]/30 transition-colors"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs text-[#E31E24]/70 hover:text-[#E31E24] transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#E31E24]/50" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="h-11 pl-10 pr-16 bg-white border-[#E31E24]/12 text-[#1A1A1A] placeholder:text-[#666666]/60 focus-visible:ring-[#E31E24]/40 focus-visible:border-[#E31E24]/30 transition-colors"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest text-[#E31E24]/60 hover:text-[#E31E24] transition-colors"
                >
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Keep signed in */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="keepSignedIn"
                checked={keepSignedIn}
                onCheckedChange={(v) => setKeepSignedIn(v === true)}
                className="border-[#E31E24]/25 data-[state=checked]:bg-[#E31E24] data-[state=checked]:border-[#E31E24]"
              />
              <Label htmlFor="keepSignedIn" className="text-xs text-[#666666] cursor-pointer">
                Keep me signed in
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold tracking-wide bg-[#E31E24] hover:bg-[#C41A1F] text-white shadow-xl shadow-[#E31E24]/20 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-[#666666]">
            New to Alumni Network?{" "}
            <Link href="/register" className="font-semibold text-[#E31E24] hover:text-[#C41A1F] transition-colors">
              Create account
            </Link>
          </p>

          {/* Quick access */}
          <div className="mt-8 rounded-xl border border-[#E31E24]/10 bg-white p-4">
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#666666] mb-3">Quick access credentials</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {[
                { role: "Admin", dot: "#E31E24", email: "admin@alumninetwork.com", pass: "Admin@123" },
                { role: "Alumni", dot: "#1A1A1A", email: "vikram.singh@google.com", pass: "Alumni@123" },
                { role: "Student", dot: "#666666", email: "arjun.sharma@chitkara.edu.in", pass: "Student@123" },
              ].map((r) => (
                <div key={r.role} className="rounded-lg border border-[#E31E24]/8 bg-white p-2 space-y-0.5">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.dot }} />
                    <span className="font-bold text-[#1A1A1A]/80">{r.role}</span>
                  </div>
                  <p className="text-[#666666] truncate">{r.email}</p>
                  <p className="text-[#666666]">{r.pass}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-[#666666]/50 tracking-wide">
            © 2026 Alumni Network
          </p>
        </motion.div>
      </div>
    </div>
  );
}
