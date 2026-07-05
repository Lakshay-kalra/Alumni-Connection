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
  const alumniRes = await apiFetch<any[]>("/api/alumni");
  if (!studentRes.success || !alumniRes.success) return [];

  const student = studentRes.data;
  const alumni = alumniRes.data || [];

  return alumni
    .filter((a) => a.mentorshipAvailable && a.currentMentorshipCount < 2)
    .map((a) => ({
      ...a,
      matchPercentage: calculateMatchPercentage(
        { department: student.department, interests: student.interests, careerGoals: student.careerGoals },
        { department: a.department, skills: a.skills, expertise: a.expertise, industry: a.industry || undefined, interests: a.interests }
      ),
      menteeCount: a.currentMentorshipCount,
    }))
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 6);
}

export async function searchAlumni(params: {
  query?: string;
  department?: string;
  batch?: string;
  company?: string;
  skills?: string;
  page?: number;
  limit?: number;
}) {
  const res = await apiFetch<any[]>("/api/alumni");
  if (!res.success) return { alumni: [], total: 0, pages: 1, page: 1 };

  let list = res.data || [];

  if (params.query) {
    const q = params.query.toLowerCase();
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.company && a.company.toLowerCase().includes(q)) ||
        (a.position && a.position.toLowerCase().includes(q)) ||
        a.department.toLowerCase().includes(q) ||
        (a.location && a.location.toLowerCase().includes(q))
    );
  }

  if (params.department) {
    const d = params.department.toLowerCase();
    list = list.filter((a) => a.department.toLowerCase().includes(d));
  }

  if (params.batch) {
    list = list.filter((a) => a.batch === params.batch);
  }

  if (params.company) {
    const c = params.company.toLowerCase();
    list = list.filter((a) => a.company && a.company.toLowerCase().includes(c));
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  const skip = (page - 1) * limit;

  const paginated = list.slice(skip, skip + limit);

  return {
    alumni: paginated.map((a) => ({
      ...a,
      menteeCount: a.currentMentorshipCount,
    })),
    total: list.length,
    pages: Math.ceil(list.length / limit),
    page,
  };
}
