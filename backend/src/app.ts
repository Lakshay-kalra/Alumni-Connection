import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import apiRoutes from "./routes/api";

const app = express();

// Configure CORS to allow credentials from the Next.js client origin only
// (trailing slash stripped: browsers never send one in the Origin header)
const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, "");
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// Increased limits to allow uploading base64-encoded files/images
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Rate limiter for auth endpoints (max 10 requests per minute per IP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// Register routes
app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

export default app;
