"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, PieChart as PieChartIcon, Calendar } from "lucide-react";

import type { TooltipProps } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const roleLabels: Record<string, string> = {
  STUDENT: "Students",
  ALUMNI: "Alumni",
  ADMIN: "Admins",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-background shadow-lg px-3 py-2.5 text-sm">
        <p className="font-semibold text-foreground">{roleLabels[label as string] || label}</p>
        <p className="text-primary font-bold mt-0.5">{payload[0].value} users</p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-background shadow-lg px-3 py-2.5 text-sm">
        <p className="font-semibold">{statusLabels[payload[0].name as string] || payload[0].name}</p>
        <p className="text-primary font-bold mt-0.5">{payload[0].value} requests</p>
      </div>
    );
  }
  return null;
};

export function AdminCharts({
  userGrowth,
  mentorshipStats,
  eventParticipation,
}: {
  userGrowth: { role: string; count: number }[];
  mentorshipStats: { status: string; count: number }[];
  eventParticipation: number;
}) {
  const mappedUserGrowth = userGrowth.map((u) => ({ ...u, name: roleLabels[u.role] || u.role }));
  const mappedMentorship = mentorshipStats.map((m) => ({
    ...m,
    name: statusLabels[m.status] || m.status,
  }));

  const totalRequests = mentorshipStats.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* User Growth Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4 text-primary" />
            User Breakdown
          </CardTitle>
          <CardDescription>Total users by role</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mappedUserGrowth} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {mappedUserGrowth.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mentorship Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-violet-500" />
            Mentorship Requests
          </CardTitle>
          <CardDescription>{totalRequests} total requests</CardDescription>
        </CardHeader>
        <CardContent>
          {mappedMentorship.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
              No requests yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={mappedMentorship}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {mappedMentorship.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Event Participation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-emerald-500" />
            Event Participation
          </CardTitle>
          <CardDescription>Total registrations across all events</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[220px] flex-col items-center justify-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse-slow" />
            <div className="absolute inset-3 rounded-full bg-emerald-500/15" />
            <div className="relative text-center">
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {eventParticipation}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">registrations</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Alumni registered for events</p>
        </CardContent>
      </Card>
    </div>
  );
}
