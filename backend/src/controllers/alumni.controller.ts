import { Request, Response } from "express";
import { prisma } from "../config/db";
import { alumniProfileSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput, parseCommaList } from "../utils/sanitize";

export async function listAlumni(req: Request, res: Response) {
  try {
    const list = await prisma.alumniProfile.findMany({
      where: { verificationStatus: "APPROVED" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            image: true,
            presence: true,
          },
        },
        mentorships: {
          where: { isActive: true },
        },
      },
    });

    // Format output to match client requirements
    const formatted = list.map((a: any) => ({
      ...a,
      currentMentorshipCount: a.mentorships.length,
      user: {
        ...a.user,
        isOnline: a.user.presence?.isOnline || false,
        lastSeen: a.user.presence?.lastSeen || null,
      },
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve alumni directory" });
  }
}

export async function getAlumniDetails(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const alumni = await prisma.alumniProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            image: true,
            presence: true,
          },
        },
        mentorships: {
          where: { isActive: true },
        },
      },
    }) as any;

    if (!alumni) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }

    const formatted = {
      ...alumni,
      currentMentorshipCount: alumni.mentorships.length,
      user: {
        ...alumni.user,
        isOnline: alumni.user.presence?.isOnline || false,
        lastSeen: alumni.user.presence?.lastSeen || null,
      },
    };

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve alumni details" });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ALUMNI") {
    return res.status(403).json({ error: "Access denied" });
  }

  const parsed = alumniProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const {
    name,
    batch,
    department,
    company,
    position,
    yearsExperience,
    industry,
    location,
    skills,
    expertise,
    interests,
    linkedin,
    portfolio,
    mentorshipAvailable,
  } = parsed.data;

  try {
    const existing = await prisma.alumniProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const updated = await prisma.alumniProfile.update({
      where: { userId: req.user.id },
      data: {
        name: sanitizeInput(name),
        batch: sanitizeInput(batch),
        department: sanitizeInput(department),
        company: company ? sanitizeInput(company) : null,
        position: position ? sanitizeInput(position) : null,
        yearsExperience: yearsExperience !== undefined ? yearsExperience : null,
        industry: industry ? sanitizeInput(industry) : null,
        location: location ? sanitizeInput(location) : null,
        skills: typeof skills === "string" ? parseCommaList(skills) : (skills || []),
        expertise: typeof expertise === "string" ? parseCommaList(expertise) : (expertise || []),
        interests: typeof interests === "string" ? parseCommaList(interests) : (interests || []),
        linkedin: linkedin ? sanitizeInput(linkedin) : null,
        portfolio: portfolio ? sanitizeInput(portfolio) : null,
        mentorshipAvailable: mentorshipAvailable !== undefined ? mentorshipAvailable : true,
      },
    });

    return res.json({ success: true, profile: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update profile" });
  }
}

export async function submitVerification(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "ALUMNI") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { linkedin } = req.body;
  if (!linkedin) {
    return res.status(400).json({ error: "LinkedIn URL is required for verification" });
  }

  try {
    const alumni = await prisma.alumniProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!alumni) {
      return res.status(404).json({ error: "Alumni profile not found" });
    }

    const updated = await prisma.alumniProfile.update({
      where: { userId: req.user.id },
      data: {
        linkedin,
        verificationStatus: "PENDING",
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    await prisma.notification.createMany({
      data: admins.map((admin: any) => ({
        userId: admin.id,
        type: "ALUMNI_VERIFICATION",
        title: "New Alumni Verification Request",
        message: `${alumni.name} requested verification.`,
        link: "/admin/verification/alumni",
      })),
    });

    return res.json({ success: true, message: "Verification request submitted successfully", profile: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Verification request submission failed" });
  }
}
