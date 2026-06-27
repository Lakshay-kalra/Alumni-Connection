import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { AnnouncementsClient } from "@/components/announcements/announcements-client";

export default async function AnnouncementsPage() {
  await requireAuth();
  const session = await auth();

  const announcements = await db.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">College updates and news</p>
      </div>
      <AnnouncementsClient
        announcements={announcements}
        isAdmin={session?.user?.role === "ADMIN"}
      />
    </div>
  );
}
