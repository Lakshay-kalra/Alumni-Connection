import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const list = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve notifications" });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.body;

  try {
    if (id) {
      // Mark specific notification read
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } else {
      // Mark all read for this user
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return res.json({ success: true, message: "Notifications marked as read" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update notification status" });
  }
}
