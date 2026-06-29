"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Upload,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn, formatDate } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/platform";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Notification as PrismaNotification } from "@prisma/client";

const navItems = {
  STUDENT: [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/alumni-directory", label: "Alumni Directory", icon: Search },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/chat", label: "Messages", icon: MessageSquare },
    { href: "/student/profile", label: "My Profile", icon: Users },
    { href: "/student/verification", label: "Verification", icon: ShieldCheck },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  ALUMNI: [
    { href: "/alumni/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/community", label: "Community", icon: Users },
    { href: "/chat", label: "Messages", icon: MessageSquare },
    { href: "/alumni/profile", label: "My Profile", icon: GraduationCap },
    { href: "/alumni/verification", label: "Verification", icon: ShieldCheck },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/verification/students", label: "Student Verification", icon: UserCheck },
    { href: "/admin/verification/alumni", label: "Alumni Verification", icon: GraduationCap },
    { href: "/admin/import", label: "Import Alumni", icon: Upload },
    { href: "/alumni-directory", label: "Alumni", icon: Users },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/community", label: "Community", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
};

const roleColors = {
  ADMIN: "bg-red-500/15 text-red-600 dark:text-red-400",
  ALUMNI: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  STUDENT: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { socket } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<PrismaNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Fetch initial notifications
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n: PrismaNotification) => !n.isRead).length);
        }
      })
      .catch((err) => console.error("Error fetching notifications:", err));

    if (!socket) return;

    const handler = (newNotif: PrismaNotification) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on("notification", handler);

    return () => {
      socket.off("notification", handler);
    };
  }, [session?.user?.id, socket]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleMarkRead = async (notifId: string) => {
    await markNotificationRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/auth");

  if (!session?.user || isPublicRoute) return <>{children}</>;

  const role = session.user.role;
  const items = navItems[role] || [];
  const name = session.user.name || session.user.email || "User";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur-xl">
        <div className="flex h-full items-center gap-3 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href={items[0]?.href || "/"} className="flex items-center gap-2.5 font-bold text-primary">
            <img src="/logo.jpeg" alt="Alumni Network Logo" className="h-8 w-auto rounded-md border" />
            <span className="hidden sm:inline font-bold text-lg tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Alumni Network
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={cn("relative rounded-xl", notifOpen ? "bg-accent" : "")}
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive" />
                )}
              </Button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2.5 z-50 w-80 rounded-2xl border bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10 p-4 space-y-3 focus:outline-none animate-in fade-in-50 slide-in-from-top-1">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <p className="font-bold text-sm">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <ScrollArea className="h-64 pr-2 -mr-2">
                      <div className="space-y-1">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 opacity-40 mb-2" />
                            <p className="text-xs">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n: PrismaNotification) => {
                            const emojis: Record<string, string> = {
                              MENTORSHIP_ACCEPTED: "✅",
                              MENTORSHIP_REJECTED: "❌",
                              NEW_MESSAGE: "💬",
                              EVENT_REMINDER: "📅",
                              NEW_ANNOUNCEMENT: "📢",
                              MENTORSHIP_REQUEST: "🤝",
                              ALUMNI_VERIFICATION: "👮",
                            };
                            return (
                              <div
                                key={n.id}
                                onClick={() => {
                                  if (!n.isRead) handleMarkRead(n.id);
                                  if (n.link) {
                                    setNotifOpen(false);
                                    window.location.href = n.link;
                                  }
                                }}
                                className={cn(
                                  "flex gap-2.5 items-start p-2.5 rounded-xl text-left cursor-pointer transition-all duration-150 border border-transparent hover:bg-accent hover:border-accent-foreground/5",
                                  !n.isRead ? "bg-primary/5 font-medium text-foreground" : "text-muted-foreground"
                                )}
                              >
                                <span className="text-base shrink-0">{emojis[n.type] || "🔔"}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs text-foreground truncate">{n.title}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-normal">{n.message}</p>
                                  <p className="text-[9px] text-muted-foreground/60 mt-1">{formatDate(n.createdAt)}</p>
                                </div>
                                {!n.isRead && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </div>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l ml-1">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-none truncate max-w-[120px]">{name}</p>
                <p className="text-xs text-muted-foreground capitalize">{role.toLowerCase()}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background pt-16 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full pb-6">
            {/* Role badge */}
            <div className="px-4 pt-4 pb-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", roleColors[role])}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {role === "ADMIN" ? "Administrator" : role === "ALUMNI" ? "Alumni" : "Student"}
              </span>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-0.5 px-3 pt-2 flex-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom user card */}
            <div className="mx-3 mt-4 rounded-xl border bg-muted/50 p-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{session.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
