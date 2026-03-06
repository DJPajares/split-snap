import bcrypt from 'bcryptjs';
import { Hono } from 'hono';

import { ErrorCode } from '@split-snap/shared/errors';

import { badRequest, conflict, notFound, unauthorized } from '../lib/errors.js';
import { loginSchema, registerSchema } from '../lib/schemas.js';
import type { AuthPayload } from '../middleware/auth.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { UserModel } from '../models/index.js';

export const authRoutes = new Hono();

// ─── Register ──────────────────────────────────────────────

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten(),
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw conflict(ErrorCode.AUTH_EMAIL_TAKEN);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({
    email,
    name,
    passwordHash,
    loginAt: new Date(),
  });

  const token = generateToken({ userId: user._id.toString(), email });

  return c.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      loginAt: user.loginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// ─── Login ─────────────────────────────────────────────────

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten(),
    );
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

  // Update loginAt timestamp
  user.loginAt = new Date();
  await user.save();

  const token = generateToken({ userId: user._id.toString(), email });

  return c.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      loginAt: user.loginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// ─── Get current user ──────────────────────────────────────

authRoutes.get('/me', requireAuth, async (c) => {
  const { userId } = c.get('auth') as AuthPayload;
  const user = await UserModel.findById(userId);
  if (!user) {
    throw notFound(ErrorCode.AUTH_USER_NOT_FOUND);
  }

  return c.json({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    loginAt: user.loginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});
