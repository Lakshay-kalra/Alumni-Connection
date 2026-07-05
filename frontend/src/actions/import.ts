"use server";

import { apiFetch } from "@/lib/api";
import { revalidatePath } from "next/cache";

export type ImportRecord = {
  name: string;
  batch: string;
  department: string;
  company?: string;
  position?: string;
  email?: string;
  linkedin?: string;
};

export type ActionResult = { success: boolean; error?: string; message?: string };

export async function importAlumniRecords(records: ImportRecord[]): Promise<ActionResult> {
  const res = await apiFetch("/api/admin/import-alumni", {
    method: "POST",
    body: JSON.stringify({ records }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/alumni-directory");
  revalidatePath("/admin/dashboard");

  return { success: true, message: res.message };
}
