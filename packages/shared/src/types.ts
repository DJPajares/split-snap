// ─── Session ───────────────────────────────────────────────

export type SessionStatus = "draft" | "active" | "settled";

export interface SessionItem {
  id: string;
  name: string;
  price: number; // unit price
  quantity: number;
  claimedBy: ItemClaim[];
}

export interface ItemClaim {
  participantId: string;
  displayName: string;
  portion: number; // fraction of the item (1 = full, 0.5 = half, etc.)
}

export interface Participant {
  id: string;
  displayName: string;
  userId?: string | null; // null for anonymous
  isAnonymous: boolean;
  joinedAt: string; // ISO date
}

export interface Session {
  id: string;
  code: string; // 6-char shareable code
  createdBy?: string | null;
  receiptImageUrl?: string | null;
  items: SessionItem[];
  participants: Participant[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  status: SessionStatus;
  createdAt: string;
  expiresAt: string;
}

// ─── User ──────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
}

// ─── API Payloads ──────────────────────────────────────────

export interface CreateSessionPayload {
  items: Omit<SessionItem, "id" | "claimedBy">[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency?: string;
  receiptImageUrl?: string | null;
}

export interface JoinSessionPayload {
  displayName: string;
  userId?: string | null;
}

export interface ClaimItemPayload {
  participantId: string;
  portion?: number; // defaults to 1
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── SSE Events ────────────────────────────────────────────

export type SSEEventType =
  | "session:updated"
  | "participant:joined"
  | "item:claimed"
  | "item:unclaimed"
  | "session:settled";

export interface SSEEvent {
  type: SSEEventType;
  data: Session;
}

// ─── Receipt Scan ──────────────────────────────────────────

export interface ScannedItem {
  name: string;
  price: number;
  quantity: number;
}

export interface ScanResult {
  items: ScannedItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

// ─── Person Summary ────────────────────────────────────────

export interface PersonSummary {
  participantId: string;
  displayName: string;
  items: { name: string; amount: number }[];
  itemsSubtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
}
