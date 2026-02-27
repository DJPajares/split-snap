import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessionRoutes } from "./routes/sessions.js";
import { receiptRoutes } from "./routes/receipts.js";
import { authRoutes } from "./routes/auth.js";
import { config } from "./lib/config.js";

export const app = new Hono().basePath("/api");

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: config.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Participant-Token"],
    credentials: true,
  })
);

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
