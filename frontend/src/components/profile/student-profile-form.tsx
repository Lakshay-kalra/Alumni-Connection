"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentProfileSchema } from "@/lib/validations";
import { updateStudentProfile } from "@/actions/mentorship";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentProfile } from "@/types/db";

export function StudentProfileForm({ profile }: { profile: StudentProfile }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      name: profile.name,
      department: profile.department,
      batch: profile.batch || "",
      careerGoals: profile.careerGoals.join(", "),
      interests: profile.interests.join(", "),
      bio: profile.bio || "",
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));
    const result = await updateStudentProfile(formData);
    if (result.success) setMessage(result.message || "Saved");
    else setError(result.error || "Failed");
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2"><Label>Name</Label><Input {...register("name")} /></div>
          <div className="space-y-2"><Label>Department</Label><Input {...register("department")} /></div>
          <div className="space-y-2"><Label>Batch</Label><Input {...register("batch")} /></div>
          <div className="space-y-2"><Label>Career Goals</Label><Input {...register("careerGoals")} placeholder="Comma separated" /></div>
          <div className="space-y-2"><Label>Interests</Label><Input {...register("interests")} placeholder="Comma separated" /></div>
          <div className="space-y-2"><Label>Bio</Label><Textarea {...register("bio")} /></div>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
