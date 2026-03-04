import type {
  Session,
  CreateSessionPayload,
  CreateSessionResponse,
  UpdateItemsPayload,
  JoinSessionPayload,
  ClaimItemPayload,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  ScanResult,
  User,
  UpgradeParticipantPayload,
  MergeParticipantPayload,
  UpdateSessionSettingsPayload,
} from '@split-snap/shared';
import { API_ROUTES } from '@split-snap/shared';
import { parseApiError } from './errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Helpers ───────────────────────────────────────────────

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const participantToken = localStorage.getItem('participant_token');
    if (participantToken) headers['X-Participant-Token'] = participantToken;
  }

  return headers;
}

async function request<T>(
  path: string,
  options?: RequestInit & { rawResponse?: boolean },
): Promise<T> {
  const { ...fetchOptions } = options ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    headers: getHeaders(),
    ...fetchOptions,
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────

export const api = {
  health: {
    check: () =>
      request<{ ok: boolean; service: string; timestamp: string }>('/health'),
  },

  auth: {
    register: (data: RegisterPayload) =>
      request<AuthResponse>(API_ROUTES.AUTH_REGISTER, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: LoginPayload) =>
      request<AuthResponse>(API_ROUTES.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>(API_ROUTES.AUTH_ME),
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
            : {}),
        },
      });

      if (!res.ok) {
        throw await parseApiError(res);
      }

      return res.json();
    },
  },

  // ─── Sessions ──────────────────────────────────────────

  sessions: {
    list: (role?: 'host' | 'participant') => {
      const params = role ? `?role=${role}` : '';
      return request<Session[]>(`${API_ROUTES.SESSIONS}${params}`);
    },

    create: (data: CreateSessionPayload) =>
      request<CreateSessionResponse>(API_ROUTES.SESSIONS, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    get: (code: string) => request<Session>(API_ROUTES.SESSION(code)),

    join: (code: string, data: JoinSessionPayload) =>
      request<{
        session: Session;
        participantId?: string;
        status?: 'pending';
        pendingParticipantId?: string;
      }>(API_ROUTES.SESSION_JOIN(code), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    claimItem: (code: string, itemId: string, data: ClaimItemPayload) =>
      request<Session>(API_ROUTES.SESSION_CLAIM(code, itemId), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    settle: (code: string) =>
      request<Session>(API_ROUTES.SESSION_SETTLE(code), { method: 'PATCH' }),

    unsettle: (code: string) =>
      request<Session>(API_ROUTES.SESSION_UNSETTLE(code), { method: 'PATCH' }),

    updateItems: (code: string, data: UpdateItemsPayload) =>
      request<Session>(API_ROUTES.SESSION_UPDATE_ITEMS(code), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    kick: (code: string, participantId: string) =>
      request<Session>(API_ROUTES.SESSION_KICK(code, participantId), {
        method: 'DELETE',
      }),

    upgradeParticipant: (
      code: string,
      participantId: string,
      data: UpgradeParticipantPayload,
    ) =>
      request<Session>(
        API_ROUTES.SESSION_UPGRADE_PARTICIPANT(code, participantId),
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),

    mergeParticipants: (code: string, data: MergeParticipantPayload) =>
      request<{ session: Session; participantId: string }>(
        API_ROUTES.SESSION_MERGE_PARTICIPANTS(code),
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),

    approveParticipant: (code: string, participantId: string) =>
      request<{ session: Session; participantId: string }>(
        API_ROUTES.SESSION_APPROVE_PARTICIPANT(code, participantId),
        {
          method: 'POST',
        },
      ),

    rejectParticipant: (code: string, participantId: string) =>
      request<Session>(
        API_ROUTES.SESSION_REJECT_PARTICIPANT(code, participantId),
        {
          method: 'POST',
        },
      ),

    updateSettings: (code: string, data: UpdateSessionSettingsPayload) =>
      request<Session>(API_ROUTES.SESSION_SETTINGS(code), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (code: string) =>
      request<{ success: boolean }>(API_ROUTES.SESSION_DELETE(code), {
        method: 'DELETE',
      }),

    eventsUrl: (code: string) => `${API_URL}${API_ROUTES.SESSION_EVENTS(code)}`,
  },
};
