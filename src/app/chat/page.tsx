import { requireAuth } from "@/lib/auth-utils";
import { getUserConversations } from "@/actions/platform";
import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const user = await requireAuth();
  const conversations = await getUserConversations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Private mentorship conversations</p>
      </div>
      <ChatClient conversations={conversations.filter((c) => c.id)} userId={user.id} />
    </div>
  );
}
