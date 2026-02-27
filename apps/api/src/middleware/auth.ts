import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { config } from "../lib/config.js";

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
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    c.set("auth", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

/**
 * Optional auth — sets auth variable if token is present, but doesn't reject.
 */
export const optionalAuth = createMiddleware<{
  Variables: { auth?: AuthPayload };
}>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
      c.set("auth", payload);
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
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "7d" });
}
