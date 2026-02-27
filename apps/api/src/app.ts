import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import mongoose from "mongoose";
import { sessionRoutes } from "./routes/sessions.js";
import { receiptRoutes } from "./routes/receipts.js";
import { authRoutes } from "./routes/auth.js";
import { config } from "./lib/config.js";

export const app = new Hono().basePath("/api");

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    config.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://split-snap-wapp.vercel.app",
  ])
);

const isAllowedVercelPreviewOrigin = (origin: string) =>
  /^https:\/\/split-snap-wapp-.*\.vercel\.app$/.test(origin);

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (allowedOrigins.includes(origin)) return origin;
      if (isAllowedVercelPreviewOrigin(origin)) return origin;
      return undefined;
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Participant-Token"],
    credentials: true,
  })
);

// Lazy DB connection (reuses across Vercel invocations via module cache)
app.use("*", async (_, next) => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  }
  await next();
});

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.route("/auth", authRoutes);
app.route("/receipts", receiptRoutes);
app.route("/sessions", sessionRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});
