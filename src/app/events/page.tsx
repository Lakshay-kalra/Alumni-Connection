import { requireAuth } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { EventsClient } from "@/components/events/events-client";
import { auth } from "@/auth";

export default async function EventsPage() {
  await requireAuth();
  const session = await auth();

  const res = await apiFetch<any[]>("/api/events");
  const events = res.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-muted-foreground">Alumni events and meetups</p>
      </div>
      <EventsClient
        events={events}
        userRole={session?.user?.role || "STUDENT"}
      />
    </div>
  );
}
