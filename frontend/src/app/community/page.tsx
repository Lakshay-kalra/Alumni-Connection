import { requireAuth } from "@/lib/auth-utils";
import { apiFetch } from "@/lib/api";
import { auth } from "@/auth";
import { CommunityClient } from "@/components/community/community-client";

export default async function CommunityPage() {
  await requireAuth();
  const session = await auth();

  const res = await apiFetch<{ broadcasts: any[] }>("/api/community");
  const rawBroadcasts = res.data?.broadcasts || [];

  // Format and reconstruct parent-child reply threads from flat API results
  const broadcasts = rawBroadcasts.map((b) => {
    const parentMessages = b.messages.filter((m: any) => !m.parentId);
    const formattedMessages = parentMessages.map((parent: any) => {
      const replies = b.messages.filter((m: any) => m.parentId === parent.id);
      return {
        ...parent,
        replies,
      };
    });
    return {
      ...b,
      messages: formattedMessages,
    };
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
