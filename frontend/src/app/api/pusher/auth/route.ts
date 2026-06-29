import { auth } from "@/auth";
import { getPusherServer } from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const socketId = body.socket_id;
  const channel = body.channel_name;

  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json({ error: "Pusher not configured" }, { status: 503 });
  }

  if (channel.startsWith("private-") || channel.startsWith("presence-")) {
    const authResponse = pusher.authorizeChannel(socketId, channel);
    return NextResponse.json(authResponse);
  }

  if (channel.startsWith("conversation-") || channel.startsWith("user-") || channel === "community") {
    const authResponse = pusher.authorizeChannel(socketId, channel);
    return NextResponse.json(authResponse);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
