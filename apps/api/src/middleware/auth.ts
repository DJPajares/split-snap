import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';
import { ErrorCode } from '@split-snap/shared';
import { config } from '../lib/config.js';
import { unauthorized } from '../lib/errors.js';

export interface AuthPayload {
  userId: string;
  email: string;
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
 * Generate a JWT token for a user.
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}
