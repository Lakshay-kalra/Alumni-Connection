import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { triggerSocketEvent, triggerGlobalSocketEvent } from "../sockets/socket";
import { sanitizeInput } from "../utils/sanitize";

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const [
      totalAlumni,
      totalStudents,
      activeMentorships,
      upcomingEvents,
      registrations,
      pendingAlumni,
      pendingStudents,
      recentUsers,
      userGrowth,
      mentorshipStats,
      eventParticipation,
    ] = await Promise.all([
      prisma.alumniProfile.count({ where: { verificationStatus: "APPROVED" } }),
      prisma.studentProfile.count(),
      prisma.mentorship.count({ where: { isActive: true } }),
      prisma.event.count({ where: { date: { gte: new Date() } } }),
      prisma.eventRegistration.count(),
      prisma.alumniProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.studentProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { studentProfile: true, alumniProfile: true },
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      prisma.mentorshipRequest.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.eventRegistration.groupBy({
        by: ["eventId"],
        _count: true,
      }),
    ]);

    return res.json({
      totalAlumni,
      totalStudents,
      activeMentorships,
      upcomingEvents,
      registrations,
      pendingAlumni,
      pendingStudents,
      recentUsers,
      userGrowth,
      mentorshipStats,
      eventParticipation,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve stats" });
  }
}

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    const alumni = await prisma.alumniProfile.findMany({
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return res.json({ students, alumni });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve user lists" });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  const userId = req.params.userId as string;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "ADMIN") {
      return res.status(400).json({ error: "Cannot delete this user" });
    }

    await prisma.user.delete({ where: { id: userId } });
    return res.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to delete user" });
  }
}

export async function verifyStudent(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { studentProfileId, action } = req.body;
  if (!studentProfileId || !action) {
    return res.status(400).json({ error: "studentProfileId and action (approve/reject) are required" });
  }

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
    });

    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const updated = await prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: {
        verificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
        verifiedAt: action === "approve" ? new Date() : null,
        verifiedBy: action === "approve" ? req.user.id : null,
      },
    });

    // Notify Student
    const notification = await prisma.notification.create({
      data: {
        userId: student.userId,
        type: "PLATFORM_ACTIVITY",
        title: action === "approve" ? "Profile Verified" : "Verification Rejected",
        message: action === "approve"
          ? "Your student profile has been verified successfully."
          : "Your student verification was rejected. Please upload a valid ID card.",
        link: "/student/verification",
      },
    });

    triggerSocketEvent(student.userId, "notification", notification);

    return res.json({ success: true, profile: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Verification failed" });
  }
}

export async function verifyAlumni(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { alumniProfileId, action } = req.body;
  if (!alumniProfileId || !action) {
    return res.status(400).json({ error: "alumniProfileId and action (approve/reject) are required" });
  }

  try {
    const alumni = await prisma.alumniProfile.findUnique({
      where: { id: alumniProfileId },
    });

    if (!alumni) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }

    const updated = await prisma.alumniProfile.update({
      where: { id: alumniProfileId },
      data: {
        verificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
        verifiedAt: action === "approve" ? new Date() : null,
        verifiedBy: action === "approve" ? req.user.id : null,
      },
    });

    // Notify Alumni
    const notification = await prisma.notification.create({
      data: {
        userId: alumni.userId,
        type: "ALUMNI_VERIFICATION",
        title: action === "approve" ? "Profile Verified" : "Verification Rejected",
        message: action === "approve"
          ? "Your alumni profile has been verified successfully. You can now access all features."
          : "Your alumni verification was rejected. Please submit a valid LinkedIn profile.",
        link: "/alumni/verification",
      },
    });

    triggerSocketEvent(alumni.userId, "notification", notification);

    return res.json({ success: true, profile: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Verification failed" });
  }
}

export async function createBroadcast(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { title, content, mode } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and Content are required" });
  }

  try {
    const broadcast = await prisma.adminBroadcast.create({
      data: {
        title: sanitizeInput(title),
        content: sanitizeInput(content),
        mode: (mode as "ANNOUNCEMENT" | "COMMUNITY") || "ANNOUNCEMENT",
        authorId: req.user.id,
      },
    });

    // Notify all alumni / students
    const alumni = await prisma.alumniProfile.findMany({
      where: { verificationStatus: "APPROVED" },
    });

    await prisma.notification.createMany({
      data: alumni.map((a: any) => ({
        userId: a.userId,
        type: "NEW_ANNOUNCEMENT",
        title: "Admin Broadcast",
        message: title,
        link: "/community",
      })),
    });

    // Trigger Live socket update for community feed
    triggerGlobalSocketEvent("new-broadcast", broadcast);

    return res.json({ success: true, broadcast });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create broadcast" });
  }
}

import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function importAlumni(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { records } = req.body;
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: "Records array is required" });
  }

  let importedCount = 0;
  let skippedCount = 0;

  try {
    for (const record of records) {
      const { name, batch, department, company, position, email, linkedin } = record;
      
      if (!name || !batch || !department) {
        skippedCount++;
        continue;
      }

      const resolvedEmail = email?.trim() 
        ? email.toLowerCase() 
        : `alumni.${crypto.randomBytes(4).toString("hex")}@chitkara.edu.in`;

      const existingUser = await prisma.user.findUnique({
        where: { email: resolvedEmail },
      });

      if (existingUser) {
        skippedCount++;
        continue;
      }

      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      await prisma.user.create({
        data: {
          email: resolvedEmail,
          passwordHash,
          role: "ALUMNI",
          emailVerified: new Date(),
          alumniProfile: {
            create: {
              name: name.trim(),
              batch: batch.trim(),
              department: department.trim(),
              company: company?.trim() || null,
              position: position?.trim() || null,
              linkedin: linkedin?.trim() || null,
              verificationStatus: "APPROVED",
              verifiedAt: new Date(),
            },
          },
        },
      });

      importedCount++;
    }

    return res.json({
      success: true,
      message: `Successfully imported ${importedCount} alumni. Skipped ${skippedCount} duplicate/invalid records.`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Bulk import failed" });
  }
}
