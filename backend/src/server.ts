import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { initSocketServer } from "./sockets/socket";

// Load environment variables
dotenv.config();

const port = process.env.PORT || 5000;
const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, "");

const server = http.createServer(app);

// Bind Socket.IO to the shared HTTP server
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

// Initialize real-time presence and message room subscriptions
initSocketServer(io);

server.listen(port, () => {
  console.log(`🚀 Express & Socket.IO server running on http://localhost:${port}`);
});
