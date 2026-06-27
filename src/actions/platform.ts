"use server";

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { sanitizeInput } from "@/lib/utils";
import { eventSchema, announcementSchema, messageSchema, communityMessageSchema } from "@/lib/validations";
import { createNotification } from "@/actions/auth";
import { triggerPusherEvent } from "@/lib/pusher";
import type { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };

  const event = await db.event.create({
    data: {
      title: sanitizeInput(parsed.data.title),
      description: sanitizeInput(parsed.data.description),
      date: new Date(parsed.data.date),
      time: parsed.data.time,
      venue: sanitizeInput(parsed.data.venue),
      bannerImage: parsed.data.bannerImage || null,
      createdById: admin.id,
    },
  });

  const alumni = await db.user.findMany({
    where: { role: "ALUMNI", alumniProfile: { verificationStatus: "APPROVED" } },
  });

  await db.notification.createMany({
    data: alumni.map((a) => ({
      userId: a.id,
      type: "EVENT_REMINDER" as const,
      title: "New Event",
      message: `New event: ${event.title}`,
      link: "/events",
    })),
  });

  revalidatePath("/events");
  revalidatePath("/admin/dashboard");
  return { success: true, message: "Event created successfully" };
}

export async function updateEvent(eventId: string, formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };

  await db.event.update({
    where: { id: eventId },
    data: {
      title: sanitizeInput(parsed.data.title),
      description: sanitizeInput(parsed.data.description),
      date: new Date(parsed.data.date),
      time: parsed.data.time,
      venue: sanitizeInput(parsed.data.venue),
      bannerImage: parsed.data.bannerImage || null,
    },
  });

  revalidatePath("/events");
  return { success: true, message: "Event updated" };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  await requireRole("ADMIN");
  await db.event.delete({ where: { id: eventId } });
  revalidatePath("/events");
  return { success: true, message: "Event deleted" };
}

export async function registerForEvent(eventId: string): Promise<ActionResult> {
  const user = await requireRole("ALUMNI");
  const profile = await db.alumniProfile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.verificationStatus !== "APPROVED") {
    return { success: false, error: "Only verified alumni can register for events" };
  }

  const existing = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (existing) return { success: false, error: "Already registered" };

  await db.eventRegistration.create({ data: { eventId, userId: user.id } });

  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  const event = await db.event.findUnique({ where: { id: eventId } });
  await db.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: "EVENT_REGISTRATION" as const,
      title: "New Event Registration",
      message: `${profile.name} registered for ${event?.title}`,
      link: "/admin/dashboard",
    })),
  });

  revalidatePath("/events");
  return { success: true, message: "Registered successfully" };
}

export async function cancelEventRegistration(eventId: string): Promise<ActionResult> {
  const user = await requireRole("ALUMNI");
  await db.eventRegistration.deleteMany({ where: { eventId, userId: user.id } });
  revalidatePath("/events");
  return { success: true, message: "Registration cancelled" };
}

export async function createAnnouncement(formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const raw = Object.fromEntries(formData.entries());
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };

  const announcement = await db.announcement.create({
    data: {
      title: sanitizeInput(parsed.data.title),
      content: sanitizeInput(parsed.data.content),
      category: parsed.data.category,
      authorId: admin.id,
    },
  });

  const users = await db.user.findMany({ where: { role: { in: ["ALUMNI", "STUDENT"] } } });
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "NEW_ANNOUNCEMENT" as const,
      title: "New Announcement",
      message: announcement.title,
      link: "/announcements",
    })),
  });

  revalidatePath("/announcements");
  return { success: true, message: "Announcement published" };
}

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };

  const conversation = await db.conversation.findUnique({
    where: { id: parsed.data.conversationId },
    include: {
      mentorship: {
        include: {
          student: { include: { user: true } },
          alumni: { include: { user: true } },
        },
      },
    },
  });

  if (!conversation || !conversation.mentorship.isActive) {
    return { success: false, error: "Conversation not found or inactive" };
  }

  const { student, alumni } = conversation.mentorship;
  const isParticipant =
    user.id === student.userId || user.id === alumni.userId;
  if (!isParticipant) return { success: false, error: "Unauthorized" };

  const message = await db.message.create({
    data: {
      conversationId: parsed.data.conversationId,
      senderId: user.id,
      content: sanitizeInput(parsed.data.content || ""),
      type: parsed.data.type,
      fileUrl: parsed.data.fileUrl || null,
      fileName: parsed.data.fileName || null,
    },
    include: { sender: { select: { id: true, email: true } } },
  });

  const recipientId =
    user.id === student.userId ? alumni.userId : student.userId;

  await createNotification({
    userId: recipientId,
    type: "NEW_MESSAGE",
    title: "New Message",
    message: `New message from ${user.name || user.email}`,
    link: "/chat",
  });

  await triggerPusherEvent(
    `conversation-${parsed.data.conversationId}`,
    "new-message",
    message
  );

  revalidatePath("/chat");
  return { success: true, message: "Message sent" };
}

