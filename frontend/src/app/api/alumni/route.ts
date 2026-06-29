import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
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
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 12;
  const skip = (page - 1) * limit;

  const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  try {
    // 1. Fetch alumni directory from backend
    const alumniRes = await fetch(`${apiURL}/api/alumni`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!alumniRes.ok) {
      return NextResponse.json({ error: "Failed to retrieve alumni" }, { status: alumniRes.status });
    }

    let list = await alumniRes.json();

    // 2. Fetch student profile if logged in as student to compute match percentage
    let student: any = null;
    if (session.user.role === "STUDENT") {
      const studentRes = await fetch(`${apiURL}/api/students/profile`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (studentRes.ok) {
        student = await studentRes.json();
      }
    }

    // 3. Perform search filters
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (a: any) =>
          a.name.toLowerCase().includes(q) ||
          (a.company && a.company.toLowerCase().includes(q)) ||
          (a.position && a.position.toLowerCase().includes(q)) ||
          a.department.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }

    if (department) {
      const d = department.toLowerCase();
      list = list.filter((a: any) => a.department.toLowerCase().includes(d));
    }

    if (batch) {
      list = list.filter((a: any) => a.batch === batch);
    }

    if (company) {
      const c = company.toLowerCase();
      list = list.filter((a: any) => a.company && a.company.toLowerCase().includes(c));
    }

    const total = list.length;
    const paginated = list.slice(skip, skip + limit);

    return NextResponse.json({
      alumni: paginated.map((a: any) => ({
        ...a,
        menteeCount: a.currentMentorshipCount,
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
  } catch (error: any) {
    console.error("Alumni route proxy error:", error);
    return NextResponse.json({ error: error.message || "Failed to load directory" }, { status: 500 });
  }
}
