import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import mongoose from "mongoose";
import { sessionRoutes } from "./routes/sessions.js";
import { receiptRoutes } from "./routes/receipts.js";
import { authRoutes } from "./routes/auth.js";
import { config } from "./lib/config.js";

export const app = new Hono().basePath("/api");

// Build allowed origins from env vars (no hardcoded URLs)
const allowedOrigins = Array.from(
  new Set(
    [
      config.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()),
    ].filter(Boolean)
  )
);

// Allow Vercel preview deployments (derive pattern from FRONTEND_URL)
const previewPattern = config.FRONTEND_URL.includes(".vercel.app")
  ? new RegExp(
      `^${config.FRONTEND_URL.replace("https://", "https://").replace(".vercel.app", "-.*\\.vercel\\.app")}$`
    )
  : null;

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (allowedOrigins.includes(origin)) return origin;
      if (previewPattern?.test(origin)) return origin;
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
