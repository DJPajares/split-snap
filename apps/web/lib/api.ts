import { API_ROUTES, STORAGE_KEYS } from '@split-snap/shared/constants';
import type {
  AuthResponse,
  ClaimAllItemsPayload,
  ClaimItemPayload,
  CreateSessionPayload,
  CreateSessionResponse,
  JoinSessionPayload,
  LoginPayload,
  MergeParticipantPayload,
  RegisterPayload,
  ScanResult,
  Session,
  UpdateItemsPayload,
  UpdateSessionSettingsPayload,
  UpgradeParticipantPayload,
  User,
} from '@split-snap/shared/types';

import { parseApiError } from './errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Helpers ───────────────────────────────────────────────

function getHeaders(sessionCode?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(STORAGE_KEYS.KEY_AUTH_TOKEN);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const participantToken = localStorage.getItem(
      STORAGE_KEYS.KEY_PARTICIPANT_TOKEN,
    );
    if (participantToken) headers['X-Participant-Token'] = participantToken;

    // Send guest host token if available for the session
    if (sessionCode) {
      const hostToken = localStorage.getItem(
        `${STORAGE_KEYS.KEY_HOST_TOKEN_PREFIX}${sessionCode}`,
      );
      if (hostToken) headers['X-Host-Token'] = hostToken;
    }
  }

  return headers;
}

async function request<T>(
  path: string,
  options?: RequestInit & { rawResponse?: boolean },
): Promise<T> {
  const { ...fetchOptions } = options ?? {};

  // Extract session code from path for host token resolution (e.g. /sessions/ABC123/...)
  const sessionCodeMatch = path.match(/\/sessions\/([A-Z0-9]+)/i);
  const sessionCode = sessionCodeMatch?.[1]?.toUpperCase();

  const res = await fetch(`${API_URL}${path}`, {
    headers: getHeaders(sessionCode),
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
          localStorage.getItem(STORAGE_KEYS.KEY_AUTH_TOKEN)
            ? {
                Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.KEY_AUTH_TOKEN)}`,
              }
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

    claimAllItems: (code: string, data: ClaimAllItemsPayload) =>
      request<Session>(API_ROUTES.SESSION_CLAIM_ALL(code), {
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

  // ─── Exchange Rates ──────────────────────────────────────────
  exchangeRates: {
    get: () =>
      request<{ [currency: string]: number }>(API_ROUTES.EXCHANGE_RATES),
  },
};
