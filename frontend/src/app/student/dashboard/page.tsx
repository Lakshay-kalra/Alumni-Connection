import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
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
  GraduationCap,
} from "lucide-react";

export default async function StudentDashboard() {
  await requireRole("STUDENT");

  const [profileRes, mentorshipRes, notificationsRes] = await Promise.all([
    apiFetch<any>("/api/students/profile"),
    apiFetch<any>("/api/mentorship"),
    apiFetch<any[]>("/api/notifications"),
  ]);

  const student = profileRes.data;
  const { requests = [], active = [] } = mentorshipRes.data || {};
  const notifications = (notificationsRes.data || []).slice(0, 8);

  const recommendations = await getRecommendedAlumni();

  const pendingRequests = requests.filter((r: any) => r.status === "PENDING");
  const activeMentorships = active;
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  const stats = [
    { label: "Recommended Mentors", value: recommendations.length, icon: Sparkles, color: "text-[#E31E24]", bg: "border-white/10" },
    { label: "Pending Requests", value: pendingRequests.length, icon: Clock, color: "text-[#F5A623]", bg: "border-white/10" },
    { label: "Active Mentorships", value: activeMentorships.length, icon: MessageSquare, color: "text-[#E31E24]", bg: "border-white/10" },
    { label: "Unread Notifications", value: unreadNotifications.length, icon: Bell, color: "text-[#E31E24]", bg: "border-white/10" },
  ];

  const notifTypes: Record<string, { border: string; emoji: string }> = {
    MENTORSHIP_ACCEPTED: { border: "border-[#E31E24]", emoji: "✅" },
    MENTORSHIP_REJECTED: { border: "border-[#F5A623]", emoji: "❌" },
    NEW_MESSAGE: { border: "border-[#E31E24]", emoji: "💬" },
    EVENT_REMINDER: { border: "border-[#E31E24]", emoji: "📅" },
    NEW_ANNOUNCEMENT: { border: "border-[#E31E24]", emoji: "📢" },
    MENTORSHIP_REQUEST: { border: "border-[#E31E24]", emoji: "🤝" },
  };

  return (
    <div className="space-y-8">
      {/* Header with gradient mesh */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E31E24]/10 p-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#E31E24]/10 blur-[80px]" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-[#E31E24]/8 blur-[80px]" />
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <GraduationCap className="h-4 w-4 text-[#E31E24]" />
              <span>Student Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold">
              Welcome back, {student?.name}
            </h1>
            <p className="text-muted-foreground mt-1">Your student mentorship dashboard</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button size="sm" variant="outline" asChild className="border-white/10">
              <Link href="/alumni-directory">
                <Users className="h-4 w-4 mr-1.5" /> Find Mentors
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/10 bg-white/[0.03] card-hover">
            <CardContent className="pt-6 pb-4 px-5">
              <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center mb-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Mentorships */}
      {activeMentorships.length > 0 && (
        <Card className="border-[#E31E24]/20 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-[#E31E24]" />
              Active Mentorships
            </CardTitle>
            <CardDescription>Your approved mentor connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeMentorships.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="font-semibold text-sm">{m.alumni.name}</p>
                  <p className="text-xs text-muted-foreground">{m.alumni.position} at {m.alumni.company}</p>
                </div>
                <Button size="sm" asChild className="bg-[#E31E24] hover:bg-[#E31E24]/90 gap-1.5">
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
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-[#E31E24]" />
                Recommended Mentors
              </CardTitle>
              <CardDescription>Matched based on your department, interests, and career goals</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 shrink-0 text-[#E31E24] hover:text-[#E31E24]">
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
                <Button size="sm" variant="outline" asChild className="mt-3 border-white/10">
                  <Link href="/student/profile">Update Profile</Link>
                </Button>
              </div>
            ) : (
              recommendations.slice(0, 5).map((alumni) => (
                <div key={alumni.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm">{alumni.name}</p>
                        <Badge variant="secondary" className="text-xs border-[#E31E24]/20 text-[#E31E24]">
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
                        {alumni.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full border border-white/10">{s}</span>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild className="shrink-0 border-white/10">
                      <Link href={`/alumni-directory?id=${alumni.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-[#F5A623]" />
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
              notifications.map((n: any) => {
                const style = notifTypes[n.type] || { border: "border-[#E31E24]", emoji: "🔔" };
                return (
                  <div
                    key={n.id}
                    className={`rounded-xl border-l-4 ${style.border} border border-white/10 border-l-4 px-4 py-3 bg-white/[0.02] ${!n.isRead ? "bg-[#E31E24]/[0.03]" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base">{style.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#E31E24] mt-1.5 shrink-0" />
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
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-[#F5A623]" />
              Pending Mentorship Requests
            </CardTitle>
            <CardDescription>Awaiting response from alumni</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{req.alumni.name}</p>
                    <p className="text-xs text-muted-foreground">{req.alumni.position} at {req.alumni.company}</p>
                  </div>
                  <Badge variant="secondary" className="border-[#F5A623]/20 text-[#F5A623]">Pending</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
