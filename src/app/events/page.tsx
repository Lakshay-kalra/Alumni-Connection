import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { EventsClient } from "@/components/events/events-client";
import { auth } from "@/auth";

export default async function EventsPage() {
  await requireAuth();
  const session = await auth();

  const events = await db.event.findMany({
    orderBy: { date: "asc" },
    include: {
      _count: { select: { registrations: true } },
      registrations: session?.user
        ? { where: { userId: session.user.id } }
        : false,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-muted-foreground">Alumni events and meetups</p>
      </div>
      <EventsClient
        events={events.map((e) => ({
          ...e,
          registrationCount: e._count.registrations,
          isRegistered: e.registrations ? e.registrations.length > 0 : false,
        }))}
        userRole={session?.user?.role || "STUDENT"}
      />
    </div>
  );
}
