export interface SessionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  claimedBy: ItemClaim[];
}

export interface ItemClaim {
  participantId: string;
  displayName: string;
  portion: number;
}

export interface Participant {
  id: string;
  displayName: string;
  userId?: string | null;
  isAnonymous: boolean;
  joinedAt: string;
}

export type SessionStatus = "draft" | "active" | "settled";

export interface Session {
  id: string;
  code: string;
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

export type SSEEventType =
  | "session:updated"
  | "participant:joined"
  | "item:claimed"
  | "item:unclaimed"
  | "items:updated"
  | "session:settled";

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