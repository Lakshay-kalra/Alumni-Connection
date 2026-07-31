import { Request, Response } from "express";
import { prisma } from "../config/db";
import { alumniProfileSchema } from "../utils/validations";
import { AuthenticatedRequest } from "../middleware/auth";
import { sanitizeInput, parseCommaList } from "../utils/sanitize";

export async function listAlumni(req: Request, res: Response) {
  try {
    // All filtering + pagination is pushed into the database so we never
    // load the entire directory into memory. Auth still runs upstream
    // (requireAuth on the route); this only changes data fetching.
    const {
      query,
      department,
      batch,
      company,
      page: pageStr,
      limit: limitStr,
    } = req.query as Record<string, string | undefined>;

    const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
    // Cap the page size so a caller can't pull the whole table in one shot.
    const limit = Math.min(
      200,
      Math.max(1, parseInt(limitStr || "12", 10) || 12)
    );
    const skip = (page - 1) * limit;

    // Build the DB where-clause. Free-text `query` searches across name,
    // company, position, department and location (case-insensitive contains).
    const where: any = { verificationStatus: "APPROVED" };

    if (query) {
      const q = query.toLowerCase();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { position: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }
    if (department) {
      where.department = { contains: department.toLowerCase(), mode: "insensitive" };
    }
    if (batch) {
      where.batch = batch;
    }
    if (company) {
      where.company = { contains: company.toLowerCase(), mode: "insensitive" };
    }

    const [list, total] = await Promise.all([
      prisma.alumniProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              image: true,
              presence: true,
            },
          },
          _count: {
            select: { mentorships: { where: { isActive: true } } },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.alumniProfile.count({ where }),
    ]);

    const formatted = list.map((a: any) => ({
      ...a,
      currentMentorshipCount: a._count.mentorships,
      user: {
        ...a.user,
        isOnline: a.user.presence?.isOnline || false,
        lastSeen: a.user.presence?.lastSeen || null,
      },
    }));

    return res.json({
      alumni: formatted,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
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
