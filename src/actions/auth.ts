"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/utils";
import { registerSchema, forgotPasswordSchema } from "@/lib/validations";
import { triggerPusherEvent } from "@/lib/pusher";

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

function parseCommaList(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((s) => sanitizeInput(s.trim())).filter(Boolean);
}

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const raw = {
    role: formData.get("role") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    name: formData.get("name") as string,
    department: formData.get("department") as string,
    batch: (formData.get("batch") as string) || undefined,
    company: (formData.get("company") as string) || undefined,
    position: (formData.get("position") as string) || undefined,
    careerGoals: (formData.get("careerGoals") as string) || undefined,
    interests: (formData.get("interests") as string) || undefined,
  };

  const limited = rateLimit(`register:${raw.email}`, 5, 3600000);
  if (!limited.success) {
    return { success: false, error: "Too many registration attempts. Try again later." };
  }

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
  }

  const { role, email, password, name, department, batch, company, position, careerGoals, interests } =
    parsed.data;

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  if (role === "STUDENT") {
    await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: "STUDENT",
        studentProfile: {
          create: {
            name: sanitizeInput(name),
            department: sanitizeInput(department),
            batch: batch ? sanitizeInput(batch) : undefined,
            careerGoals: parseCommaList(careerGoals),
            interests: parseCommaList(interests),
          },
        },
      },
    });
  } else {
    await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: "ALUMNI",
        alumniProfile: {
          create: {
            name: sanitizeInput(name),
            department: sanitizeInput(department),
            batch: sanitizeInput(batch!),
            company: company ? sanitizeInput(company) : undefined,
            position: position ? sanitizeInput(position) : undefined,
            verificationStatus: "PENDING",
          },
        },
      },
    });

    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "ALUMNI_VERIFICATION" as const,
        title: "New Alumni Registration",
        message: `${name} registered as alumni and needs verification`,
        link: "/admin/dashboard",
      })),
    });
  }

  await db.emailVerificationToken.create({
    data: {
      email: email.toLowerCase(),
      token: verificationToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return {
    success: true,
    message:
      role === "ALUMNI"
        ? "Account created! Your alumni profile is pending admin verification. Please log in after approval."
        : "Account created successfully! Please log in.",
  };
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const limited = rateLimit(`forgot:${email}`, 3, 3600000);
  if (!limited.success) {
    return { success: false, error: "Too many requests. Try again later." };
  }

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: "Invalid email address" };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.deleteMany({ where: { email: user.email } });
    await db.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  }

  return {
    success: true,
    message: "If an account exists with this email, a reset link has been sent.",
  };
}

export async function resetPassword(token: string, password: string): Promise<ActionResult> {
  const resetToken = await db.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.expires < new Date()) {
    return { success: false, error: "Invalid or expired reset token" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({
    where: { email: resetToken.email },
    data: { passwordHash },
  });
  await db.passwordResetToken.delete({ where: { token } });

  return { success: true, message: "Password reset successfully. You can now log in." };
}

export async function verifyEmail(token: string): Promise<ActionResult> {
  const verifyToken = await db.emailVerificationToken.findUnique({ where: { token } });
  if (!verifyToken || verifyToken.expires < new Date()) {
    return { success: false, error: "Invalid or expired verification token" };
  }

  await db.user.update({
    where: { email: verifyToken.email },
    data: { emailVerified: new Date() },
  });
  await db.emailVerificationToken.delete({ where: { token } });

  return { success: true, message: "Email verified successfully!" };
}

export async function ensureAdminExists() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@alumninetwork.com";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";

  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
}

export async function createNotification(data: {
  userId: string;
  type: import("@prisma/client").NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const notification = await db.notification.create({ data });
  await triggerPusherEvent(`user-${data.userId}`, "notification", notification);
  return notification;
}
