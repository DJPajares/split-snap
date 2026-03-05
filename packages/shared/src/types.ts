// ─── Session ───────────────────────────────────────────────

export type SessionStatus = 'draft' | 'active' | 'settled';

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

export interface PendingParticipant {
  id: string;
  displayName: string;
  userId?: string | null;
  isAnonymous: boolean;
  requestedAt: string; // ISO date
}

export interface KickedUser {
  userId: string;
  kickedAt: string; // ISO date
}

export interface Session {
  id: string;
  code: string; // 6-char shareable code
  createdBy?: string | null;
  receiptImageUrl?: string | null;
  items: SessionItem[];
  participants: Participant[];
  pendingParticipants: PendingParticipant[];
  kickedUsers: KickedUser[];
  requireApproval: boolean;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  status: SessionStatus;
  role?: 'host' | 'participant'; // populated by API for dashboard
  createdAt: string;
  expiresAt: string;
}

// ─── User ──────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  loginAt?: string | null;
  createdAt: string;
}

// ─── API Payloads ──────────────────────────────────────────

export interface CreateSessionPayload {
  items: Omit<SessionItem, 'id' | 'claimedBy'>[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency?: string;
  receiptImageUrl?: string | null;
}

export interface CreateSessionResponse extends Session {
  participantId?: string | null;
  hostToken?: string | null;
}

export interface JoinSessionPayload {
  displayName: string;
  userId?: string | null;
}

export interface UpdateItemsPayload {
  items: { id?: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency?: string;
}

export interface ClaimItemPayload {
  participantId: string;
  portion?: number; // defaults to 1
}

export interface UpgradeParticipantPayload {
  userId: string;
  displayName: string;
}

export interface MergeParticipantPayload {
  fromParticipantId: string;
  toUserId: string;
  toDisplayName: string;
}

export interface UpdateSessionSettingsPayload {
  requireApproval?: boolean;
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
  | 'session:updated'
  | 'session:deleted'
  | 'participant:joined'
  | 'participant:kicked'
  | 'participant:updated'
  | 'participant:pending'
  | 'participant:approved'
  | 'participant:rejected'
  | 'item:claimed'
  | 'item:unclaimed'
  | 'items:updated'
  | 'session:settled';

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
  items: {
    name: string;
    claimedQuantity: number;
    totalQuantity: number;
    amount: number;
  }[];
  itemsSubtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
}
