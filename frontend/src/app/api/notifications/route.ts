import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { API_BASE } from "@/lib/env";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiURL = API_BASE;

  try {
    const res = await fetch(`${apiURL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to retrieve notifications" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load notifications" }, { status: 500 });
  }
}
