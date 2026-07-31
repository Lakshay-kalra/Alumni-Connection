import { Response } from "express";
import { prisma } from "../config/db";
import { announcementSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput } from "../utils/sanitize";

export async function listAnnouncements(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [list, total] = await Promise.all([
      prisma.announcement.findMany({
        skip,
        take: limit,
        include: {
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
      prisma.announcement.count(),
    ]);
    return res.json({ announcements: list, total, pages: Math.ceil(total / limit), page });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve announcements" });
  }
}

export async function createAnnouncement(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { title, content, category } = parsed.data;

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title: sanitizeInput(title),
        content: sanitizeInput(content),
        category,
        authorId: req.user.id,
      },
    });

    // Notify all users
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
    });

    await prisma.notification.createMany({
      data: users.map((u: any) => ({
        userId: u.id,
        type: "NEW_ANNOUNCEMENT",
        title: "New Announcement",
        message: title,
        link: "/announcements",
      })),
    });

    return res.json({ success: true, announcement });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create announcement" });
  }
}
