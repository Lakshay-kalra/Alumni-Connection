import { verifyEmail } from "@/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface VerifyEmailProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailProps) {
  const { token } = await searchParams;
  
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-xl border border-rose-500/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <XCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Missing Token</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">No verification token was provided.</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-4">
            <Button asChild className="w-full h-11 rounded-xl shadow-lg">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await verifyEmail(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className={`w-full max-w-md shadow-xl border ${result.success ? "border-emerald-500/10" : "border-rose-500/10"}`}>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            {result.success ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                <XCircle className="h-8 w-8" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {result.success ? "Email Verified" : "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {result.success ? "Your email has been verified successfully." : "Verification could not be completed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.success
              ? "Your account is now activated. You can log in to the platform, complete your profile, and search for alumni/mentors!"
              : result.error || "The verification link is invalid or has expired."}
          </p>
          <Button asChild className="w-full h-11 rounded-xl shadow-lg">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
