"use server";

import { apiFetch } from "@/lib/api";
import type { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export async function submitStudentVerification(studentIdCard: string): Promise<ActionResult> {
  const res = await apiFetch("/api/students/verify", {
    method: "POST",
    body: JSON.stringify({ studentIdCard }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/student/verification");
  return { success: true, message: "Verification request submitted successfully" };
}

export async function submitAlumniVerification(linkedin: string): Promise<ActionResult> {
  const res = await apiFetch("/api/alumni/verify", {
    method: "POST",
    body: JSON.stringify({ linkedin }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/alumni/verification");
  return { success: true, message: "Verification request submitted successfully" };
}

export async function verifyStudent(studentProfileId: string, action: "approve" | "reject"): Promise<ActionResult> {
  const res = await apiFetch("/api/admin/verify-student", {
    method: "POST",
    body: JSON.stringify({ studentProfileId, action }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/admin/verification/students");
  revalidatePath("/student/verification");
  return { success: true, message: `Student ${action === "approve" ? "approved" : "rejected"} successfully` };
}

export async function verifyAlumni(alumniProfileId: string, action: "approve" | "reject"): Promise<ActionResult> {
  const res = await apiFetch("/api/admin/verify-alumni", {
    method: "POST",
    body: JSON.stringify({ alumniProfileId, action }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/admin/verification/alumni");
  revalidatePath("/alumni/verification");
  revalidatePath("/admin/dashboard");
  return { success: true, message: `Alumni ${action === "approve" ? "approved" : "rejected"} successfully` };
}
