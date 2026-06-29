"use server";

import { apiFetch } from "@/lib/api";
import type { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  
  const res = await apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(raw),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/events");
  revalidatePath("/admin/dashboard");
  return { success: true, message: "Event created successfully" };
}

export async function updateEvent(eventId: string, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());

  const res = await apiFetch(`/api/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(raw),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/events");
  return { success: true, message: "Event updated" };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const res = await apiFetch(`/api/events/${eventId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/events");
  return { success: true, message: "Event deleted" };
}

export async function registerForEvent(eventId: string): Promise<ActionResult> {
  const res = await apiFetch("/api/events/register", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/events");
  return { success: true, message: "Registered successfully" };
}

export async function cancelEventRegistration(eventId: string): Promise<ActionResult> {
  const res = await apiFetch("/api/events/register", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/events");
  return { success: true, message: "Registration cancelled" };
}

export async function createAnnouncement(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());

  const res = await apiFetch("/api/announcements", {
    method: "POST",
    body: JSON.stringify(raw),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/announcements");
  return { success: true, message: "Announcement published" };
}

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const conversationId = formData.get("conversationId") as string;
  const content = formData.get("content") as string;
  const type = (formData.get("type") as string) || "TEXT";
  const fileUrl = formData.get("fileUrl") as string;
  const fileName = formData.get("fileName") as string;

  const res = await apiFetch("/api/chat/send", {
    method: "POST",
    body: JSON.stringify({
      conversationId,
      content,
      type,
      fileUrl,
      fileName,
    }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/chat");
  return { success: true, message: "Message sent" };
}

export async function markMessagesAsRead(conversationId: string) {
  // Calling messages automatically marks them read on backend
  await apiFetch(`/api/chat/messages/${conversationId}`);
}

export async function createBroadcast(formData: FormData): Promise<ActionResult> {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const mode = formData.get("mode") as string;

  const res = await apiFetch("/api/admin/broadcast", {
    method: "POST",
    body: JSON.stringify({ title, content, mode }),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/community");
  return { success: true, message: "Broadcast created" };
}

export async function postCommunityMessage(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());

  const res = await apiFetch("/api/community/message", {
    method: "POST",
    body: JSON.stringify(raw),
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/community");
  return { success: true, message: "Posted successfully" };
}

export async function markNotificationRead(notificationId: string) {
  await apiFetch("/api/notifications/read", {
    method: "PUT",
    body: JSON.stringify({ id: notificationId }),
  });
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  await apiFetch("/api/notifications/read", {
    method: "PUT",
    body: JSON.stringify({}),
  });
}

export async function getDashboardStats(role: string) {
  if (role === "ADMIN") {
    const res = await apiFetch<any>("/api/admin/dashboard");
    if (res.success) return res.data;
  }
  return null;
}

export async function getUserConversations() {
  const res = await apiFetch<any[]>("/api/chat/conversations");
  if (res.success) return res.data || [];
  return [];
}

export async function getConversationMessages(conversationId: string) {
  const res = await apiFetch<any>(`/api/chat/messages/${conversationId}`);
  if (res.success) {
    const data = res.data;
    // Format to match old schema expectations
    return {
      id: conversationId,
      messages: data || [],
    };
  }
  return null;
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const res = await apiFetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, error: res.error };

  revalidatePath("/admin/dashboard");
  return { success: true, message: "User deleted" };
}
