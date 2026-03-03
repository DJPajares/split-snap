import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import mongoose from 'mongoose';
import { ErrorCode } from '@split-snap/shared';
import { SessionModel } from '../models/index.js';
import { generateSessionCode } from '../lib/utils.js';
import { serializeSession } from '../lib/serialize.js';
import { sseManager } from '../services/sse-manager.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { badRequest, notFound, forbidden, internal } from '../lib/errors.js';

export const sessionRoutes = new Hono();

// ─── List my sessions ──────────────────────────────────────

sessionRoutes.get('/', requireAuth, async (c) => {
  const auth = c.get('auth');
  const roleFilter = c.req.query('role'); // 'host' | 'participant' | undefined (all)

  let query;
  if (roleFilter === 'host') {
    query = { createdBy: auth.userId };
  } else if (roleFilter === 'participant') {
    query = {
      'participants.userId': new mongoose.Types.ObjectId(auth.userId),
      createdBy: { $ne: new mongoose.Types.ObjectId(auth.userId) }
    };
  } else {
    query = {
      $or: [
        { createdBy: auth.userId },
        { 'participants.userId': new mongoose.Types.ObjectId(auth.userId) }
      ]
    };
  }

  const sessions = await SessionModel.find(query).sort({ createdAt: -1 });
  return c.json(
    sessions.map((s) =>
      serializeSession(s, {
        role: s.createdBy?.toString() === auth.userId ? 'host' : 'participant'
      })
    )
  );
});

// ─── Create session ────────────────────────────────────────

const createSessionSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      price: z.number().min(0),
      quantity: z.number().int().min(1).default(1)
    })
  ),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  tip: z.number().min(0).default(0),
  total: z.number().min(0),
  currency: z.string().default('SGD'),
  receiptImageUrl: z.string().nullable().optional()
});

sessionRoutes.post('/', optionalAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten()
    );
  }

  const auth = c.get('auth' as never) as { userId: string } | undefined;

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
    throw internal(ErrorCode.SESSION_CODE_GENERATION_FAILED);
  }

  const session = await SessionModel.create({
    code,
    createdBy: auth?.userId ?? null,
    items: parsed.data.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      claimedBy: []
    })),
    subtotal: parsed.data.subtotal,
    tax: parsed.data.tax,
    tip: parsed.data.tip,
    total: parsed.data.total,
    currency: parsed.data.currency,
    receiptImageUrl: parsed.data.receiptImageUrl ?? null
  });

  return c.json(serializeSession(session), 201);
});

// ─── Get session ───────────────────────────────────────────

sessionRoutes.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  return c.json(serializeSession(session));
});

// ─── Join session ──────────────────────────────────────────

const joinSchema = z.object({
  displayName: z.string().min(1).max(30),
  userId: z.string().nullable().optional()
});