export async function markMessagesAsRead(conversationId: string) {
  const user = await requireAuth();
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: user.id },
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function createBroadcast(formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const title = sanitizeInput(formData.get("title") as string);
  const content = sanitizeInput(formData.get("content") as string);
  const mode = (formData.get("mode") as string) || "ANNOUNCEMENT";

  const broadcast = await db.adminBroadcast.create({
    data: {
      title,
      content,
      mode: mode as "ANNOUNCEMENT" | "COMMUNITY",
      authorId: admin.id,
    },
  });

  await triggerPusherEvent("community", "new-broadcast", broadcast);

  const alumni = await db.user.findMany({ where: { role: "ALUMNI" } });
  await db.notification.createMany({
    data: alumni.map((a) => ({
      userId: a.id,
      type: "NEW_ANNOUNCEMENT" as const,
      title: "Admin Broadcast",
      message: title,
      link: "/community",
    })),
  });

  revalidatePath("/community");
  return { success: true, message: "Broadcast created" };
}

export async function postCommunityMessage(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const raw = Object.fromEntries(formData.entries());
  const parsed = communityMessageSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };

  const broadcast = await db.adminBroadcast.findUnique({
    where: { id: parsed.data.broadcastId },
  });
  if (!broadcast || !broadcast.isActive) {
    return { success: false, error: "Broadcast not found" };
  }

  if (broadcast.mode === "ANNOUNCEMENT" && user.role !== "ADMIN") {
    return { success: false, error: "Only admins can post in announcement mode" };
  }

  if (user.role === "ALUMNI") {
    const profile = await db.alumniProfile.findUnique({ where: { userId: user.id } });
    if (profile?.verificationStatus !== "APPROVED") {
      return { success: false, error: "Verified alumni only" };
    }
  }

  const message = await db.communityMessage.create({
    data: {
      broadcastId: parsed.data.broadcastId,
      authorId: user.id,
      content: sanitizeInput(parsed.data.content),
      parentId: parsed.data.parentId || null,
    },
    include: { author: { select: { id: true, email: true, role: true } } },
  });

  await triggerPusherEvent("community", "new-message", message);
  revalidatePath("/community");
  return { success: true, message: "Posted successfully" };
}

export async function markNotificationRead(notificationId: string) {
  const user = await requireAuth();
  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true, readAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const user = await requireAuth();
  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function getDashboardStats(role: string) {
  await requireAuth();

  if (role === "ADMIN") {
    const [totalAlumni, totalStudents, activeMentorships, upcomingEvents, registrations] =
      await Promise.all([
        db.alumniProfile.count({ where: { verificationStatus: "APPROVED" } }),
        db.studentProfile.count(),
        db.mentorship.count({ where: { isActive: true } }),
        db.event.count({ where: { date: { gte: new Date() } } }),
        db.eventRegistration.count(),
      ]);

    const pendingAlumni = await db.alumniProfile.count({
      where: { verificationStatus: "PENDING" },
    });

    const userGrowth = await db.user.groupBy({
      by: ["role"],
      _count: true,
    });

    return {
      totalAlumni,
      totalStudents,
      activeMentorships,
      upcomingEvents,
      registrations,
      pendingAlumni,
      userGrowth,
    };
  }

  return null;
}

export async function getUserConversations() {
  const user = await requireAuth();
  const profile =
    user.role === "STUDENT"
      ? await db.studentProfile.findUnique({ where: { userId: user.id } })
      : user.role === "ALUMNI"
        ? await db.alumniProfile.findUnique({ where: { userId: user.id } })
        : null;

  if (!profile) return [];

  const mentorships = await db.mentorship.findMany({
    where: {
      isActive: true,
      ...(user.role === "STUDENT"
        ? { studentId: profile.id }
        : { alumniId: profile.id }),
    },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      student: true,
      alumni: true,
    },
  });

  return mentorships.map((m) => ({
    id: m.conversation?.id,
    mentorshipId: m.id,
    partnerName: user.role === "STUDENT" ? m.alumni.name : m.student.name,
    lastMessage: m.conversation?.messages[0],
  }));
}

export async function getConversationMessages(conversationId: string) {
  const user = await requireAuth();
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      mentorship: {
        include: {
          student: { include: { user: true } },
          alumni: { include: { user: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, email: true } } },
      },
    },
  });

  if (!conversation) return null;

  const { student, alumni } = conversation.mentorship;
  if (user.id !== student.userId && user.id !== alumni.userId) return null;

  await markMessagesAsRead(conversationId);
  return conversation;
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  await requireRole("ADMIN");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "ADMIN") {
    return { success: false, error: "Cannot delete this user" };
  }
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/dashboard");
  return { success: true, message: "User deleted" };
}
