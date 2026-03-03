import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { ErrorCode } from "@split-snap/shared";
import { UserModel } from "../models/index.js";
import { requireAuth, generateToken } from "../middleware/auth.js";
import type { AuthPayload } from "../middleware/auth.js";
import { badRequest, unauthorized, notFound, conflict } from "../lib/errors.js";

export const authRoutes = new Hono();

// ─── Register ──────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(50),
});

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(ErrorCode.VALIDATION_FAILED, "Validation failed", parsed.error.flatten());
  }

  const { email, password, name } = parsed.data;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw conflict(ErrorCode.AUTH_EMAIL_TAKEN);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({ email, name, passwordHash });

  const token = generateToken({ userId: user._id.toString(), email });

  return c.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// ─── Login ─────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(ErrorCode.VALIDATION_FAILED, "Validation failed", parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw unauthorized(ErrorCode.AUTH_INVALID_CREDENTIALS);
  }

  const token = generateToken({ userId: user._id.toString(), email });

  return c.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// ─── Get current user ──────────────────────────────────────

authRoutes.get("/me", requireAuth, async (c) => {
  const { userId } = c.get("auth") as AuthPayload;
  const user = await UserModel.findById(userId);
  if (!user) {
    throw notFound(ErrorCode.AUTH_USER_NOT_FOUND);
  }

  return c.json({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  });
});
