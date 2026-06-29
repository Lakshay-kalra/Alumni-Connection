import { Response } from "express";
import { prisma } from "../config/db";
import { studentProfileSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput, parseCommaList } from "../utils/sanitize";

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to retrieve student profile" });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Access denied" });
  }

  const parsed = studentProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { name, department, batch, careerGoals, interests, bio } = parsed.data;

  try {
    // Check if profile exists
    const existing = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const updated = await prisma.studentProfile.update({
      where: { userId: req.user.id },
      data: {
        name: sanitizeInput(name),
        department: sanitizeInput(department),
        batch: batch ? sanitizeInput(batch) : null,
        careerGoals: typeof careerGoals === "string" ? parseCommaList(careerGoals) : (careerGoals || []),
        interests: typeof interests === "string" ? parseCommaList(interests) : (interests || []),
        bio: bio ? sanitizeInput(bio) : null,
      },
    });

    return res.json({ success: true, profile: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update profile" });
  }
}

export async function submitVerification(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { studentIdCard } = req.body;
  if (!studentIdCard) {
    return res.status(400).json({ error: "studentIdCard image path is required" });
  }

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const updated = await prisma.studentProfile.update({
      where: { userId: req.user.id },
      data: {
        studentIdCard,
        verificationStatus: "PENDING",
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    await prisma.notification.createMany({
      data: admins.map((admin: any) => ({
        userId: admin.id,
        type: "PLATFORM_ACTIVITY",
        title: "New Student Verification Request",
        message: `${student.name} requested verification.`,
        link: "/admin/verification/students",
      })),
    });

    return res.json({ success: true, message: "Verification request submitted successfully", profile: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Verification request submission failed" });
  }
}
