"use server";

import { apiFetch } from "@/lib/api";

export type ActionResult = { success: boolean; error?: string; message?: string };

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());

  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(raw),
  });

  if (!res.success) return { success: false, error: res.error };
  return { success: true, message: res.message };
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const res = await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!res.success) return { success: false, error: res.error };
  return { success: true, message: res.message };
}

export async function resetPassword(token: string, password: string): Promise<ActionResult> {
  const res = await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  if (!res.success) return { success: false, error: res.error };
  return { success: true, message: res.message };
}

export async function verifyEmail(token: string): Promise<ActionResult> {
  const res = await apiFetch(`/api/auth/verify-email?token=${token}`, {
    method: "GET",
  });
  if (!res.success) return { success: false, error: res.error };
  return { success: true, message: res.message };
}
