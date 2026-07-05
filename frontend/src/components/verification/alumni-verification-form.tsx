"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitAlumniVerification } from "@/actions/verification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Linkedin, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import type { AlumniProfile } from "@/types/db";
import { Badge } from "@/components/ui/badge";

export function AlumniVerificationForm({ profile }: { profile: AlumniProfile }) {
  const router = useRouter();
  const [linkedin, setLinkedin] = useState(profile.linkedin || "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const status = profile.verificationStatus;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkedin.trim()) {
      setMessage({ type: "error", text: "Please enter a valid LinkedIn profile URL." });
      return;
    }

    if (!linkedin.includes("linkedin.com/")) {
      setMessage({ type: "error", text: "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const result = await submitAlumniVerification(linkedin);
      if (result.success) {
        setMessage({ type: "success", text: "Verification request submitted successfully!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Submission failed" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "An unexpected error occurred." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Approved Status */}
      {status === "APPROVED" && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-emerald-800 dark:text-emerald-300">Verified Alumni</CardTitle>
              <CardDescription className="text-emerald-700/80 dark:text-emerald-400/80">
                Your alumni credentials have been successfully validated.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-emerald-800/90 dark:text-emerald-300/90">
              Your profile is visible in the Alumni Directory. Students can now view your details and request mentorship.
            </div>
            {profile.linkedin && (
              <div className="mt-4 pt-4 border-t border-emerald-500/10">
                <p className="text-xs font-semibold text-emerald-700/70 dark:text-emerald-400/70 mb-2">VERIFIED LINKEDIN PROFILE</p>
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  <Linkedin className="h-4 w-4 fill-emerald-600 dark:fill-emerald-400 stroke-none" /> View LinkedIn Profile
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Status */}
      {status === "PENDING" && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-300">Verification Pending</CardTitle>
              <CardDescription className="text-amber-700/80 dark:text-amber-400/80">
                Your profile verification is in progress.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-amber-800/90 dark:text-amber-300/90">
              An administrator is reviewing your professional details. This typically takes 24 hours.
            </div>
            {profile.linkedin && (
              <div className="mt-4 pt-4 border-t border-amber-500/10">
                <p className="text-xs font-semibold text-amber-700/70 dark:text-amber-400/70 mb-2">SUBMITTED LINKEDIN PROFILE</p>
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Linkedin className="h-4 w-4 fill-amber-600 dark:fill-amber-400 stroke-none" /> {profile.linkedin}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejected / Not Submitted Status */}
      {(status === "REJECTED" || (!profile.linkedin && status !== "PENDING")) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submit Verification Details</CardTitle>
              {status === "REJECTED" && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Rejected
                </Badge>
              )}
            </div>
            <CardDescription>
              Provide your professional LinkedIn profile link to verify your alumni status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "REJECTED" && (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-sm flex gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Reason for rejection:</p>
                    <p className="opacity-90">Please ensure your LinkedIn profile lists your graduation from our college and contains correct company/experience information.</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Linkedin className="h-4 w-4 fill-muted-foreground stroke-none" />
                  </span>
                  <Input
                    type="url"
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: https://www.linkedin.com/in/your-profile-name
                </p>
              </div>

              {message && (
                <div
                  className={`p-3.5 rounded-xl text-sm ${
                    message.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting || !linkedin.trim()}>
                {submitting ? "Submitting..." : "Submit Verification Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
