import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calculateMatchPercentage } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const department = searchParams.get("department") || "";
  const batch = searchParams.get("batch") || "";
  const company = searchParams.get("company") || "";
  const skills = searchParams.get("skills") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  const where = {
    verificationStatus: "APPROVED" as const,
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { company: { contains: query, mode: "insensitive" as const } },
        { position: { contains: query, mode: "insensitive" as const } },
        { department: { contains: query, mode: "insensitive" as const } },
        { location: { contains: query, mode: "insensitive" as const } },
      ],
    }),
    ...(department && { department: { contains: department, mode: "insensitive" as const } }),
    ...(batch && { batch }),
    ...(company && { company: { contains: company, mode: "insensitive" as const } }),
    ...(skills && { skills: { hasSome: skills.split(",").map((s) => s.trim()) } }),
  };

  const student =
    session.user.role === "STUDENT"
      ? await db.studentProfile.findUnique({ where: { userId: session.user.id } })
      : null;

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

  return NextResponse.json({
    alumni: alumni.map((a) => ({
      ...a,
      menteeCount: a.mentorships.length,
      matchPercentage: student
        ? calculateMatchPercentage(
            { department: student.department, interests: student.interests, careerGoals: student.careerGoals },
            { department: a.department, skills: a.skills, expertise: a.expertise, industry: a.industry ?? undefined, interests: a.interests }
          )
        : undefined,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
