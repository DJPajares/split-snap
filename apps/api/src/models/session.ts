import mongoose, { Schema, Document } from 'mongoose';
import { SESSION_EXPIRY_DAYS, DEFAULT_CURRENCY } from '@split-snap/shared';

// ─── Sub-schemas ───────────────────────────────────────────

const ItemClaimSchema = new Schema(
  {
    participantId: { type: String, required: true },
    displayName: { type: String, required: true },
    portion: { type: Number, required: true, default: 1 }
  },
  { _id: false }
);

const SessionItemSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  claimedBy: { type: [ItemClaimSchema], default: [] }
});

const ParticipantSchema = new Schema({
  displayName: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isAnonymous: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now }
});

// ─── Session document ──────────────────────────────────────

export interface ISession extends Document {
  code: string;
  createdBy: mongoose.Types.ObjectId | null;
  receiptImageUrl: string | null;
  items: {
    _id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    claimedBy: {
      participantId: string;
      displayName: string;
      portion: number;
    }[];
  }[];
  participants: {
    _id: mongoose.Types.ObjectId;
    displayName: string;
    userId: mongoose.Types.ObjectId | null;
    isAnonymous: boolean;
    joinedAt: Date;
  }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  status: 'draft' | 'active' | 'settled';
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    code: { type: String, required: true, unique: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    receiptImageUrl: { type: String, default: null },
    items: { type: [SessionItemSchema], default: [] },
    participants: { type: [ParticipantSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    tip: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: DEFAULT_CURRENCY },
    status: {
      type: String,
      enum: ['draft', 'active', 'settled'],
      default: 'active'
    },
    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      index: { expires: 0 } // TTL index: auto-delete at expiresAt
    }
  },
  { timestamps: true }
);

export const SessionModel =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
