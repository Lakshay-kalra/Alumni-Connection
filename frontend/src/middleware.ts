import { auth } from "@/auth";
import { canAccessRoute, getDashboardPath } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/forgot-password"];
const authRoutes = ["/login", "/register", "/forgot-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isAuthRoute && isLoggedIn && role) {
    return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
  }

  if (!isPublicRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && role && !canAccessRoute(role, pathname)) {
    const isProtectedRoute =
      pathname.startsWith("/admin/") || pathname === "/admin" ||
      pathname.startsWith("/alumni/") || pathname === "/alumni" ||
      pathname.startsWith("/student/") || pathname === "/student";
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
