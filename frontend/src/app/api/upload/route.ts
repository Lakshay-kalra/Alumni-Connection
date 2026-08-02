import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { API_BASE } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    const apiURL = API_BASE;
    const res = await fetch(`${apiURL}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        base64,
        fileName: file.name,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Upload failed" }, { status: res.status });
    }

    return NextResponse.json({
      fileUrl: data.url,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error("Upload proxy error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
