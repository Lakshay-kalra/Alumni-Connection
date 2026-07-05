"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { alumniProfileSchema } from "@/lib/validations";
import { updateAlumniProfile } from "@/actions/mentorship";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, Save, GraduationCap, Briefcase, MapPin, Globe, Users } from "lucide-react";
import type { AlumniProfile } from "@/types/db";

export function AlumniProfileForm({ profile }: { profile: AlumniProfile }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mentorshipAvailable, setMentorshipAvailable] = useState(profile.mentorshipAvailable);

  const { register, handleSubmit } = useForm({
    resolver: zodResolver(alumniProfileSchema),
    defaultValues: {
      name: profile.name,
      batch: profile.batch,
      department: profile.department,
      company: profile.company || "",
      position: profile.position || "",
      yearsExperience: profile.yearsExperience ?? undefined,
      industry: profile.industry || "",
      location: profile.location || "",
      skills: profile.skills.join(", "),
      expertise: profile.expertise.join(", "),
      interests: profile.interests.join(", "),
      linkedin: profile.linkedin || "",
      portfolio: profile.portfolio || "",
    },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    setMessage("");
    setError("");
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });
    formData.append("mentorshipAvailable", String(mentorshipAvailable));
    const result = await updateAlumniProfile(formData);
    if (result.success) setMessage(result.message || "Profile saved successfully!");
    else setError(result.error || "Failed to save");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Status alerts */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-primary" /> Personal Information
            </CardTitle>
            <CardDescription>Basic profile details visible in the alumni directory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Full Name</Label>
                <Input {...register("name")} className="h-10" placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Graduation Batch</Label>
                <Input {...register("batch")} className="h-10" placeholder="e.g. 2018" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">Department</Label>
                <Input {...register("department")} className="h-10" placeholder="e.g. Computer Science" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-blue-500" /> Professional Details
            </CardTitle>
            <CardDescription>Your current work and industry information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Current Company</Label>
                <Input {...register("company")} className="h-10" placeholder="Company name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Job Title</Label>
                <Input {...register("position")} className="h-10" placeholder="Your role" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Years of Experience</Label>
                <Input type="number" {...register("yearsExperience", { valueAsNumber: true })} className="h-10" min={0} max={60} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Industry</Label>
                <Input {...register("industry")} className="h-10" placeholder="e.g. Technology, Finance" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills & Interests */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-emerald-500" /> Skills & Location
            </CardTitle>
            <CardDescription>Helps students find you in the directory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Skills <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input {...register("skills")} className="h-10" placeholder="React, Node.js, Python, Machine Learning" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Expertise <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input {...register("expertise")} className="h-10" placeholder="Backend Development, System Design" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Interests <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input {...register("interests")} className="h-10" placeholder="AI, Open Source, Startups" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Location</Label>
              <Input {...register("location")} className="h-10" placeholder="e.g. Bangalore, India" />
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-violet-500" /> Online Presence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">LinkedIn Profile</Label>
                <Input {...register("linkedin")} className="h-10" placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Portfolio / Website</Label>
                <Input {...register("portfolio")} className="h-10" placeholder="https://yoursite.com" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentorship Toggle */}
        <Card className={mentorshipAvailable ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10" : ""}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${mentorshipAvailable ? "bg-emerald-500/15" : "bg-muted"}`}>
                  <Users className={`h-5 w-5 ${mentorshipAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Available for Mentorship</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow students to send you mentorship requests (max 2 mentees)</p>
                </div>
              </div>
              <Switch checked={mentorshipAvailable} onCheckedChange={setMentorshipAvailable} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </Button>
      </form>
    </div>
  );
}
