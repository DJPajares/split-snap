import type { ISession } from '../models/session.js';
import type {
  Session,
  SessionItem,
  Participant,
  PendingParticipant,
  KickedUser,
} from '@split-snap/shared';

/**
 * Convert a Mongoose session document into the shared Session type.
 */
export function serializeSession(
  doc: ISession,
  opts?: { role?: 'host' | 'participant' },
): Session {
  return {
    id: doc._id.toString(),
    code: doc.code,
    createdBy: doc.createdBy?.toString() ?? null,
    receiptImageUrl: doc.receiptImageUrl,
    items: doc.items.map(
      (item): SessionItem => ({
        id: item._id.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        claimedBy: item.claimedBy.map((c) => ({
          participantId: c.participantId,
          displayName: c.displayName,
          portion: c.portion,
        })),
      }),
    ),
    participants: doc.participants.map(
      (p): Participant => ({
        id: p._id.toString(),
        displayName: p.displayName,
        userId: p.userId?.toString() ?? null,
        isAnonymous: p.isAnonymous,
        joinedAt: p.joinedAt.toISOString(),
      }),
    ),
    pendingParticipants: (doc.pendingParticipants ?? []).map(
      (p): PendingParticipant => ({
        id: p._id.toString(),
        displayName: p.displayName,
        userId: p.userId?.toString() ?? null,
        isAnonymous: p.isAnonymous,
        requestedAt: p.requestedAt.toISOString(),
      }),
    ),
    kickedUsers: (doc.kickedUsers ?? []).map(
      (k): KickedUser => ({
        userId: k.userId.toString(),
        kickedAt: k.kickedAt.toISOString(),
      }),
    ),
    requireApproval: doc.requireApproval ?? true,
    subtotal: doc.subtotal,
    tax: doc.tax,
    tip: doc.tip,
    total: doc.total,
    currency: doc.currency,
    status: doc.status,
    ...(opts?.role ? { role: opts.role } : {}),
    createdAt: doc.createdAt.toISOString(),
    expiresAt: doc.expiresAt.toISOString(),
  };
}
