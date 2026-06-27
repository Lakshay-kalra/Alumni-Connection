import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getRecommendedAlumni } from "@/actions/mentorship";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Clock,
  MessageSquare,
  Bell,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Building2,
  MapPin,
} from "lucide-react";

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");
  const student = await db.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      mentorshipRequests: { include: { alumni: true }, orderBy: { createdAt: "desc" } },
      mentorships: { where: { isActive: true }, include: { alumni: true } },
    },
  });

  const recommendations = await getRecommendedAlumni();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const pendingRequests = student?.mentorshipRequests.filter((r) => r.status === "PENDING") ?? [];
  const acceptedRequests = student?.mentorshipRequests.filter((r) => r.status === "ACCEPTED") ?? [];
  const activeMentorships = student?.mentorships ?? [];
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  const stats = [
    { label: "Recommended Mentors", value: recommendations.length, icon: Sparkles, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
    { label: "Pending Requests", value: pendingRequests.length, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { label: "Active Mentorships", value: activeMentorships.length, icon: MessageSquare, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Unread Notifications", value: unreadNotifications.length, icon: Bell, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  ];

  const notifTypes: Record<string, { color: string; emoji: string }> = {
    MENTORSHIP_ACCEPTED: { color: "border-l-emerald-500", emoji: "✅" },
    MENTORSHIP_REJECTED: { color: "border-l-red-500", emoji: "❌" },
    NEW_MESSAGE: { color: "border-l-blue-500", emoji: "💬" },
    EVENT_REMINDER: { color: "border-l-amber-500", emoji: "📅" },
    NEW_ANNOUNCEMENT: { color: "border-l-violet-500", emoji: "📢" },
    MENTORSHIP_REQUEST: { color: "border-l-primary", emoji: "🤝" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Welcome back, {student?.name} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Your student mentorship dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="pt-6 pb-4 px-5">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Mentorships */}
      {activeMentorships.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Active Mentorships
            </CardTitle>
            <CardDescription>Your approved mentor connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeMentorships.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3">
                <div>
                  <p className="font-semibold text-sm">{m.alumni.name}</p>
                  <p className="text-xs text-muted-foreground">{m.alumni.position} at {m.alumni.company}</p>
                </div>
                <Button size="sm" asChild className="gap-1.5">
                  <Link href="/chat">
                    <MessageSquare className="h-3.5 w-3.5" /> Chat
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recommended Mentors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                Recommended Mentors
              </CardTitle>
              <CardDescription>Matched based on your department, interests, and career goals</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 shrink-0">
              <Link href="/alumni-directory">All <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-sm">No recommendations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Update your profile with interests and career goals
                </p>
                <Button size="sm" variant="outline" asChild className="mt-3">
                  <Link href="/student/profile">Update Profile</Link>
                </Button>
              </div>
            ) : (
              recommendations.slice(0, 5).map((alumni) => (
                <div key={alumni.id} className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{alumni.name}</p>
                        <Badge variant="success" className="text-xs">
                          {alumni.matchPercentage}% Match
                        </Badge>
                        {alumni.menteeCount >= 2 && <Badge variant="destructive" className="text-xs">Full</Badge>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                        {alumni.company && (
                          <>
                            <Building2 className="h-3 w-3" />
                            <span>{alumni.position} at {alumni.company}</span>
                          </>
                        )}
                      </div>
                      {alumni.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{alumni.location}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {alumni.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="shrink-0"
                    >
                      <Link href={`/alumni-directory?id=${alumni.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-rose-500" />
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadNotifications.length} new</Badge>
              )}
            </CardTitle>
            <CardDescription>Your recent activity and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = notifTypes[n.type] || { color: "border-l-primary", emoji: "🔔" };
                return (
                  <div
                    key={n.id}
                    className={`rounded-xl border-l-4 ${style.color} bg-muted/30 px-4 py-3 ${!n.isRead ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base">{style.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Mentorship Requests
            </CardTitle>
            <CardDescription>Awaiting response from alumni</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="rounded-xl border bg-amber-50/30 dark:bg-amber-950/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{req.alumni.name}</p>
                    <p className="text-xs text-muted-foreground">{req.alumni.position} at {req.alumni.company}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
