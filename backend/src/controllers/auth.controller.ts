import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/db";
import { registerSchema, loginSchema } from "../utils/validations";
import { sanitizeInput, parseCommaList } from "../utils/sanitize";
import { AuthenticatedRequest } from "../middleware/auth";

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
  }

  const { role, email, password, name, department, enrollmentNumber, batch, company, position, linkedin, careerGoals, interests } =
    parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    let newUser;
    if (role === "STUDENT") {
      newUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: "STUDENT",
          studentProfile: {
            create: {
              name: sanitizeInput(name),
              department: sanitizeInput(department),
              enrollmentNumber: enrollmentNumber ? sanitizeInput(enrollmentNumber) : null,
              batch: batch ? sanitizeInput(batch) : null,
              careerGoals: parseCommaList(careerGoals || ""),
              interests: parseCommaList(interests || ""),
              verificationStatus: "PENDING",
            },
          },
        },
      });
    } else {
      newUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: "ALUMNI",
          alumniProfile: {
            create: {
              name: sanitizeInput(name),
              department: sanitizeInput(department),
              batch: sanitizeInput(batch!),
              company: company ? sanitizeInput(company) : null,
              position: position ? sanitizeInput(position) : null,
              linkedin: linkedin ? sanitizeInput(linkedin) : null,
              verificationStatus: "PENDING",
            },
          },
        },
      });

      // Send verification notification to admins
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      await prisma.notification.createMany({
        data: admins.map((admin: any) => ({
          userId: admin.id,
          type: "ALUMNI_VERIFICATION",
          title: "New Alumni Registration",
          message: `${name} registered as alumni and needs verification`,
          link: "/admin/dashboard",
        })),
      });
    }

    await prisma.emailVerificationToken.create({
      data: {
        email: email.toLowerCase(),
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    if (role === "STUDENT" && email.toLowerCase().endsWith("@chitkara.edu.in")) {
      return res.json({
        success: true,
        message: `Account created successfully! Please verify your official email. [TEST LINK: Click here to verify](/verify-email?token=${verificationToken})`,
      });
    }

    return res.json({
      success: true,
      message:
        role === "ALUMNI"
          ? "Account created! Your alumni profile is pending admin verification. Please log in after approval."
          : "Account created successfully! Your profile is pending admin verification.",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to register user" });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password structure" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      include: {
        studentProfile: true,
        alumniProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Role-based Verification Status Checks
    if (user.role === "STUDENT") {
      if (user.email.endsWith("@chitkara.edu.in") && !user.emailVerified) {
        return res.status(403).json({ error: "verify-email" });
      }
      if (user.studentProfile?.verificationStatus === "PENDING") {
        return res.status(403).json({ error: "pending-verification" });
      }
      if (user.studentProfile?.verificationStatus === "REJECTED") {
        return res.status(403).json({ error: "rejected-verification" });
      }
    } else if (user.role === "ALUMNI") {
      if (user.alumniProfile?.verificationStatus === "PENDING") {
        return res.status(403).json({ error: "pending-verification" });
      }
      if (user.alumniProfile?.verificationStatus === "REJECTED") {
        return res.status(403).json({ error: "rejected-verification" });
      }
    }

    const secret = process.env.JWT_SECRET || "jwtsecretkey";
    const name = user.studentProfile?.name ?? user.alumniProfile?.name ?? user.email;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
      },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        image: user.image,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Login failed" });
  }
}

export async function verifyEmailToken(req: Request, res: Response) {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    const verifyToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verifyToken || verifyToken.expires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    const user = await prisma.user.update({
      where: { email: verifyToken.email },
      data: { emailVerified: new Date() },
      include: { studentProfile: true },
    });

    if (user && user.role === "STUDENT" && user.studentProfile) {
      if (user.email.toLowerCase().endsWith("@chitkara.edu.in")) {
        await prisma.studentProfile.update({
          where: { id: user.studentProfile.id },
          data: {
            verificationStatus: "APPROVED",
            verifiedAt: new Date(),
          },
        });
      }
    }

    await prisma.emailVerificationToken.delete({ where: { token } });

    return res.json({ success: true, message: "Email verified successfully! You can now log in." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Verification failed" });
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: true,
        alumniProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.studentProfile?.name ?? user.alumniProfile?.name ?? user.email,
      image: user.image,
      studentProfile: user.studentProfile,
      alumniProfile: user.alumniProfile,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch user context" });
  }
}
