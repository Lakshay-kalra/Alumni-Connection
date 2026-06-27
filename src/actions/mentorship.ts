"use server";

import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-utils";
import { calculateMatchPercentage, sanitizeInput } from "@/lib/utils";
import {
  mentorshipRequestSchema,
  studentProfileSchema,
  alumniProfileSchema,
} from "@/lib/validations";
import { createNotification } from "@/actions/auth";
import { triggerPusherEvent } from "@/lib/pusher";
import type { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";

function parseList(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((s) => sanitizeInput(s.trim())).filter(Boolean);
}

export async function updateStudentProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("STUDENT");
  const raw = Object.fromEntries(formData.entries());
  const parsed = studentProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const { name, department, batch, careerGoals, interests, bio } = parsed.data;

  await db.studentProfile.update({
    where: { userId: user.id },
    data: {
      name: sanitizeInput(name),
      department: sanitizeInput(department),
      batch: batch ? sanitizeInput(batch) : null,
      careerGoals: parseList(careerGoals),
      interests: parseList(interests),
      bio: bio ? sanitizeInput(bio) : null,
    },
  });

  revalidatePath("/student/profile");
  return { success: true, message: "Profile updated successfully" };
}

export async function updateAlumniProfile(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("ALUMNI");
  const raw = Object.fromEntries(formData.entries());
  const parsed = alumniProfileSchema.safeParse({
    ...raw,
    mentorshipAvailable: raw.mentorshipAvailable === "on" || raw.mentorshipAvailable === "true",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const data = parsed.data;
  await db.alumniProfile.update({
    where: { userId: user.id },
    data: {
      name: sanitizeInput(data.name),
      batch: sanitizeInput(data.batch),
      department: sanitizeInput(data.department),
      company: data.company ? sanitizeInput(data.company) : null,
      position: data.position ? sanitizeInput(data.position) : null,
      yearsExperience: data.yearsExperience ?? null,
      industry: data.industry ? sanitizeInput(data.industry) : null,
      location: data.location ? sanitizeInput(data.location) : null,
      skills: parseList(data.skills),
      expertise: parseList(data.expertise),
      interests: parseList(data.interests),
      linkedin: data.linkedin || null,
      portfolio: data.portfolio || null,
      mentorshipAvailable: data.mentorshipAvailable ?? true,
    },
  });

  revalidatePath("/alumni/profile");
  return { success: true, message: "Profile updated successfully" };
}

export async function sendMentorshipRequest(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("STUDENT");
  const raw = Object.fromEntries(formData.entries());
  const parsed = mentorshipRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const student = await db.studentProfile.findUnique({ where: { userId: user.id } });
  if (!student) return { success: false, error: "Student profile not found" };

  const alumni = await db.alumniProfile.findUnique({
    where: { id: parsed.data.alumniId },
    include: { user: true, mentorships: { where: { isActive: true } } },
  });

  if (!alumni || alumni.verificationStatus !== "APPROVED") {
    return { success: false, error: "Alumni not available for mentorship" };
  }

  if (alumni.mentorships.length >= 2) {
    return { success: false, error: "This alumni has reached maximum mentee capacity" };
  }

  const existing = await db.mentorshipRequest.findUnique({
    where: { studentId_alumniId: { studentId: student.id, alumniId: alumni.id } },
  });
  if (existing) {
    return { success: false, error: "You already sent a request to this alumni" };
  }

  await db.mentorshipRequest.create({
    data: {
      studentId: student.id,
      alumniId: alumni.id,
      motivation: sanitizeInput(parsed.data.motivation),
      careerGoal: sanitizeInput(parsed.data.careerGoal),
      expectations: sanitizeInput(parsed.data.expectations),
    },
  });

  await createNotification({
    userId: alumni.userId,
    type: "MENTORSHIP_REQUEST",
    title: "New Mentorship Request",
    message: `${student.name} sent you a mentorship request`,
    link: "/alumni/dashboard",
  });

  revalidatePath("/student/dashboard");
  return { success: true, message: "Mentorship request sent successfully" };
}

export async function respondToMentorshipRequest(
  requestId: string,
  action: "accept" | "reject"
): Promise<ActionResult> {
  const user = await requireRole("ALUMNI");
  const alumni = await db.alumniProfile.findUnique({
    where: { userId: user.id },
    include: { mentorships: { where: { isActive: true } } },
  });
  if (!alumni) return { success: false, error: "Profile not found" };

  const request = await db.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { student: { include: { user: true } } },
  });

  if (!request || request.alumniId !== alumni.id) {
    return { success: false, error: "Request not found" };
  }

  if (request.status !== "PENDING") {
    return { success: false, error: "Request already processed" };
  }

  if (action === "accept") {
    if (alumni.mentorships.length >= 2) {
      return { success: false, error: "You have reached maximum mentee capacity (2)" };
    }

    await db.$transaction([
      db.mentorshipRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      }),
      db.mentorship.create({
        data: {
          studentId: request.studentId,
          alumniId: alumni.id,
          conversation: { create: {} },
        },
      }),
    ]);

    await createNotification({
      userId: request.student.userId,
      type: "MENTORSHIP_ACCEPTED",
      title: "Mentorship Accepted",
      message: `${alumni.name} accepted your mentorship request!`,
      link: "/chat",
    });
  } else {
    await db.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    await createNotification({
      userId: request.student.userId,
      type: "MENTORSHIP_REJECTED",
      title: "Mentorship Declined",
      message: `${alumni.name} declined your mentorship request`,
      link: "/student/dashboard",
    });
  }

  revalidatePath("/alumni/dashboard");
  return { success: true, message: action === "accept" ? "Request accepted" : "Request rejected" };
}