sessionRoutes.post('/:code/join', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const body = await c.req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten()
    );
  }

  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  if (session.status === 'settled') {
    throw badRequest(ErrorCode.SESSION_SETTLED);
  }

  // Check if user was kicked
  if (parsed.data.userId && session.kickedUserIds?.length) {
    const isKicked = session.kickedUserIds.some(
      (id: mongoose.Types.ObjectId) => id.toString() === parsed.data.userId
    );
    if (isKicked) {
      throw forbidden(ErrorCode.SESSION_JOIN_KICKED);
    }
  }

  // Check if participant with same name already exists (rejoin)
  const existingParticipant = session.participants.find(
    (p: { displayName: string }) =>
      p.displayName.toLowerCase() === parsed.data.displayName.toLowerCase()
  );

  if (existingParticipant) {
    // If existing participant is anonymous but now a userId is provided, upgrade
    if (
      existingParticipant.isAnonymous &&
      parsed.data.userId &&
      !existingParticipant.userId
    ) {
      existingParticipant.userId = new mongoose.Types.ObjectId(
        parsed.data.userId
      );
      existingParticipant.isAnonymous = false;
      existingParticipant.displayName = parsed.data.displayName;

      // Update displayName in all claimedBy entries
      for (const item of session.items) {
        for (const claim of item.claimedBy) {
          if (claim.participantId === existingParticipant._id.toString()) {
            claim.displayName = parsed.data.displayName;
          }
        }
      }

      await session.save();
      const serialized = serializeSession(session);
      sseManager.broadcast(code, 'participant:updated', serialized);
    }

    // Return existing participant (rejoin)
    return c.json({
      session: serializeSession(session),
      participantId: existingParticipant._id.toString()
    });
  }

  // Also check for existing participant by userId (logged-in user may have different display name)
  if (parsed.data.userId) {
    const existingByUserId = session.participants.find(
      (p: { userId: mongoose.Types.ObjectId | null }) =>
        p.userId && p.userId.toString() === parsed.data.userId
    );
    if (existingByUserId) {
      return c.json({
        session: serializeSession(session),
        participantId: existingByUserId._id.toString()
      });
    }
  }

  // Check if the joiner is the session creator — skip approval for host
  const isHost =
    parsed.data.userId &&
    session.createdBy &&
    session.createdBy.toString() === parsed.data.userId;

  // If approval is required and the joiner is not the host, add to pending
  if (session.requireApproval && !isHost) {
    // Check if already pending
    const alreadyPending = session.pendingParticipants.find(
      (p: { displayName: string }) =>
        p.displayName.toLowerCase() === parsed.data.displayName.toLowerCase()
    );
    if (alreadyPending) {
      return c.json(
        {
          status: 'pending' as const,
          session: serializeSession(session),
          pendingParticipantId: alreadyPending._id.toString()
        },
        202
      );
    }

    session.pendingParticipants.push({
      displayName: parsed.data.displayName,
      userId: parsed.data.userId
        ? new mongoose.Types.ObjectId(parsed.data.userId)
        : null,
      isAnonymous: !parsed.data.userId,
      requestedAt: new Date()
    } as never);

    await session.save();

    const serialized = serializeSession(session);
    sseManager.broadcast(code, 'participant:pending', serialized);

    const newPending =
      session.pendingParticipants[session.pendingParticipants.length - 1];

    return c.json(
      {
        status: 'pending' as const,
        session: serialized,
        pendingParticipantId: newPending._id.toString()
      },
      202
    );
  }

  session.participants.push({
    displayName: parsed.data.displayName,
    userId: parsed.data.userId
      ? new mongoose.Types.ObjectId(parsed.data.userId)
      : null,
    isAnonymous: !parsed.data.userId,
    joinedAt: new Date()
  } as never);

  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, 'participant:joined', serialized);

  const newParticipant = session.participants[session.participants.length - 1];

  return c.json({
    session: serialized,
    participantId: newParticipant._id.toString()
  });
});

// ─── Claim / unclaim item ──────────────────────────────────

const claimSchema = z.object({
  participantId: z.string(),
  portion: z.number().min(0).max(1).default(1)
});

sessionRoutes.patch('/:code/items/:itemId/claim', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const itemId = c.req.param('itemId');
  const body = await c.req.json();
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten()
    );
  }

  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  if (session.status === 'settled') {
    throw badRequest(ErrorCode.SESSION_SETTLED);
  }

  const item = session.items.id(itemId);
  if (!item) {
    throw notFound(ErrorCode.ITEM_NOT_FOUND);
  }

  // Verify participant exists
  const participant = session.participants.id(parsed.data.participantId);
  if (!participant) {
    throw notFound(ErrorCode.PARTICIPANT_NOT_FOUND);
  }

  // Toggle: if already claimed by this participant, unclaim
  const existingClaimIndex = item.claimedBy.findIndex(
    (c: { participantId: string }) =>
      c.participantId === parsed.data.participantId
  );

  let eventType: 'item:claimed' | 'item:unclaimed';

  if (existingClaimIndex >= 0) {
    // Unclaim
    item.claimedBy.splice(existingClaimIndex, 1);
    eventType = 'item:unclaimed';
  } else {
    // Claim
    item.claimedBy.push({
      participantId: parsed.data.participantId,
      displayName: participant.displayName,
      portion: parsed.data.portion
    });
    eventType = 'item:claimed';
  }

  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, eventType, serialized);

  return c.json(serialized);
});

// ─── Update session items ──────────────────────────────────

const updateItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      price: z.number().min(0),
      quantity: z.number().int().min(1).default(1)
    })
  ),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  tip: z.number().min(0).default(0),
  total: z.number().min(0),
  currency: z.string().optional()
});

