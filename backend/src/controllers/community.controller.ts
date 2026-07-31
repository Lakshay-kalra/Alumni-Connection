import { Response } from "express";
import { prisma } from "../config/db";
import { communityMessageSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput } from "../utils/sanitize";
import { triggerGlobalSocketEvent } from "../sockets/socket";

export async function getCommunityFeed(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const [broadcasts, total] = await Promise.all([
      prisma.adminBroadcast.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        include: {
          messages: {
            include: {
              author: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  image: true,
                  studentProfile: { select: { name: true } },
                  alumniProfile: { select: { name: true } },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          author: {
            select: {
              id: true,
              email: true,
              role: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.adminBroadcast.count({ where: { isActive: true } }),
    ]);

    // Format output author name mapping
    const formatted = broadcasts.map((b: any) => ({
      ...b,
      messages: b.messages.map((m: any) => ({
        ...m,
        authorName: m.author.studentProfile?.name ?? m.author.alumniProfile?.name ?? m.author.email,
      })),
    }));

    return res.json({ broadcasts: formatted, total, pages: Math.ceil(total / limit), page });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve community feed" });
  }
}

export async function postCommunityMessage(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = communityMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { broadcastId, content, parentId } = parsed.data;

  try {
    const broadcast = await prisma.adminBroadcast.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast || !broadcast.isActive) {
      return res.status(404).json({ error: "Broadcast not found" });
    }

    // Role checks
    if (broadcast.mode === "ANNOUNCEMENT" && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can comment in Announcement mode" });
    }

    if (req.user.role === "ALUMNI") {
      const profile = await prisma.alumniProfile.findUnique({ where: { userId: req.user.id } });
      if (profile?.verificationStatus !== "APPROVED") {
        return res.status(403).json({ error: "Your alumni profile must be approved to participate" });
      }
    }

    const message = await prisma.communityMessage.create({
      data: {
        broadcastId,
        authorId: req.user.id,
        content: sanitizeInput(content),
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            image: true,
            studentProfile: { select: { name: true } },
            alumniProfile: { select: { name: true } },
          },
        },
      },
    });

    const authorName = message.author.studentProfile?.name ?? message.author.alumniProfile?.name ?? message.author.email;
    const formattedMessage = {
      ...message,
      authorName,
    };

    // Emit live Socket message
    triggerGlobalSocketEvent("new-message", formattedMessage);

    return res.json({ success: true, message: formattedMessage });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to post message" });
  }
}