export async function verifyAlumni(alumniProfileId: string, action: "approve" | "reject"): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const alumni = await db.alumniProfile.findUnique({
    where: { id: alumniProfileId },
    include: { user: true },
  });
  if (!alumni) return { success: false, error: "Alumni not found" };

  await db.alumniProfile.update({
    where: { id: alumniProfileId },
    data: {
      verificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
      verifiedAt: action === "approve" ? new Date() : null,
      verifiedBy: action === "approve" ? admin.id : null,
    },
  });

  if (action === "approve") {
    await createNotification({
      userId: alumni.userId,
      type: "ALUMNI_VERIFICATION",
      title: "Account Verified",
      message: "Your alumni account has been verified. You can now access all features.",
      link: "/alumni/dashboard",
    });
  }

  revalidatePath("/admin/dashboard");
  return { success: true, message: `Alumni ${action === "approve" ? "approved" : "rejected"}` };
}

export async function getRecommendedAlumni() {
  const user = await requireRole("STUDENT");
  const student = await db.studentProfile.findUnique({ where: { userId: user.id } });
  if (!student) return [];

  const alumni = await db.alumniProfile.findMany({
    where: {
      verificationStatus: "APPROVED",
      mentorshipAvailable: true,
    },
    include: {
      mentorships: { where: { isActive: true } },
      user: { select: { id: true } },
    },
  });

  return alumni
    .filter((a) => a.mentorships.length < 2)
    .map((a) => ({
      ...a,
      matchPercentage: calculateMatchPercentage(
        { department: student.department, interests: student.interests, careerGoals: student.careerGoals },
        { department: a.department, skills: a.skills, expertise: a.expertise, industry: a.industry ?? undefined, interests: a.interests }
      ),
      menteeCount: a.mentorships.length,
    }))
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 6);
}

export async function searchAlumni(params: {
  query?: string;
  department?: string;
  batch?: string;
  company?: string;
  skills?: string;
  page?: number;
  limit?: number;
}) {
  await requireAuth();
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  const skip = (page - 1) * limit;

  const where = {
    verificationStatus: "APPROVED" as const,
    ...(params.query && {
      OR: [
        { name: { contains: params.query, mode: "insensitive" as const } },
        { company: { contains: params.query, mode: "insensitive" as const } },
        { position: { contains: params.query, mode: "insensitive" as const } },
        { department: { contains: params.query, mode: "insensitive" as const } },
        { location: { contains: params.query, mode: "insensitive" as const } },
      ],
    }),
    ...(params.department && { department: { contains: params.department, mode: "insensitive" as const } }),
    ...(params.batch && { batch: params.batch }),
    ...(params.company && { company: { contains: params.company, mode: "insensitive" as const } }),
    ...(params.skills && { skills: { hasSome: params.skills.split(",").map((s) => s.trim()) } }),
  };

  const [alumni, total] = await Promise.all([
    db.alumniProfile.findMany({
      where,
      include: { mentorships: { where: { isActive: true } } },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    db.alumniProfile.count({ where }),
  ]);

  return {
    alumni: alumni.map((a) => ({
      ...a,
      menteeCount: a.mentorships.length,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  };
}