sessionRoutes.put('/:code/items', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase();
  const auth = c.get('auth');
  const body = await c.req.json();
  const parsed = updateItemsSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten()
    );
  }

  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  if (session.status === 'settled') {
    throw badRequest(ErrorCode.SESSION_SETTLED);
  }

  // Only the session creator can edit items
  if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
    throw forbidden(ErrorCode.SESSION_EDIT_FORBIDDEN);
  }

  // Build a map of existing items for preserving claims
  type ExistingItem = {
    _id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    claimedBy: {
      participantId: string;
      displayName: string;
      portion: number;
    }[];
  };
  const existingItemsMap = new Map<string, ExistingItem>();
  for (const item of session.items) {
    existingItemsMap.set(item._id.toString(), item as unknown as ExistingItem);
  }

  // Build new items array
  const newItems = parsed.data.items.map((incoming) => {
    if (incoming.id) {
      const existing = existingItemsMap.get(incoming.id);
      if (existing) {
        // Item exists — check if price/quantity changed
        const priceChanged = existing.price !== incoming.price;
        const quantityChanged = existing.quantity !== incoming.quantity;
        return {
          _id: existing._id,
          name: incoming.name,
          price: incoming.price,
          quantity: incoming.quantity,
          claimedBy: priceChanged || quantityChanged ? [] : existing.claimedBy
        };
      }
    }
    // New item
    return {
      name: incoming.name,
      price: incoming.price,
      quantity: incoming.quantity,
      claimedBy: []
    };
  });

  session.items = newItems as typeof session.items;
  session.subtotal = parsed.data.subtotal;
  session.tax = parsed.data.tax;
  session.tip = parsed.data.tip;
  session.total = parsed.data.total;
  if (parsed.data.currency) {
    session.currency = parsed.data.currency;
  }

  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, 'items:updated', serialized);

  return c.json(serialized);
});

// ─── Kick participant ──────────────────────────────────────

sessionRoutes.delete(
  '/:code/participants/:participantId',
  requireAuth,
  async (c) => {
    const code = c.req.param('code').toUpperCase();
    const participantId = c.req.param('participantId');
    const auth = c.get('auth');

    const session = await SessionModel.findOne({ code });
    if (!session) {
      throw notFound(ErrorCode.SESSION_NOT_FOUND);
    }

    if (session.status !== 'active') {
      throw badRequest(ErrorCode.SESSION_KICK_ACTIVE_ONLY);
    }

    // Only the session creator can kick participants
    if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
      throw forbidden(ErrorCode.SESSION_KICK_FORBIDDEN);
    }

    const participant = session.participants.id(participantId);
    if (!participant) {
      throw notFound(ErrorCode.PARTICIPANT_NOT_FOUND);
    }

    // If participant has a userId, add to kicked list to prevent rejoin
    if (participant.userId) {
      if (!session.kickedUserIds) {
        session.kickedUserIds = [] as typeof session.kickedUserIds;
      }
      session.kickedUserIds.push(participant.userId);
    }

    // Remove all claims by this participant from every item
    for (const item of session.items) {
      item.claimedBy = item.claimedBy.filter(
        (c: { participantId: string }) => c.participantId !== participantId
      ) as typeof item.claimedBy;
    }

    // Remove participant
    session.participants = session.participants.filter(
      (p: { _id: mongoose.Types.ObjectId }) =>
        p._id.toString() !== participantId
    ) as typeof session.participants;

    await session.save();

    const serialized = serializeSession(session);
    sseManager.broadcast(code, 'participant:kicked', serialized);

    return c.json(serialized);
  }
);

// ─── Upgrade participant (guest → logged-in) ───────────────

const upgradeSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1).max(30)
});

sessionRoutes.post('/:code/participants/:participantId/upgrade', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const participantId = c.req.param('participantId');
  const body = await c.req.json();
  const parsed = upgradeSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten()
    );
  }

  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  const participant = session.participants.id(participantId);
  if (!participant) {
    throw notFound(ErrorCode.PARTICIPANT_NOT_FOUND);
  }

  const oldDisplayName = participant.displayName;
  participant.userId = new mongoose.Types.ObjectId(parsed.data.userId);
  participant.isAnonymous = false;
  participant.displayName = parsed.data.displayName;

  // Update displayName in all claimedBy entries
  for (const item of session.items) {
    for (const claim of item.claimedBy) {
      if (
        claim.participantId === participantId &&
        claim.displayName === oldDisplayName
      ) {
        claim.displayName = parsed.data.displayName;
      }
    }
  }

  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, 'participant:updated', serialized);

  return c.json(serialized);
});

// ─── Approve pending participant ───────────────────────────

sessionRoutes.post(
  '/:code/participants/:participantId/approve',
  requireAuth,
  async (c) => {
    const code = c.req.param('code').toUpperCase();
    const participantId = c.req.param('participantId');
    const auth = c.get('auth');

    const session = await SessionModel.findOne({ code });
    if (!session) {
      throw notFound(ErrorCode.SESSION_NOT_FOUND);
    }

    if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
      throw forbidden(ErrorCode.SESSION_APPROVE_FORBIDDEN);
    }

    const pendingIndex = session.pendingParticipants.findIndex(
      (p: { _id: mongoose.Types.ObjectId }) =>
        p._id.toString() === participantId
    );
    if (pendingIndex === -1) {
      throw notFound(ErrorCode.PENDING_PARTICIPANT_NOT_FOUND);
    }

    const pending = session.pendingParticipants[pendingIndex];

    // Move from pending to participants
    session.participants.push({
      displayName: pending.displayName,
      userId: pending.userId,
      isAnonymous: pending.isAnonymous,
      joinedAt: new Date()
    } as never);

    session.pendingParticipants.splice(pendingIndex, 1);

    await session.save();

    const newParticipant =
      session.participants[session.participants.length - 1];
    const serialized = serializeSession(session);
    sseManager.broadcast(code, 'participant:approved', serialized);

    return c.json({
      session: serialized,
      participantId: newParticipant._id.toString()
    });
  }
);

