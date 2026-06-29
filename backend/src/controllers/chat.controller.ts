import { Response } from "express";
import { prisma } from "../config/db";
import { messageSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput } from "../utils/sanitize";
import { triggerSocketEvent } from "../sockets/socket";

export async function getChatMessages(req: AuthenticatedRequest, res: Response) {
  const conversationId = req.params.conversationId as string;
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Check if user is part of this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        mentorship: {
          include: {
            student: true,
            alumni: true,
          },
        },
      },
    }) as any;

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { student, alumni } = conversation.mentorship;
    if (student.userId !== req.user.id && alumni.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Mark other user's messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: req.user.id },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Retrieve messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return res.json(messages);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve chat messages" });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { conversationId, content, type, fileUrl, fileName } = parsed.data;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        mentorship: {
          include: {
            student: true,
            alumni: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { student, alumni } = conversation.mentorship;
    if (student.userId !== req.user.id && alumni.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const recipientId = student.userId === req.user.id ? alumni.userId : student.userId;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.user.id,
        content: content ? sanitizeInput(content) : "",
        type,
        fileUrl,
        fileName,
      },
    });

    // Trigger Socket event for recipient
    triggerSocketEvent(recipientId, "new-message", message);

    // Add Notification
    const userWithProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true, alumniProfile: true },
    });
    const senderName = userWithProfile?.studentProfile?.name || userWithProfile?.alumniProfile?.name || req.user.email;
    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: `You have a new message from ${senderName}.`,
        link: `/chat?cid=${conversationId}`,
      },
    });

    triggerSocketEvent(recipientId, "notification", notification);

    return res.json({ success: true, message });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to send message" });
  }
}

export async function getUserConversations(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const profile =
      req.user.role === "STUDENT"
        ? await prisma.studentProfile.findUnique({ where: { userId: req.user.id } })
        : req.user.role === "ALUMNI"
          ? await prisma.alumniProfile.findUnique({ where: { userId: req.user.id } })
          : null;

    if (!profile) return res.json([]);

    const mentorships = await prisma.mentorship.findMany({
      where: {
        isActive: true,
        ...(req.user.role === "STUDENT"
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

    const formatted = mentorships.map((m: any) => ({
      id: m.conversation?.id,
      mentorshipId: m.id,
      partnerName: req.user!.role === "STUDENT" ? m.alumni.name : m.student.name,
      lastMessage: m.conversation?.messages[0] || null,
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve conversations" });
  }
}
