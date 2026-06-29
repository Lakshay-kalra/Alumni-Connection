import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";

let ioInstance: Server | null = null;

export function setIo(io: Server) {
  ioInstance = io;
}

export function triggerSocketEvent(userId: string, event: string, payload: any) {
  if (ioInstance) {
    // Send to specific user room
    ioInstance.to(`user_${userId}`).emit(event, payload);
  }
}

export function triggerGlobalSocketEvent(event: string, payload: any) {
  if (ioInstance) {
    // Send to all connected sockets
    ioInstance.emit(event, payload);
  }
}

export function initSocketServer(io: Server) {
  setIo(io);

  // Authenticate socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication error: Missing token"));
    }

    try {
      const secret = process.env.JWT_SECRET || "jwtsecretkey";
      const decoded = jwt.verify(token as string, secret) as {
        id: string;
        email: string;
        role: string;
      };

      socket.data = {
        userId: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const { userId } = socket.data;

    // Join private room
    socket.join(`user_${userId}`);

    // Update presence in database
    try {
      await prisma.userPresence.upsert({
        where: { userId },
        update: { isOnline: true, lastSeen: new Date() },
        create: { userId, isOnline: true, lastSeen: new Date() },
      });

      // Broadcast presence change
      io.emit("user_presence_change", { userId, isOnline: true });
    } catch (e) {
      console.error("Error setting presence on connection:", e);
    }

    socket.on("send-message", async (data: {
      conversationId: string;
      content: string;
      type: "TEXT" | "FILE" | "RESUME";
      fileUrl?: string;
      fileName?: string;
    }) => {
      try {
        console.log("✉️ [Socket] send-message received:", data, "from userId:", userId);
        const conversation = await prisma.conversation.findUnique({
          where: { id: data.conversationId },
          include: {
            mentorship: {
              include: {
                student: true,
                alumni: true,
              },
            },
          },
        }) as any;

        if (!conversation) {
          console.log("❌ [Socket] Conversation not found:", data.conversationId);
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const { student, alumni } = conversation.mentorship;
        console.log(`ℹ️ [Socket] Access check: student.userId="${student.userId}", alumni.userId="${alumni.userId}", current userId="${userId}"`);
        if (student.userId !== userId && alumni.userId !== userId) {
          console.log("❌ [Socket] Access denied for userId:", userId);
          socket.emit("error", { message: "Access denied" });
          return;
        }

        const recipientUserId = student.userId === userId ? alumni.userId : student.userId;

        // Save the message to database
        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: userId,
            content: data.content,
            type: data.type,
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
          },
        });
        console.log("✅ [Socket] Message created successfully in database:", message.id);
        
        // Broadcast to BOTH sender and recipient rooms so both UIs update instantly!
        io.to(`user_${userId}`).emit("new-message", message);
        io.to(`user_${recipientUserId}`).emit("new-message", message);

        // Create notification for recipient
        const userWithProfile = await prisma.user.findUnique({
          where: { id: userId },
          include: { studentProfile: true, alumniProfile: true },
        }) as any;
        const senderName = userWithProfile?.studentProfile?.name || userWithProfile?.alumniProfile?.name || socket.data.email;
        const notification = await prisma.notification.create({
          data: {
            userId: recipientUserId,
            type: "NEW_MESSAGE",
            title: "New Message",
            message: `You have a new message from ${senderName}.`,
            link: `/chat?cid=${data.conversationId}`,
          },
        });

        io.to(`user_${recipientUserId}`).emit("notification", notification);
      } catch (error) {
        console.error("Error sending message via socket:", error);
      }
    });

    // Handle mark read status via sockets
    socket.on("mark-read", async (data: { conversationId: string }) => {
      try {
        console.log("📖 [Socket] mark-read received for conversationId:", data.conversationId, "from userId:", userId);
        const conversation = await prisma.conversation.findUnique({
          where: { id: data.conversationId },
          include: {
            mentorship: {
              include: {
                student: true,
                alumni: true,
              },
            },
          },
        }) as any;

        if (!conversation) return;

        const { student, alumni } = conversation.mentorship;
        const recipientUserId = student.userId === userId ? alumni.userId : student.userId;

        await prisma.message.updateMany({
          where: {
            conversationId: data.conversationId,
            senderId: recipientUserId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        io.to(`user_${recipientUserId}`).emit("messages-read", { readerId: userId });
      } catch (err) {
        console.error("Error marking messages read:", err);
      }
    });

    // Handle target user presence queries
    socket.on("get-user-presence", async (data: { targetUserId: string }) => {
      try {
        console.log("👀 [Socket] get-user-presence query for targetUserId:", data.targetUserId);
        const presence = await prisma.userPresence.findUnique({
          where: { userId: data.targetUserId },
        });
        socket.emit("user-presence-status", {
          userId: data.targetUserId,
          isOnline: presence?.isOnline || false,
          lastSeen: presence?.lastSeen || null,
        });
      } catch (err) {
        console.error("Error getting user presence:", err);
      }
    });

    // Handle typing events
    socket.on("typing", (data: { conversationId: string; typing: boolean; recipientId: string }) => {
      io.to(`user_${data.recipientId}`).emit("typing_status", {
        conversationId: data.conversationId,
        userId: userId,
        typing: data.typing,
      });
    });

    socket.on("disconnect", async () => {
      try {
        await prisma.userPresence.update({
          where: { userId },
          data: { isOnline: false, lastSeen: new Date() },
        });

        // Broadcast presence change
        io.emit("user_presence_change", { userId, isOnline: false, lastSeen: new Date() });
      } catch (e) {
        console.error("Error updating presence on disconnect:", e);
      }
    });
  });
}
