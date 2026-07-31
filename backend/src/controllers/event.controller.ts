import { Response } from "express";
import { prisma } from "../config/db";
import { eventSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput } from "../utils/sanitize";

export async function listEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [list, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take: limit,
        include: {
          registrations: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.event.count(),
    ]);

    const userId = req.user?.id;
    const formatted = list.map((e: any) => ({
      ...e,
      isRegistered: userId ? e.registrations.some((r: any) => r.userId === userId) : false,
      registrationCount: e.registrations.length,
    }));

    return res.json({ events: formatted, total, pages: Math.ceil(total / limit), page });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve events" });
  }
}

export async function createEvent(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { title, description, date, time, venue, bannerImage } = parsed.data;

  try {
    const event = await prisma.event.create({
      data: {
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        date: new Date(date),
        time: sanitizeInput(time),
        venue: sanitizeInput(venue),
        bannerImage: bannerImage || null,
        createdById: req.user.id,
      },
    });

    // Notify all users about the new event
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
    });

    await prisma.notification.createMany({
      data: users.map((u: any) => ({
        userId: u.id,
        type: "EVENT_REMINDER",
        title: "New Event Scheduled",
        message: `${title} has been scheduled for ${new Date(date).toLocaleDateString()}.`,
        link: "/events",
      })),
    });

    return res.json({ success: true, event });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create event" });
  }
}

export async function updateEvent(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const id = req.params.id as string;
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { title, description, date, time, venue, bannerImage } = parsed.data;

  try {
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: sanitizeInput(title),
        description: sanitizeInput(description),
        date: new Date(date),
        time: sanitizeInput(time),
        venue: sanitizeInput(venue),
        bannerImage: bannerImage || null,
      },
    });

    return res.json({ success: true, event: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update event" });
  }
}

export async function deleteEvent(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const id = req.params.id as string;
  try {
    await prisma.event.delete({ where: { id } });
    return res.json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete event" });
  }
}

export async function toggleRegistration(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { eventId } = req.body;
  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required" });
  }

  try {
    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, userId: req.user.id },
    });

    if (existing) {
      await prisma.eventRegistration.delete({ where: { id: existing.id } });
      return res.json({ success: true, registered: false, message: "Registration cancelled" });
    } else {
      const reg = await prisma.eventRegistration.create({
        data: { eventId, userId: req.user.id },
      });
      return res.json({ success: true, registered: true, registration: reg, message: "Successfully registered" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to toggle registration" });
  }
}
