import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { SessionModel } from "../models/index.js";
import { generateSessionCode } from "../lib/utils.js";
import { serializeSession } from "../lib/serialize.js";
import { sseManager } from "../services/sse-manager.js";
import { optionalAuth } from "../middleware/auth.js";

export const sessionRoutes = new Hono();

// ─── Create session ────────────────────────────────────────

const createSessionSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      price: z.number().min(0),
      quantity: z.number().int().min(1).default(1),
    })
  ),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  tip: z.number().min(0).default(0),
  total: z.number().min(0),
  currency: z.string().default("USD"),
  receiptImageUrl: z.string().nullable().optional(),
});

sessionRoutes.post("/", optionalAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const auth = c.get("auth" as never) as { userId: string } | undefined;

  // Generate unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateSessionCode();
    const existing = await SessionModel.findOne({ code });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return c.json({ error: "Failed to generate unique session code" }, 500);
  }

  const session = await SessionModel.create({
    code,
    createdBy: auth?.userId ?? null,
    items: parsed.data.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      claimedBy: [],
    })),
    subtotal: parsed.data.subtotal,
    tax: parsed.data.tax,
    tip: parsed.data.tip,
    total: parsed.data.total,
    currency: parsed.data.currency,
    receiptImageUrl: parsed.data.receiptImageUrl ?? null,
  });

  return c.json(serializeSession(session), 201);
});

// ─── Get session ───────────────────────────────────────────

sessionRoutes.get("/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const session = await SessionModel.findOne({ code });
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json(serializeSession(session));
});

// ─── Join session ──────────────────────────────────────────

const joinSchema = z.object({
  displayName: z.string().min(1).max(30),
  userId: z.string().nullable().optional(),
});

sessionRoutes.post("/:code/join", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const body = await c.req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const session = await SessionModel.findOne({ code });
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  if (session.status === "settled") {
    return c.json({ error: "Session is already settled" }, 400);
  }

  // Check if participant with same name already exists
  const existingParticipant = session.participants.find(
    (p: { displayName: string }) => p.displayName.toLowerCase() === parsed.data.displayName.toLowerCase()
  );

  if (existingParticipant) {
    // Return existing participant (rejoin)
    return c.json({
      session: serializeSession(session),
      participantId: existingParticipant._id.toString(),
    });
  }

  session.participants.push({
    displayName: parsed.data.displayName,
    userId: parsed.data.userId ?? null,
    isAnonymous: !parsed.data.userId,
    joinedAt: new Date(),
  } as never);

  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, "participant:joined", serialized);

  const newParticipant = session.participants[session.participants.length - 1];

  return c.json({
    session: serialized,
    participantId: newParticipant._id.toString(),
  });
});

// ─── Claim / unclaim item ──────────────────────────────────

const claimSchema = z.object({
  participantId: z.string(),
  portion: z.number().min(0).max(1).default(1),
});

sessionRoutes.patch("/:code/items/:itemId/claim", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const itemId = c.req.param("itemId");
  const body = await c.req.json();
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const session = await SessionModel.findOne({ code });
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  if (session.status === "settled") {
    return c.json({ error: "Session is already settled" }, 400);
  }

  const item = session.items.id(itemId);
  if (!item) {
    return c.json({ error: "Item not found" }, 404);
  }

  // Verify participant exists
  const participant = session.participants.id(parsed.data.participantId);
  if (!participant) {
    return c.json({ error: "Participant not found" }, 404);
  }

  // Toggle: if already claimed by this participant, unclaim
  const existingClaimIndex = item.claimedBy.findIndex(
    (c: { participantId: string }) => c.participantId === parsed.data.participantId
  );

  let eventType: "item:claimed" | "item:unclaimed";

  if (existingClaimIndex >= 0) {
    // Unclaim
    item.claimedBy.splice(existingClaimIndex, 1);
    eventType = "item:unclaimed";
  } else {
    // Claim
    item.claimedBy.push({
      participantId: parsed.data.participantId,
      displayName: participant.displayName,
      portion: parsed.data.portion,
    });
    eventType = "item:claimed";
  }

  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, eventType, serialized);

  return c.json(serialized);
});

// ─── Settle session ────────────────────────────────────────

sessionRoutes.patch("/:code/settle", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const session = await SessionModel.findOne({ code });
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const hasUnclaimedItems = session.items.some(
    (item: { claimedBy: unknown[] }) => item.claimedBy.length === 0
  );
  if (hasUnclaimedItems) {
    return c.json({ error: "All items must be claimed before settling" }, 400);
  }

  session.status = "settled";
  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, "session:settled", serialized);

  return c.json(serialized);
});

// ─── SSE: Real-time session updates ────────────────────────

sessionRoutes.get("/:code/events", async (c) => {
  const code = c.req.param("code").toUpperCase();

  const session = await SessionModel.findOne({ code });
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return streamSSE(c, async (stream) => {
    // Send initial session state
    const serialized = serializeSession(session);
    await stream.writeSSE({
      event: "session:updated",
      data: JSON.stringify(serialized),
    });

    // Register with SSE manager for future broadcasts
    const readable = sseManager.connect(code);
    const reader = readable.getReader();

    try {
      // Keep the connection alive with heartbeat
      const heartbeat = setInterval(async () => {
        try {
          await stream.writeSSE({ event: "heartbeat", data: "" });
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Forward broadcasts from SSE manager
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // value is already encoded as a SSE message string
        const text = new TextDecoder().decode(value);
        // Write raw text since it's already formatted as SSE
        await stream.write(text);
      }

      clearInterval(heartbeat);
    } catch {
      // Client disconnected
    } finally {
      reader.releaseLock();
      sseManager.disconnect(code, readable);
    }
  });
});
