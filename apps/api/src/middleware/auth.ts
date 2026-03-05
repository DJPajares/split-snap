import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';

import { ErrorCode } from '@split-snap/shared/errors';

import { config } from '../lib/config.js';
import { unauthorized } from '../lib/errors.js';

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface HostTokenPayload {
  sessionCode: string;
  role: 'host';
}

/**
 * Require a valid JWT token. Rejects with 401 if missing/invalid.
 */
export const requireAuth = createMiddleware<{
  Variables: { auth: AuthPayload };
}>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized(ErrorCode.AUTH_MISSING_TOKEN);
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    c.set('auth', payload);
    await next();
  } catch {
    throw unauthorized(ErrorCode.AUTH_INVALID_TOKEN);
  }
});

/**
 * Optional auth — sets auth variable if token is present, but doesn't reject.
 */
export const optionalAuth = createMiddleware<{
  Variables: { auth?: AuthPayload };
}>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
      c.set('auth', payload);
    } catch {
      // Token invalid, proceed without auth
    }
  }
  await next();
});

/**
 * Optional host token — sets hostSessionCode variable if X-Host-Token header is present and valid.
 * This allows guest hosts (unauthenticated session creators) to perform host actions.
 */
export const optionalHostToken = createMiddleware<{
  Variables: { auth?: AuthPayload; hostSessionCode?: string };
}>(async (c, next) => {
  // First, check for regular auth
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
      c.set('auth', payload);
    } catch {
      // Token invalid, proceed without auth
    }
  }

  // Then, check for host token
  const hostToken = c.req.header('X-Host-Token');
  if (hostToken) {
    try {
      const payload = jwt.verify(
        hostToken,
        config.JWT_SECRET,
      ) as HostTokenPayload;
      if (payload.role === 'host' && payload.sessionCode) {
        c.set('hostSessionCode', payload.sessionCode);
      }
    } catch {
      // Host token invalid, proceed without it
    }
  }
  await next();
});

/**
 * Generate a JWT token for a user.
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Generate a host token for a guest-created session.
 */
export function generateHostToken(sessionCode: string): string {
  const payload: HostTokenPayload = { sessionCode, role: 'host' };
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}
