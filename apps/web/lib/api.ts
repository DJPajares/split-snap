import type {
  Session,
  CreateSessionPayload,
  UpdateItemsPayload,
  JoinSessionPayload,
  ClaimItemPayload,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  ScanResult,
  User
} from '@split-snap/shared';
import { API_ROUTES } from '@split-snap/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Helpers ───────────────────────────────────────────────

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const participantToken = localStorage.getItem('participant_token');
    if (participantToken) headers['X-Participant-Token'] = participantToken;
  }

  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: getHeaders(),
    ...options
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────

export const api = {
  auth: {
    register: (data: RegisterPayload) =>
      request<AuthResponse>(API_ROUTES.AUTH_REGISTER, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    login: (data: LoginPayload) =>
      request<AuthResponse>(API_ROUTES.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    me: () => request<User>(API_ROUTES.AUTH_ME)
  },

  // ─── Receipts ──────────────────────────────────────────

  receipts: {
    scan: async (file: File): Promise<ScanResult> => {
      const formData = new FormData();
      formData.append('receipt', file);

      const res = await fetch(`${API_URL}${API_ROUTES.RECEIPTS_SCAN}`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData — browser sets it with boundary
          ...(typeof window !== 'undefined' &&
          localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {})
        }
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Scan failed' }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }

      return res.json();
    }
  },

  // ─── Sessions ──────────────────────────────────────────

  sessions: {
    list: () => request<Session[]>(API_ROUTES.SESSIONS),

    create: (data: CreateSessionPayload) =>
      request<Session>(API_ROUTES.SESSIONS, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    get: (code: string) => request<Session>(API_ROUTES.SESSION(code)),

    join: (code: string, data: JoinSessionPayload) =>
      request<{ session: Session; participantId: string }>(
        API_ROUTES.SESSION_JOIN(code),
        { method: 'POST', body: JSON.stringify(data) }
      ),

    claimItem: (code: string, itemId: string, data: ClaimItemPayload) =>
      request<Session>(API_ROUTES.SESSION_CLAIM(code, itemId), {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),

    settle: (code: string) =>
      request<Session>(API_ROUTES.SESSION_SETTLE(code), { method: 'PATCH' }),

    updateItems: (code: string, data: UpdateItemsPayload) =>
      request<Session>(API_ROUTES.SESSION_UPDATE_ITEMS(code), {
        method: 'PUT',
        body: JSON.stringify(data)
      }),

    kick: (code: string, participantId: string) =>
      request<Session>(API_ROUTES.SESSION_KICK(code, participantId), {
        method: 'DELETE'
      }),

    eventsUrl: (code: string) => `${API_URL}${API_ROUTES.SESSION_EVENTS(code)}`
  }
};
