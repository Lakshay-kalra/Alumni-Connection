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
