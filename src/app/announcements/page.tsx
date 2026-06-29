import { requireAuth } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { auth } from "@/auth";
import { AnnouncementsClient } from "@/components/announcements/announcements-client";

export default async function AnnouncementsPage() {
  await requireAuth();
  const session = await auth();

  const res = await apiFetch<any[]>("/api/announcements");
  const announcements = res.data || [];

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
