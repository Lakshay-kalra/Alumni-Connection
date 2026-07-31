"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const result = await resetPassword(token, password);
    if (result.success) setMessage(result.message || "Password updated. You can now sign in.");
    else setError(result.error || "Failed to reset password");
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-destructive">This reset link is invalid or incomplete.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please request a new link from the{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            forgot password
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a strong password you haven&apos;t used before</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {message && (
            <div className="space-y-3">
              <p className="text-sm text-green-600">{message}</p>
              <Link href="/login" className="block text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!message && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
                <p className="text-xs text-muted-foreground">
                  Must include uppercase, lowercase, and a number.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
              </div>
            </>
          )}
        </CardContent>
        {!message && (
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
