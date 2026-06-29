"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitStudentVerification } from "@/actions/verification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, Clock, XCircle, AlertCircle, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StudentProfile } from "@prisma/client";

export function StudentVerificationForm({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const status = profile.verificationStatus;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a student ID file to upload." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // 1. Upload file
      const uploadData = new FormData();
      uploadData.append("file", selectedFile);
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadRes.ok) {
        throw new Error("File upload failed");
      }

      const uploadResult = await uploadRes.json();
      const fileUrl = uploadResult.fileUrl;

      // 2. Submit verification request
      const actionResult = await submitStudentVerification(fileUrl);
      if (actionResult.success) {
        setMessage({ type: "success", text: "Verification request submitted successfully!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: actionResult.error || "Submission failed" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "An unexpected error occurred during submission." });
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
              <CardTitle className="text-emerald-800 dark:text-emerald-300">Profile Verified</CardTitle>
              <CardDescription className="text-emerald-700/80 dark:text-emerald-400/80">
                Your student status has been successfully validated.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-emerald-800/90 dark:text-emerald-300/90">
              You have full access to all features of the Alumni Networking Platform, including alumni directories, mentorship requests, and announcements.
            </div>
            {profile.studentIdCard && (
              <div className="mt-4 pt-4 border-t border-emerald-500/10">
                <p className="text-xs font-semibold text-emerald-700/70 dark:text-emerald-400/70 mb-2">SUBMITTED DOCUMENT</p>
                <a
                  href={profile.studentIdCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <FileText className="h-4 w-4" /> View ID Card Document
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
                Your request is currently being reviewed by an administrator.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-amber-800/90 dark:text-amber-300/90">
              This process typically takes 24-48 hours. You will receive a notification on the platform once your status is updated.
            </div>
            {profile.studentIdCard && (
              <div className="mt-4 pt-4 border-t border-amber-500/10">
                <p className="text-xs font-semibold text-amber-700/70 dark:text-amber-400/70 mb-2">SUBMITTED DOCUMENT</p>
                <div className="flex flex-col gap-3">
                  <a
                    href={profile.studentIdCard}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <FileText className="h-4 w-4" /> View Uploaded ID Card
                  </a>
                  {profile.studentIdCard.match(/\.(jpeg|jpg|gif|png|webp)/i) && (
                    <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border bg-background">
                      <img src={profile.studentIdCard} alt="Uploaded student ID card" className="object-contain w-full h-full" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejected / Not Verified Status */}
      {(status === "REJECTED" || !profile.studentIdCard) && (
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
              {status === "REJECTED" 
                ? "Your previous verification request was rejected. Please upload a valid ID card."
                : "Please upload a valid student ID card or enrollment letter to verify your student status."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "REJECTED" && (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-sm flex gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Reason for rejection:</p>
                    <p className="opacity-90">Please ensure the document clearly displays your name, enrollment year, and university seal.</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="id-card">Student ID Card (Image or PDF)</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-muted/20 hover:bg-muted/30 transition cursor-pointer relative">
                  <Input
                    type="file"
                    id="id-card"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    disabled={submitting}
                  />
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-semibold text-sm">
                    {selectedFile ? selectedFile.name : "Click or drag to upload file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepts PNG, JPG, JPEG, and PDF (Max 10MB)
                  </p>
                </div>
              </div>

              {selectedFile && selectedFile.type.startsWith("image/") && (
                <div className="space-y-2">
                  <Label>Image Preview</Label>
                  <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border bg-background">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="ID Preview"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}

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

              <Button type="submit" className="w-full" disabled={submitting || !selectedFile}>
                {submitting ? "Uploading & Submitting..." : "Submit Verification Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
