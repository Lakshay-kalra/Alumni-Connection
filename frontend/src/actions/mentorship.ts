"use server";

import { apiFetch } from "@/lib/api";
import { calculateMatchPercentage } from "@/lib/utils";
import type { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export async function updateStudentProfile(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());

  const res = await apiFetch("/api/students/profile", {
    method: "PUT",
    body: JSON.stringify(raw),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/student/profile");
  return { success: true, message: "Profile updated successfully" };
}

export async function updateAlumniProfile(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  
  const body = {
    ...raw,
    mentorshipAvailable: raw.mentorshipAvailable === "on" || raw.mentorshipAvailable === "true",
  };

  const res = await apiFetch("/api/alumni/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/alumni/profile");
  return { success: true, message: "Profile updated successfully" };
}

export async function sendMentorshipRequest(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());

  const res = await apiFetch("/api/mentorship/request", {
    method: "POST",
    body: JSON.stringify(raw),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/student/dashboard");
  return { success: true, message: "Mentorship request sent successfully" };
}

export async function respondToMentorshipRequest(
  requestId: string,
  action: "accept" | "reject"
): Promise<ActionResult> {
  const path = action === "accept" ? "/api/mentorship/accept" : "/api/mentorship/reject";
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/alumni/dashboard");
  return { success: true, message: action === "accept" ? "Request accepted" : "Request rejected" };
}

export async function verifyAlumni(alumniProfileId: string, action: "approve" | "reject"): Promise<ActionResult> {
  const res = await apiFetch("/api/admin/verify-alumni", {
    method: "POST",
    body: JSON.stringify({ alumniProfileId, action }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/admin/dashboard");
  return { success: true, message: `Alumni ${action === "approve" ? "approved" : "rejected"}` };
}

export async function getRecommendedAlumni() {
  const studentRes = await apiFetch<any>("/api/students/profile");
  // Backend now returns a paginated object { alumni, total, pages, page }.
  // For recommendations we need a wide pool to rank by match %, so request a
  // large page (the backend caps at 200). This runs once per dashboard load.
  const alumniRes = await apiFetch<any>("/api/alumni?limit=200");
  if (!studentRes.success || !alumniRes.success) return [];

  const student = studentRes.data;
  const alumni: any[] = alumniRes.data?.alumni || [];

  return alumni
    .filter((a: any) => a.mentorshipAvailable && a.currentMentorshipCount < 2)
    .map((a: any) => ({
      ...a,
      matchPercentage: calculateMatchPercentage(
        { department: student.department, interests: student.interests, careerGoals: student.careerGoals },
        { department: a.department, skills: a.skills, expertise: a.expertise, industry: a.industry || undefined, interests: a.interests }
      ),
      menteeCount: a.currentMentorshipCount,
    }))
    .sort((a: any, b: any) => b.matchPercentage - a.matchPercentage)
    .slice(0, 6);
}