// ─── Reject pending participant ────────────────────────────

sessionRoutes.post(
  '/:code/participants/:participantId/reject',
  requireAuth,
  async (c) => {
    const code = c.req.param('code').toUpperCase();
    const participantId = c.req.param('participantId');
    const auth = c.get('auth');

    const session = await SessionModel.findOne({ code });
    if (!session) {
      throw notFound(ErrorCode.SESSION_NOT_FOUND);
    }

    if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
      throw forbidden(ErrorCode.SESSION_APPROVE_FORBIDDEN);
    }

    const pendingIndex = session.pendingParticipants.findIndex(
      (p: { _id: mongoose.Types.ObjectId }) =>
        p._id.toString() === participantId
    );
    if (pendingIndex === -1) {
      throw notFound(ErrorCode.PENDING_PARTICIPANT_NOT_FOUND);
    }

    session.pendingParticipants.splice(pendingIndex, 1);
    await session.save();

    const serialized = serializeSession(session);
    sseManager.broadcast(code, 'participant:rejected', serialized);

    return c.json(serialized);
  }
);

// ─── Update session settings ───────────────────────────────

const settingsSchema = z.object({
  requireApproval: z.boolean().optional()
});

sessionRoutes.patch('/:code/settings', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase();
  const auth = c.get('auth');
  const body = await c.req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      parsed.error.flatten()
    );
  }

  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
    throw forbidden(ErrorCode.SESSION_SETTINGS_FORBIDDEN);
  }

  if (parsed.data.requireApproval !== undefined) {
    session.requireApproval = parsed.data.requireApproval;
  }

  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, 'session:updated', serialized);

  return c.json(serialized);
});

// ─── Delete session ────────────────────────────────────────

sessionRoutes.delete('/:code', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase();
  const auth = c.get('auth');

  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  // Only the session creator can delete
  if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
    throw forbidden(ErrorCode.SESSION_DELETE_FORBIDDEN);
  }

  // Broadcast deletion to all connected clients before deleting
  const serialized = serializeSession(session);
  sseManager.broadcast(code, 'session:deleted', serialized);

  await SessionModel.deleteOne({ _id: session._id });

  return c.json({ success: true });
});

// ─── Settle session ────────────────────────────────────────

sessionRoutes.patch('/:code/settle', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase();
  const auth = c.get('auth');
  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
    throw forbidden(ErrorCode.SESSION_SETTLE_FORBIDDEN);
  }

  const hasUnclaimedItems = session.items.some(
    (item: { claimedBy: unknown[] }) => item.claimedBy.length === 0
  );
  if (hasUnclaimedItems) {
    throw badRequest(ErrorCode.SESSION_ITEMS_NOT_ALL_CLAIMED);
  }

  session.status = 'settled';
  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, 'session:settled', serialized);

  return c.json(serialized);
});

sessionRoutes.patch('/:code/unsettle', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase();
  const auth = c.get('auth');
  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  if (!session.createdBy || session.createdBy.toString() !== auth.userId) {
    throw forbidden(ErrorCode.SESSION_UNSETTLE_FORBIDDEN);
  }

  if (session.status !== 'settled') {
    throw badRequest(ErrorCode.SESSION_NOT_SETTLED);
  }

  session.status = 'active';
  await session.save();

  const serialized = serializeSession(session);
  sseManager.broadcast(code, 'session:updated', serialized);

  return c.json(serialized);
});

// ─── SSE: Real-time session updates ────────────────────────

sessionRoutes.get('/:code/events', async (c) => {
  const code = c.req.param('code').toUpperCase();

  const session = await SessionModel.findOne({ code });
  if (!session) {
    throw notFound(ErrorCode.SESSION_NOT_FOUND);
  }

  return streamSSE(c, async (stream) => {
    // Send initial session state
    const serialized = serializeSession(session);
    await stream.writeSSE({
      event: 'session:updated',
      data: JSON.stringify(serialized)
    });

    // Register with SSE manager for future broadcasts
    const readable = sseManager.connect(code);
    const reader = readable.getReader();

    try {
      // Keep the connection alive with heartbeat
      const heartbeat = setInterval(async () => {
        try {
          await stream.writeSSE({ event: 'heartbeat', data: '' });
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
