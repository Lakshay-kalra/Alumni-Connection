"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import { MessageSquare, Send, Loader2, Paperclip, FileText, X, Download, File } from "lucide-react";

type Conversation = {
  id?: string;
  mentorshipId: string;
  partnerName: string;
  lastMessage?: { content: string; createdAt: Date };
};

async function fetchMessages(conversationId: string) {
  const res = await fetch(`/api/chat/${conversationId}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export function ChatClient({
  conversations,
  userId,
}: {
  conversations: Conversation[];
  userId: string;
}) {
  type ChatMessage = {
    id: string;
    content: string;
    senderId: string;
    createdAt: string | Date;
    isRead: boolean;
    type: "TEXT" | "FILE" | "RESUME";
    fileUrl?: string | null;
    fileName?: string | null;
  };

  type ChatData = {
    messages: ChatMessage[];
    mentorship: {
      student: { userId: string; user: { id: string; name: string } };
      alumni: { userId: string; user: { id: string; name: string } };
    };
  };
  const [activeId, setActiveId] = useState(conversations[0]?.id || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<"FILE" | "RESUME" | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [typingPartner, setTypingPartner] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeId);

  const { data: chatData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => fetchMessages(activeId),
    enabled: !!activeId,
    refetchInterval: 5000, // poll every 5s as fallback
  });

  useEffect(() => {
    if (!activeId || !socket) return;

    socket.emit("join-conversation", { conversationId: activeId });
    socket.emit("mark-read", { conversationId: activeId });

    const onNewMessage = (newMsg: ChatMessage) => {
      queryClient.setQueryData(["messages", activeId], (old: ChatData | undefined) => {
        if (!old) return old;
        const messages = old.messages || [];
        if (messages.some((m: ChatMessage) => m.id === newMsg.id)) return old;
        return {
          ...old,
          messages: [...messages, newMsg],
        };
      });
      socket.emit("mark-read", { conversationId: activeId });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const onTypingStatus = ({ userId: typingUserId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (typingUserId !== userId) {
        setTypingPartner(isTyping);
      }
    };

    const onMessagesRead = ({ readerId }: { readerId: string }) => {
      if (readerId !== userId) {
        queryClient.setQueryData(["messages", activeId], (old: ChatData | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messages: (old.messages || []).map((m: ChatMessage) =>
              m.senderId === userId ? { ...m, isRead: true, readAt: new Date() } : m
            ),
          };
        });
      }
    };

    socket.on("new-message", onNewMessage);
    socket.on("typing-status", onTypingStatus);
    socket.on("messages-read", onMessagesRead);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("typing-status", onTypingStatus);
      socket.off("messages-read", onMessagesRead);
    };
  }, [activeId, socket, queryClient, userId]);

  // Track partner presence
  const partner = chatData?.mentorship?.student?.userId === userId
    ? chatData?.mentorship?.alumni?.user
    : chatData?.mentorship?.student?.user;
  const partnerUserId = partner?.id;

  useEffect(() => {
    if (!partnerUserId || !socket) return;

    socket.emit("get-user-presence", { targetUserId: partnerUserId });

    const onPresenceStatus = (data: { userId: string; isOnline: boolean; lastSeen: string | Date | null }) => {
      if (data.userId === partnerUserId) {
        setIsOnline(data.isOnline);
        setLastSeen(data.lastSeen ? new Date(data.lastSeen) : null);
      }
    };

    const onPresenceUpdate = (data: { userId: string; isOnline: boolean; lastSeen: string | Date | null }) => {
      if (data.userId === partnerUserId) {
        setIsOnline(data.isOnline);
        setLastSeen(data.lastSeen ? new Date(data.lastSeen) : null);
      }
    };

    socket.on("user-presence-status", onPresenceStatus);
    socket.on("presence-update", onPresenceUpdate);

    return () => {
      socket.off("user-presence-status", onPresenceStatus);
      socket.off("presence-update", onPresenceUpdate);
    };
  }, [partnerUserId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatData?.messages]);

  useEffect(() => {
    if (activeId) inputRef.current?.focus();
  }, [activeId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || !activeId) return;
    setSending(true);

    let fileUrl = "";
    let fileName = "";

    if (selectedFile) {
      setUploadingFile(true);
      try {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });
        if (uploadRes.ok) {
          const resJson = await uploadRes.json();
          fileUrl = resJson.fileUrl;
          fileName = resJson.fileName;
        } else {
          alert("File upload failed!");
          setSending(false);
          setUploadingFile(false);
          return;
        }
      } catch (err) {
        console.error(err);
        alert("File upload failed!");
        setSending(false);
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    if (!socket || !activeId) return;

    // Send Message over Socket.IO
    socket.emit("send-message", {
      conversationId: activeId,
      content: message,
      type: attachmentType || "TEXT",
      fileUrl,
      fileName,
    });

    setMessage("");
    setSelectedFile(null);
    setAttachmentType(null);
    setSending(false);
    inputRef.current?.focus();
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-muted/30 py-24 text-center">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>
        <p className="text-xl font-bold">No conversations yet</p>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs">
          Your messages will appear here once a mentorship request is accepted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r flex flex-col">
        <div className="px-4 py-4 border-b">
          <h2 className="font-bold text-base">Messages</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {conversations.map((c) => {
              const initials = c.partnerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const isActive = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id!)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className={cn(
                      "text-xs font-bold",
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.partnerName}</p>
                    {c.lastMessage && (
                      <p className={cn("text-xs truncate mt-0.5", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {c.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/20 shrink-0">
          {activeConvo && (
            <>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {activeConvo.partnerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm">{activeConvo.partnerName}</p>
                {isOnline ? (
                  <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Online
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {lastSeen ? `Last seen ${formatDate(lastSeen)}` : "Offline"}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 chat-scroll">
          <div className="flex flex-col gap-3 px-6 py-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : chatData?.messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Start the conversation!</p>
                <p className="text-xs text-muted-foreground mt-1">Send a message to kick things off.</p>
              </div>
            ) : (
              chatData?.messages?.map((msg: {
                id: string;
                content: string;
                senderId: string;
                createdAt: string;
                isRead: boolean;
                type: "TEXT" | "FILE" | "RESUME";
                fileUrl?: string | null;
                fileName?: string | null;
              }) => {
                const isMine = msg.senderId === userId;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2 max-w-[75%]", isMine ? "ml-auto flex-row-reverse" : "")}
                  >
                    {!isMine && (
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {activeConvo?.partnerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "flex flex-col gap-1",
                      isMine ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm flex flex-col gap-2 min-w-[140px]",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}>
                        {(msg.type === "FILE" || msg.type === "RESUME") && (
                          <div className={cn(
                            "flex items-center gap-3 p-2.5 rounded-xl border text-sm max-w-full overflow-hidden",
                            isMine
                              ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                              : "bg-background border-border text-foreground"
                          )}>
                            <div className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                              isMine ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                            )}>
                              {msg.type === "RESUME" ? (
                                <FileText className="h-4 w-4" />
                              ) : (
                                <File className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs truncate">{msg.fileName || "Attachment"}</p>
                              <p className={cn(
                                "text-[9px] uppercase font-bold tracking-wider mt-0.5",
                                isMine ? "text-primary-foreground/75" : "text-muted-foreground"
                              )}>
                                {msg.type === "RESUME" ? "Resume Shared" : "File Shared"}
                              </p>
                            </div>
                            <a
                              href={msg.fileUrl || "#"}
                              download={msg.fileName || "download"}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "h-7 w-7 rounded-lg flex items-center justify-center border transition-colors shrink-0",
                                isMine
                                  ? "border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground"
                                  : "border-border hover:bg-accent text-foreground"
                              )}
                              title="Download file"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                      </div>
                      <p className="text-[10px] text-muted-foreground px-1">
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {typingPartner && (
              <div className="flex gap-2 max-w-[75%] items-center text-xs text-muted-foreground italic pl-10 mt-1">
                <span>{activeConvo?.partnerName} is typing</span>
                <span className="flex gap-0.5 mt-0.5">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* File inputs */}
        <input
          type="file"
          id="chat-file-upload"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedFile(file);
              setAttachmentType("FILE");
            }
          }}
        />
        <input
          type="file"
          id="chat-resume-upload"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedFile(file);
              setAttachmentType("RESUME");
            }
          }}
        />

        {/* Selected file preview */}
        {selectedFile && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-muted/60 border-t text-sm shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {attachmentType === "RESUME" ? (
                <FileText className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Paperclip className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="truncate font-medium">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({attachmentType === "RESUME" ? "Resume" : "File"})
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted-foreground/10"
              onClick={() => {
                setSelectedFile(null);
                setAttachmentType(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-4 py-3 border-t bg-background shrink-0"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => document.getElementById("chat-file-upload")?.click()}
            disabled={sending || uploadingFile || !activeId}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-xl"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => document.getElementById("chat-resume-upload")?.click()}
            disabled={sending || uploadingFile || !activeId}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-xl"
            title="Attach resume"
          >
            <FileText className="h-5 w-5" />
          </Button>

          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (socket && activeId) {
                socket.emit("typing", { conversationId: activeId, isTyping: true });
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socket.emit("typing", { conversationId: activeId, isTyping: false });
                }, 2000);
              }
            }}
            placeholder={uploadingFile ? "Uploading file..." : "Type a message..."}
            disabled={!activeId || sending || uploadingFile}
            className="h-11 rounded-xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 shadow-lg shadow-primary/20"
            disabled={sending || uploadingFile || !activeId || (!message.trim() && !selectedFile)}
          >
            {sending || uploadingFile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
