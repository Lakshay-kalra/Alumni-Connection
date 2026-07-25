import { requireRole } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
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
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const res = await apiFetch<any>("/api/admin/dashboard");
  const statsData = res.data || {};

  const {
    totalAlumni = 0,
    totalStudents = 0,
    activeMentorships = 0,
    upcomingEvents = 0,
    registrations = 0,
    pendingAlumni = 0,
    pendingStudents = 0,
    recentUsers = [],
    userGrowth = [],
    mentorshipStats = [],
    eventParticipation = [],
  } = statsData;

  const totalPending = pendingAlumni + pendingStudents;

  const stats = [
    { label: "Verified Alumni", value: totalAlumni, icon: GraduationCap, color: "text-[#E31E24]", bg: "bg-[#E31E24]/10" },
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-[#E31E24]", bg: "bg-[#E31E24]/10" },
    { label: "Active Mentorships", value: activeMentorships, icon: MessageSquare, color: "text-[#E31E24]", bg: "bg-[#E31E24]/10" },
    { label: "Upcoming Events", value: upcomingEvents, icon: Calendar, color: "text-[#E31E24]", bg: "bg-[#E31E24]/10" },
    { label: "Event Registrations", value: registrations, icon: UserCheck, color: "text-[#E31E24]", bg: "bg-[#E31E24]/10" },
    { label: "Pending Verifications", value: totalPending, icon: Clock, color: "text-[#F5A623]", bg: "bg-[#F5A623]/10" },
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
        userGrowth={userGrowth.map((u: any) => ({ role: u.role, count: u._count }))}
        mentorshipStats={mentorshipStats.map((m: any) => ({ status: m.status, count: m._count }))}
        eventParticipation={Array.isArray(eventParticipation) ? eventParticipation.length : eventParticipation}
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
            {recentUsers.map((u: any) => {
              return (
                <div key={u.id} className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {u.studentProfile?.name || u.alumniProfile?.name || u.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center">
                    <Badge variant={u.role === "ADMIN" ? "destructive" : u.role === "ALUMNI" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
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
