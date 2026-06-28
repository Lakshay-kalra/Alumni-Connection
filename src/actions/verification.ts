"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-utils";
import { createNotification } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth";

export async function submitStudentVerification(studentIdCard: string): Promise<ActionResult> {
  const user = await requireRole("STUDENT");
  const student = await db.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!student) return { success: false, error: "Student profile not found" };

  await db.studentProfile.update({
    where: { userId: user.id },
    data: {
      studentIdCard,
      verificationStatus: "PENDING",
    },
  });

  // Notify admins
  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "PLATFORM_ACTIVITY" as const,
      title: "New Student Verification Request",
      message: `${student.name} requested verification.`,
      link: "/admin/verification/students",
    })),
  });

  revalidatePath("/student/verification");
  return { success: true, message: "Verification request submitted successfully" };
}

export async function submitAlumniVerification(linkedin: string): Promise<ActionResult> {
  const user = await requireRole("ALUMNI");
  const alumni = await db.alumniProfile.findUnique({
    where: { userId: user.id },
  });
  if (!alumni) return { success: false, error: "Alumni profile not found" };

  await db.alumniProfile.update({
    where: { userId: user.id },
    data: {
      linkedin,
      verificationStatus: "PENDING",
    },
  });

  // Notify admins
  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "ALUMNI_VERIFICATION" as const,
      title: "New Alumni Verification Request",
      message: `${alumni.name} requested verification.`,
      link: "/admin/verification/alumni",
    })),
  });

  revalidatePath("/alumni/verification");
  return { success: true, message: "Verification request submitted successfully" };
}

export async function verifyStudent(studentProfileId: string, action: "approve" | "reject"): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const student = await db.studentProfile.findUnique({
    where: { id: studentProfileId },
  });
  if (!student) return { success: false, error: "Student profile not found" };

  await db.studentProfile.update({
    where: { id: studentProfileId },
    data: {
      verificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
      verifiedAt: action === "approve" ? new Date() : null,
      verifiedBy: action === "approve" ? admin.id : null,
    },
  });

  await createNotification({
    userId: student.userId,
    type: "PLATFORM_ACTIVITY" as const,
    title: action === "approve" ? "Profile Verified" : "Verification Rejected",
    message: action === "approve" 
      ? "Your student profile has been verified successfully." 
      : "Your student verification was rejected. Please upload a valid ID card.",
    link: "/student/verification",
  });

  revalidatePath("/admin/verification/students");
  revalidatePath("/student/verification");
  return { success: true, message: `Student ${action === "approve" ? "approved" : "rejected"} successfully` };
}

export async function verifyAlumni(alumniProfileId: string, action: "approve" | "reject"): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const alumni = await db.alumniProfile.findUnique({
    where: { id: alumniProfileId },
  });
  if (!alumni) return { success: false, error: "Alumni profile not found" };

  await db.alumniProfile.update({
    where: { id: alumniProfileId },
    data: {
      verificationStatus: action === "approve" ? "APPROVED" : "REJECTED",
      verifiedAt: action === "approve" ? new Date() : null,
      verifiedBy: action === "approve" ? admin.id : null,
    },
  });

  await createNotification({
    userId: alumni.userId,
    type: "ALUMNI_VERIFICATION" as const,
    title: action === "approve" ? "Profile Verified" : "Verification Rejected",
    message: action === "approve" 
      ? "Your alumni profile has been verified successfully. You can now access all features." 
      : "Your alumni verification was rejected. Please submit a valid LinkedIn profile.",
    link: "/alumni/verification",
  });

  revalidatePath("/admin/verification/alumni");
  revalidatePath("/alumni/verification");
  revalidatePath("/admin/dashboard");
  return { success: true, message: `Alumni ${action === "approve" ? "approved" : "rejected"} successfully` };
}
