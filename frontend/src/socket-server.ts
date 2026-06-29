import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { decode } from "next-auth/jwt";

const prisma = new PrismaClient();
const PORT = process.env.SOCKET_PORT || 3001;

function parseCookies(str: string): Record<string, string> {
  const rx = /([^;=\s]+)=([^;=]+)/g;
  const obj: Record<string, string> = {};
  let match;
  while ((match = rx.exec(str)) !== null) {
    obj[match[1]] = decodeURIComponent(match[2]);
  }
  return obj;
}

async function getSession(cookieHeader?: string) {
  if (!cookieHeader) return null;
  const cookies = parseCookies(cookieHeader);
  const token = cookies["next-auth.session-token"] || cookies["__Secure-next-auth.session-token"];
  if (!token) return null;

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "f2a74c764e29bb3da97e937d11f930e4";
  
  // Try Auth.js / NextAuth v5 salt
  try {
    const decoded = await decode({
      token,
      secret,
      salt: "authjs.session-token",
    });
    if (decoded) return decoded;
  } catch {
    // Fallback try with NextAuth v4 style salt
    try {
      const decoded = await decode({
        token,
        secret,
        salt: cookies["__Secure-next-auth.session-token"]
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      });
      if (decoded) return decoded;
    } catch (e2) {
      console.error("JWT decoding failed:", e2);
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for API trigger
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // REST Trigger Endpoint
  if (req.method === "POST" && req.url === "/api/trigger") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const { event, channel, data, secret } = payload;
        
        const validSecret = process.env.AUTH_SECRET || "f2a74c764e29bb3da97e937d11f930e4";
        if (secret !== validSecret) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Forbidden" }));
          return;
        }

        io.to(channel).emit(event, data);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid trigger payload" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Authentication Middleware
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    const session = await getSession(cookieHeader);

    if (session && session.id) {
      socket.data.user = {
        id: session.id,
        email: session.email,
        role: session.role,
        name: session.name,
      };
      return next();
    }
    
    // Auth fallback via handshake query (for testing or clients passing tokens explicitly)
    const queryToken = socket.handshake.query.token as string;
    if (queryToken) {
      const secret = process.env.AUTH_SECRET || "f2a74c764e29bb3da97e937d11f930e4";
      const sessionFromQuery = await decode({
        token: queryToken,
        secret,
        salt: "authjs.session-token",
      });
      if (sessionFromQuery && sessionFromQuery.id) {
        socket.data.user = {
          id: sessionFromQuery.id,
          email: sessionFromQuery.email,
          role: sessionFromQuery.role,
          name: sessionFromQuery.name,
        };
        return next();
      }
    }

    return next(new Error("Unauthorized connection"));
  } catch {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", async (socket) => {
  const user = socket.data.user;
  const userId = user.id;

  console.log(`⚡ Connected: ${user.name} (${user.role}) - ${socket.id}`);

  // Join a dedicated room for this user so we can send targeted alerts/notifications
  socket.join(`user-${userId}`);
  socket.join(`user-presence-${userId}`);

  // Update presence status to Online in PostgreSQL
  await prisma.userPresence.upsert({
    where: { userId },
    update: { isOnline: true, lastSeen: new Date() },
    create: { userId, isOnline: true, lastSeen: new Date() },
  });

  // Broadcast presence update
  io.emit("presence-update", { userId, isOnline: true, lastSeen: new Date() });

  // 1. Mentorship Chat Room Handlers
  socket.on("join-conversation", async ({ conversationId }) => {
    // Validate that the user belongs to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        mentorship: true,
      },
    });

    if (conversation) {
      const { studentId, alumniId } = conversation.mentorship;
      // Fetch profiles to verify matching user IDs
      const [student, alumni] = await Promise.all([
        prisma.studentProfile.findUnique({ where: { id: studentId } }),
        prisma.alumniProfile.findUnique({ where: { id: alumniId } }),
      ]);

      const isAllowed = 
        (student && student.userId === userId) ||
        (alumni && alumni.userId === userId) ||
        user.role === "ADMIN";

      if (isAllowed) {
        socket.join(`conversation-${conversationId}`);
        console.log(`👤 User ${user.name} joined conversation ${conversationId}`);
      } else {
        socket.emit("error", { message: "Access denied to conversation" });
      }
    }
  });

  socket.on("send-message", async ({ conversationId, content, type, fileUrl, fileName }) => {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { mentorship: true },
    });

    if (!conversation) {
      socket.emit("error", { message: "Conversation not found" });
      return;
    }

    const { studentId, alumniId } = conversation.mentorship;
    const [student, alumni] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { id: studentId } }),
      prisma.alumniProfile.findUnique({ where: { id: alumniId } }),
    ]);

    const isAllowed = 
      (student && student.userId === userId) ||
      (alumni && alumni.userId === userId) ||
      user.role === "ADMIN";

    if (!isAllowed) {
      socket.emit("error", { message: "Not authorized to send messages here" });
      return;
    }

    // Save message to Database
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        type: type || "TEXT",
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Broadcast message to room
    io.to(`conversation-${conversationId}`).emit("new-message", message);

    // Notify the recipient
    const recipientUserId = student?.userId === userId ? alumni?.userId : student?.userId;
    if (recipientUserId) {
      // Create db notification
      const notification = await prisma.notification.create({
        data: {
          userId: recipientUserId,
          type: "NEW_MESSAGE",
          title: `New message from ${user.name}`,
          message: content.length > 60 ? `${content.slice(0, 60)}...` : content,
          link: "/chat",
        },
      });

      // Emit real-time notification
      io.to(`user-${recipientUserId}`).emit("notification", notification);
    }
  });

  socket.on("typing", ({ conversationId, isTyping }) => {
    socket.to(`conversation-${conversationId}`).emit("typing-status", {
      userId,
      isTyping,
    });
  });

  socket.on("mark-read", async ({ conversationId }) => {
    // Update messages in conversation sent by others as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    socket.to(`conversation-${conversationId}`).emit("messages-read", {
      readerId: userId,
    });
  });

  // 2. Alumni Community Chat Handlers
  socket.on("join-community", () => {
    if (user.role === "ALUMNI" || user.role === "ADMIN") {
      socket.join("community-chat");
      console.log(`👥 Alumni ${user.name} joined community chat`);
    } else {
      socket.emit("error", { message: "Only alumni and admins can join community chat" });
    }
  });

  socket.on("send-community-message", async ({ content, broadcastId }) => {
    if (user.role !== "ALUMNI" && user.role !== "ADMIN") {
      socket.emit("error", { message: "Access denied" });
      return;
    }

    // Save message to Database
    const message = await prisma.communityMessage.create({
      data: {
        broadcastId,
        authorId: userId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Emit live message
    io.to("community-chat").emit("new-community-message", message);
  });

  // Handle Presence Queries
  socket.on("get-user-presence", async ({ targetUserId }) => {
    const presence = await prisma.userPresence.findUnique({
      where: { userId: targetUserId },
    });
    socket.emit("user-presence-status", {
      userId: targetUserId,
      isOnline: presence?.isOnline || false,
      lastSeen: presence?.lastSeen || new Date(),
    });
  });

  socket.on("disconnect", async () => {
    console.log(`🔌 Disconnected: ${user.name} - ${socket.id}`);

    // Check if the user has other active connections before declaring offline
    const activeSockets = await io.in(`user-presence-${userId}`).fetchSockets();
    if (activeSockets.length === 0) {
      const lastSeen = new Date();
      await prisma.userPresence.update({
        where: { userId },
        data: { isOnline: false, lastSeen },
      });
      // Broadcast status
      io.emit("presence-update", { userId, isOnline: false, lastSeen });
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Standalone Socket.IO server running on http://localhost:${PORT}`);
});
