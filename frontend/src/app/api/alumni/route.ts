import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { API_BASE } from "@/lib/env";
import { calculateMatchPercentage } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auth gate preserved. Filtering + pagination are now performed at the DB
  // layer in the backend, so this proxy just forwards the query string and
  // decorates the returned page with matchPercentage + menteeCount.
  const { searchParams } = new URL(req.url);
  const backendParams = new URLSearchParams();
  for (const key of ["query", "department", "batch", "company", "page", "limit"]) {
    const value = searchParams.get(key);
    if (value) backendParams.set(key, value);
  }

  const apiURL = API_BASE;

  try {
    // 1. Fetch a single page of alumni from backend (already filtered + paginated)
    const alumniRes = await fetch(`${apiURL}/api/alumni?${backendParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!alumniRes.ok) {
      return NextResponse.json({ error: "Failed to retrieve alumni" }, { status: alumniRes.status });
    }

    const pageData = await alumniRes.json();
    const page = pageData.alumni || [];
    const total = pageData.total ?? page.length;
    const pages = pageData.pages ?? 1;

    // 2. Fetch the student profile (once) to compute match percentage.
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

    return NextResponse.json({
      alumni: page.map((a: any) => ({
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
      pages,
      page: pageData.page ?? 1,
    });
  } catch (error: any) {
    console.error("Alumni route proxy error:", error);
    return NextResponse.json({ error: error.message || "Failed to load directory" }, { status: 500 });
  }
}
