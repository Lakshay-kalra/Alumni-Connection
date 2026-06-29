import { Response } from "express";
import { prisma } from "../config/db";
import { mentorshipRequestSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput } from "../utils/sanitize";
import { triggerSocketEvent } from "../sockets/socket";

export async function requestMentorship(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Only students can request mentorship" });
  }

  const parsed = mentorshipRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { alumniId, motivation, careerGoal, expectations } = parsed.data;

  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!studentProfile) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    if (studentProfile.verificationStatus !== "APPROVED") {
      return res.status(403).json({ error: "Your student profile must be verified before requesting mentorship" });
    }

    // Check if there is already a pending or active request
    const existing = await prisma.mentorshipRequest.findFirst({
      where: {
        studentId: studentProfile.id,
        alumniId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "You already have a pending or active mentorship request with this mentor" });
    }

    // Check mentor capacity
    const alumni = await prisma.alumniProfile.findUnique({
      where: { id: alumniId },
      include: { user: true },
    });

    if (!alumni) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }

    const request = await prisma.mentorshipRequest.create({
      data: {
        studentId: studentProfile.id,
        alumniId,
        motivation: sanitizeInput(motivation),
        careerGoal: sanitizeInput(careerGoal),
        expectations: sanitizeInput(expectations),
        status: "PENDING",
      },
    });

    // Create Notification and trigger Socket
    const notification = await prisma.notification.create({
      data: {
        userId: alumni.userId,
        type: "MENTORSHIP_REQUEST",
        title: "New Mentorship Request",
        message: `${studentProfile.name} sent you a mentorship request.`,
        link: "/alumni/dashboard",
      },
    });

    triggerSocketEvent(alumni.userId, "notification", notification);

    return res.json({ success: true, request });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to submit request" });
  }
}

export async function acceptRequest(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ALUMNI") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  try {
    const alumniProfile = await prisma.alumniProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!alumniProfile) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }

    const request = await prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
      include: { student: { include: { user: true } } },
    });

    if (!request || request.alumniId !== alumniProfile.id) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Request has already been processed" });
    }

    // Check maximum active students (cap of 2)
    const activeCount = await prisma.mentorship.count({
      where: { alumniId: alumniProfile.id, isActive: true },
    });

    if (activeCount >= 2) {
      return res.status(400).json({
        error: "You are currently mentoring the maximum number of students (2). You must conclude one to accept a new student.",
      });
    }

    // Accept request, create active mentorship and message conversation
    const result = await prisma.$transaction(async (tx: any) => {
      const updatedReq = await tx.mentorshipRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      const mentorship = await tx.mentorship.create({
        data: {
          studentId: request.studentId,
          alumniId: alumniProfile.id,
          isActive: true,
          conversation: { create: {} },
        },
      });

      return { updatedReq, mentorship };
    });

    // Notify Student
    const notification = await prisma.notification.create({
      data: {
        userId: request.student.userId,
        type: "MENTORSHIP_ACCEPTED",
        title: "Mentorship Accepted",
        message: `${alumniProfile.name} accepted your mentorship request!`,
        link: "/student/dashboard",
      },
    });

    triggerSocketEvent(request.student.userId, "notification", notification);

    return res.json({ success: true, message: "Request accepted successfully", result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to accept request" });
  }
}

export async function rejectRequest(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ALUMNI") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  try {
    const alumniProfile = await prisma.alumniProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!alumniProfile) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }

    const request = await prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
      include: { student: { include: { user: true } } },
    });

    if (!request || request.alumniId !== alumniProfile.id) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Request has already been processed" });
    }

    const updated = await prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    // Notify Student
    const notification = await prisma.notification.create({
      data: {
        userId: request.student.userId,
        type: "MENTORSHIP_REJECTED",
        title: "Mentorship Declined",
        message: `${alumniProfile.name} declined your mentorship request.`,
        link: "/student/dashboard",
      },
    });

    triggerSocketEvent(request.student.userId, "notification", notification);

    return res.json({ success: true, message: "Request declined successfully", request: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to reject request" });
  }
}

export async function listMentorships(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let requests: any[] = [];
    let active: any[] = [];

    if (req.user.role === "STUDENT") {
      const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
      if (student) {
        requests = await prisma.mentorshipRequest.findMany({
          where: { studentId: student.id },
          include: { alumni: true },
          orderBy: { createdAt: "desc" },
        });

        active = await prisma.mentorship.findMany({
          where: { studentId: student.id, isActive: true },
          include: {
            alumni: {
              include: {
                user: {
                  select: { id: true, email: true, presence: true, image: true },
                },
              },
            },
            conversation: true,
          },
        });
      }
    } else if (req.user.role === "ALUMNI") {
      const alumni = await prisma.alumniProfile.findUnique({ where: { userId: req.user.id } });
      if (alumni) {
        requests = await prisma.mentorshipRequest.findMany({
          where: { alumniId: alumni.id },
          include: { student: true },
          orderBy: { createdAt: "desc" },
        });

        active = await prisma.mentorship.findMany({
          where: { alumniId: alumni.id, isActive: true },
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, email: true, presence: true, image: true },
                },
              },
            },
            conversation: true,
          },
        });
      }
    }

    return res.json({ requests, active });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve mentorship data" });
  }
}
