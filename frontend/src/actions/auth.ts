"use server";

import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";
import { apiFetch } from "@/lib/api";
import { getDashboardPath } from "@/lib/auth-utils";

export type ActionResult = { success: boolean; error?: string; message?: string };

export type LoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

export async function loginUser(
  email: string,
  password: string,
  callbackUrl?: string | null
): Promise<LoginResult> {
  let result: string | undefined;

  try {
    result = await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password. Please try again." };
    }
    throw error;
  }

  if (result?.includes("error=")) {
    return { success: false, error: "Invalid email or password. Please try again." };
  }

  const session = await auth();
  const role = session?.user?.role;
  if (!role) {
    return { success: false, error: "Invalid email or password. Please try again." };
  }

  return {
    success: true,
    redirectTo: callbackUrl || getDashboardPath(role),
  };
}

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
