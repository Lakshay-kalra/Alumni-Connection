export async function triggerSocketEvent(channel: string, event: string, data: unknown) {
  try {
    // If SOCKET_URL_INTERNAL is provided, use it (useful for serverless containers pointing to a specific internal port)
    const socketUrl = process.env.SOCKET_URL_INTERNAL || "http://localhost:3001";
    const secret = process.env.AUTH_SECRET || "f2a74c764e29bb3da97e937d11f930e4";

    const res = await fetch(`${socketUrl}/api/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        event,
        data,
        secret,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Socket trigger failed with status ${res.status}: ${errorText}`);
    }
  } catch (err) {
    console.error("❌ Socket trigger error:", err);
  }
}
