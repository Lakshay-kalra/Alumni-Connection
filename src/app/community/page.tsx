import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { CommunityClient } from "@/components/community/community-client";

export default async function CommunityPage() {
  await requireAuth();
  const session = await auth();

  const broadcasts = await db.adminBroadcast.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { email: true, role: true } },
      messages: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, email: true, role: true } },
          replies: {
            include: { author: { select: { id: true, email: true, role: true } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-muted-foreground">Admin broadcasts and alumni discussions</p>
      </div>
      <CommunityClient
        broadcasts={broadcasts}
        userRole={session?.user?.role || "STUDENT"}
        userId={session?.user?.id || ""}
      />
    </div>
  );
}
