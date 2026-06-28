import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminCharts } from "@/components/admin/admin-charts";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  MessageSquare,
  Calendar,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const [
    totalAlumni,
    totalStudents,
    activeMentorships,
    upcomingEvents,
    registrations,
    pendingAlumni,
    pendingStudents,
    recentUsers,
  ] = await Promise.all([
    db.alumniProfile.count({ where: { verificationStatus: "APPROVED" } }),
    db.studentProfile.count(),
    db.mentorship.count({ where: { isActive: true } }),
    db.event.count({ where: { date: { gte: new Date() } } }),
    db.eventRegistration.count(),
    db.alumniProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.studentProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { studentProfile: true, alumniProfile: true },
    }),
  ]);

  const userGrowth = await db.user.groupBy({ by: ["role"], _count: true });
  const mentorshipStats = await db.mentorshipRequest.groupBy({ by: ["status"], _count: true });
  const eventParticipation = await db.eventRegistration.groupBy({ by: ["eventId"], _count: true });

  const totalPending = pendingAlumni + pendingStudents;

  const stats = [
    { label: "Verified Alumni", value: totalAlumni, icon: GraduationCap, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
    { label: "Active Mentorships", value: activeMentorships, icon: MessageSquare, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Upcoming Events", value: upcomingEvents, icon: Calendar, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { label: "Event Registrations", value: registrations, icon: UserCheck, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
    { label: "Pending Verifications", value: totalPending, icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and management tools</p>
        </div>
        {totalPending > 0 && (
          <Badge variant="warning" className="text-sm px-3 py-1.5">
            {totalPending} pending verification{totalPending > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      {/* Charts */}
      <AdminCharts
        userGrowth={userGrowth.map((u) => ({ role: u.role, count: u._count }))}
        mentorshipStats={mentorshipStats.map((m) => ({ status: m.status, count: m._count }))}
        eventParticipation={eventParticipation.length}
      />

      {/* Bottom tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verification Action Center
            </CardTitle>
            <CardDescription>Manage student ID and alumni LinkedIn verification queues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Student Verification Queue</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendingStudents} student{pendingStudents === 1 ? "" : "s"} waiting for ID approval
                </p>
              </div>
              <Link href="/admin/verification/students">
                <Badge variant={pendingStudents > 0 ? "warning" : "secondary"} className="hover:opacity-80 flex items-center gap-1 cursor-pointer">
                  Go to Queue <ArrowRight className="h-3 w-3" />
                </Badge>
              </Link>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Alumni Verification Queue</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendingAlumni} alumni waiting for LinkedIn approval
                </p>
              </div>
              <Link href="/admin/verification/alumni">
                <Badge variant={pendingAlumni > 0 ? "warning" : "secondary"} className="hover:opacity-80 flex items-center gap-1 cursor-pointer">
                  Go to Queue <ArrowRight className="h-3 w-3" />
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Registrations
            </CardTitle>
            <CardDescription>Latest users to join the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentUsers.map((u) => {
              const roleColors: Record<string, string> = {
                ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400",
                ALUMNI: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                STUDENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              };
              return (
                <div key={u.id} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {u.studentProfile?.name || u.alumniProfile?.name || u.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${roleColors[u.role]}`}>
                    {u.role}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
