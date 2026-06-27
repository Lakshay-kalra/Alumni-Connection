"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBroadcast, postCommunityMessage } from "@/actions/platform";
import { getPusherClient } from "@/lib/pusher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Users, Megaphone, Plus, X, Send, MessageSquare, CornerDownRight } from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  content: string;
  mode: string;
  messages: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: { id: string; email: string; role: string };
    replies: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author: { id: string; email: string; role: string };
    }>;
  }>;
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400",
  ALUMNI: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  STUDENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function UserBadge({ email, role }: { email: string; role: string }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback className={`text-xs font-bold ${roleColors[role]}`}>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <span className="text-sm font-medium">{email}</span>
        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${roleColors[role]}`}>{role}</span>
      </div>
    </div>
  );
}

export function CommunityClient({
  broadcasts,
  userRole,
  userId,
}: {
  broadcasts: Broadcast[];
  userRole: string;
  userId: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("COMMUNITY");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe("community");
    channel.bind("new-message", () => router.refresh());
    channel.bind("new-broadcast", () => router.refresh());
    return () => {
      channel.unbind_all();
      pusher.unsubscribe("community");
    };
  }, [router]);

  async function handleCreateBroadcast(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("mode", mode);
    await createBroadcast(formData);
    setShowForm(false);
    router.refresh();
  }

  async function handleReply(broadcastId: string, key: string) {
    const content = replyText[key];
    if (!content?.trim()) return;
    setSending({ ...sending, [key]: true });
    const formData = new FormData();
    formData.append("broadcastId", broadcastId);
    formData.append("content", content);
    await postCommunityMessage(formData);
    setReplyText({ ...replyText, [key]: "" });
    setSending({ ...sending, [key]: false });
    router.refresh();
  }

  const canReply = userRole === "ALUMNI" || userRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Admin broadcast form */}
      {userRole === "ADMIN" && (
        <div>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> New Broadcast
            </Button>
          ) : (
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-lg">Create Broadcast</h3>
                    <p className="text-sm text-muted-foreground">Send a message to the community</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <form onSubmit={handleCreateBroadcast} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input name="title" required placeholder="Broadcast title..." className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select value={mode} onValueChange={setMode}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ANNOUNCEMENT">📢 Announcement (read-only)</SelectItem>
                          <SelectItem value="COMMUNITY">💬 Community (alumni can reply)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Content</Label>
                    <Textarea name="content" required rows={4} placeholder="Write your message..." className="resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="gap-2 shadow-md shadow-primary/20">
                      <Megaphone className="h-4 w-4" /> Publish
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Broadcasts */}
      {broadcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <p className="text-xl font-bold">No broadcasts yet</p>
          <p className="text-muted-foreground text-sm mt-2">Community messages from admins will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((b) => {
            const isCommunity = b.mode === "COMMUNITY";
            return (
              <Card key={b.id} className="overflow-hidden">
                {/* Broadcast header */}
                <div className={`px-5 pt-5 pb-4 border-b ${isCommunity ? "bg-blue-500/5 dark:bg-blue-500/10" : "bg-muted/50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isCommunity ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>
                          {isCommunity ? "💬 Community" : "📢 Announcement"}
                        </span>
                      </div>
                      <h3 className="font-bold text-base">{b.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{b.content}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Messages */}
                  {b.messages.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> {b.messages.length} {b.messages.length === 1 ? "reply" : "replies"}
                      </p>
                      {b.messages.map((msg) => (
                        <div key={msg.id} className="rounded-xl border bg-muted/30 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <UserBadge email={msg.author.email} role={msg.author.role} />
                            <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.content}</p>

                          {/* Replies */}
                          {msg.replies.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msg.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-2 ml-4">
                                  <CornerDownRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                  <div className="flex-1 rounded-lg bg-background border px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <UserBadge email={reply.author.email} role={reply.author.role} />
                                      <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-sm">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {isCommunity && canReply && (
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Reply to community...`}
                        value={replyText[b.id] || ""}
                        onChange={(e) => setReplyText({ ...replyText, [b.id]: e.target.value })}
                        className="h-10"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(b.id, b.id);
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="h-10 w-10 shrink-0 shadow-sm shadow-primary/20"
                        onClick={() => handleReply(b.id, b.id)}
                        disabled={!replyText[b.id]?.trim() || sending[b.id]}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
