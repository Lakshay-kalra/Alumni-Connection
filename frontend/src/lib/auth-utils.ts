import { auth } from "@/auth";
import type { UserRole } from "@/lib/backend-auth";

export type Role = UserRole;
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect(getDashboardPath(user.role));
  }
  return user;
}

export function getDashboardPath(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "ALUMNI":
      return "/alumni/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    default:
      return "/login";
  }
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/admin/") || pathname === "/admin") return role === "ADMIN";
  if (pathname.startsWith("/alumni/") || pathname === "/alumni") return role === "ALUMNI";
  if (pathname.startsWith("/student/") || pathname === "/student") return role === "STUDENT";
  return true;
}
