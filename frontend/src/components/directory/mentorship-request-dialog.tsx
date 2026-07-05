"use client";

import { useState } from "react";
import { sendMentorshipRequest } from "@/actions/mentorship";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, AlertCircle, SendHorizonal } from "lucide-react";

export function MentorshipRequestDialog({
  alumniId,
  open,
  onClose,
}: {
  alumniId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.append("alumniId", alumniId);
    const result = await sendMentorshipRequest(formData);
    if (result.success) {
      setSuccess(true);
      setTimeout(onClose, 2000);
    } else {
      setError(result.error || "Failed to send request");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Request Mentorship</DialogTitle>
          <DialogDescription>
            Tell the alumni about yourself and your goals. Make it personal and specific.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-semibold text-lg">Request Sent! 🎉</p>
            <p className="text-sm text-muted-foreground mt-2">
              The alumni will review your request and respond soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Your Motivation <span className="text-destructive">*</span>
              </Label>
              <Textarea
                name="motivation"
                required
                placeholder="Why do you want to connect with this alumni? What draws you to their career path?"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Career Goal <span className="text-destructive">*</span>
              </Label>
              <Textarea
                name="careerGoal"
                required
                placeholder="What career goal are you working towards? (e.g., become a backend engineer at a product company)"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Expectations <span className="text-destructive">*</span>
              </Label>
              <Textarea
                name="expectations"
                required
                placeholder="What kind of guidance are you looking for? (e.g., weekly check-ins, resume review, interview prep)"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1 gap-2 shadow-lg shadow-primary/20">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><SendHorizonal className="h-4 w-4" /> Send Request</>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
