"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/actions/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
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

    const result = await loginUser(data.email, data.password, callbackUrl);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(result.redirectTo);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img src="/logo.jpeg" alt="Logo" className="h-16 w-auto rounded-2xl shadow-lg border" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Welcome back</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in to your Alumni Network account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 p-8">
          {registered && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              ✅ Account created! Please sign in below.
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-11"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className="h-11 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 rounded-xl border bg-card p-4 text-xs space-y-1.5">
          <p className="font-semibold text-foreground mb-2">🔑 Demo credentials:</p>
          <div className="grid gap-1.5">
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Admin:</span> admin@alumninetwork.com / Admin@123</p>
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Alumni:</span> vikram.singh@google.com / Alumni@123</p>
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Student:</span> arjun.sharma@chitkara.edu.in / Student@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
