import { requireAuth } from "@/lib/auth-utils";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getDashboardPath } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const user = await requireAuth();
  const session = await auth();

  const profile =
    user.role === "STUDENT"
      ? await db.studentProfile.findUnique({ where: { userId: user.id } })
      : user.role === "ALUMNI"
        ? await db.alumniProfile.findUnique({ where: { userId: user.id } })
        : null;

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Account and notification preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Email:</strong> {session?.user?.email}</p>
          <p><strong>Role:</strong> <Badge>{user.role}</Badge></p>
          {profile && "name" in profile && <p><strong>Name:</strong> {profile.name}</p>}
          <Button variant="outline" asChild>
            <Link href={getDashboardPath(user.role)}>Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </div>
              {!n.isRead && <Badge variant="default">New</Badge>}
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-muted-foreground">No notifications.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
