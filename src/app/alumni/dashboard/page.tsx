import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MentorshipRequestActions } from "@/components/alumni/mentorship-request-actions";
import Link from "next/link";
import {
  Users,
  Clock,
  Calendar,
  Megaphone,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Star,
} from "lucide-react";
import { formatDateOnly } from "@/lib/utils";

export default async function AlumniDashboard() {
  const user = await requireRole("ALUMNI");
  const alumni = await db.alumniProfile.findUnique({
    where: { userId: user.id },
    include: {
      mentorshipRequests: {
        where: { status: "PENDING" },
        include: { student: true },
        orderBy: { createdAt: "desc" },
      },
      mentorships: {
        where: { isActive: true },
        include: { student: true },
      },
    },
  });

  if (!alumni) return <p>Profile not found</p>;

  const events = await db.event.findMany({
    where: { date: { gte: new Date() } },
    take: 3,
    orderBy: { date: "asc" },
  });

  const announcements = await db.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const menteeCount = alumni.mentorships.length;
  const isFull = menteeCount >= 2;

  const stats = [
    { label: "Pending Requests", value: alumni.mentorshipRequests.length, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { label: "Active Mentees", value: `${menteeCount}/2`, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Upcoming Events", value: events.length, icon: Calendar, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { label: "Announcements", value: announcements.length, icon: Megaphone, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  ];

  const categoryColors: Record<string, string> = {
    NEWS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ACHIEVEMENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    PLACEMENT_REPORT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    DEPARTMENT_UPDATE: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    CAMPUS_UPDATE: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Welcome, {alumni.name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Alumni mentorship dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          {alumni.verificationStatus === "PENDING" && (
            <Badge variant="warning" className="px-3 py-1.5">⏳ Pending Verification</Badge>
          )}
          {alumni.verificationStatus === "APPROVED" && (
            <Badge variant="success" className="px-3 py-1.5 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Verified Alumni
            </Badge>
          )}
          {isFull && (
            <Badge variant="destructive" className="px-3 py-1.5">🔒 Full Capacity</Badge>
          )}
        </div>
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

      {/* Mentorship Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Mentorship Requests
            </CardTitle>
            <CardDescription>Review and respond to student mentorship requests</CardDescription>
          </div>
          {isFull && (
            <Badge variant="destructive" className="shrink-0">Full — 2/2 mentees</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {alumni.mentorshipRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
              <p className="font-medium">No pending requests</p>
              <p className="text-sm text-muted-foreground mt-1">You&apos;ll be notified when students reach out</p>
            </div>
          ) : (
            alumni.mentorshipRequests.map((req) => (
              <div key={req.id} className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{req.student.name}</p>
                      <Badge variant="secondary" className="text-xs">{req.student.department}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1.5">
                      <span className="font-medium text-foreground">Goal:</span> {req.careerGoal}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Motivation:</span>{" "}
                      {req.motivation.length > 120 ? req.motivation.slice(0, 120) + "…" : req.motivation}
                    </p>
                  </div>
                  <MentorshipRequestActions requestId={req.id} isFull={isFull} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Mentees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Active Mentees
            </CardTitle>
            <CardDescription>Your current mentee relationships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alumni.mentorships.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active mentees yet</p>
            ) : (
              alumni.mentorships.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{m.student.name}</p>
                    <p className="text-xs text-muted-foreground">{m.student.department}</p>
                  </div>
                  <Button size="sm" asChild className="gap-1.5">
                    <Link href="/chat">
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Alumni events and meetups</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/events">All <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="rounded-xl border bg-muted/20 px-4 py-3">
                  <p className="font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDateOnly(e.date)} · {e.venue}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-violet-500" />
              Recent Announcements
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/announcements">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm flex-1">{a.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[a.category] || "bg-muted text-muted-foreground"}`}>
                    {a.category.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{a.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
