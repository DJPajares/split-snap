export const SESSION_CODE_LENGTH = 6;
export const SESSION_EXPIRY_DAYS = 7;
export const DEFAULT_CURRENCY = 'SGD';

export const SESSION_STATUSES = {
  DRAFT: 'draft' as const,
  ACTIVE: 'active' as const,
  SETTLED: 'settled' as const
};

export const API_ROUTES = {
  RECEIPTS_SCAN: '/receipts/scan',
  SESSIONS: '/sessions',
  SESSION: (code: string) => `/sessions/${code}`,
  SESSION_DELETE: (code: string) => `/sessions/${code}`,
  SESSION_JOIN: (code: string) => `/sessions/${code}/join`,
  SESSION_CLAIM: (code: string, itemId: string) =>
    `/sessions/${code}/items/${itemId}/claim`,
  SESSION_SETTLE: (code: string) => `/sessions/${code}/settle`,
  SESSION_UNSETTLE: (code: string) => `/sessions/${code}/unsettle`,
  SESSION_KICK: (code: string, participantId: string) =>
    `/sessions/${code}/participants/${participantId}`,
  SESSION_UPDATE_ITEMS: (code: string) => `/sessions/${code}/items`,
  SESSION_EVENTS: (code: string) => `/sessions/${code}/events`,
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me'
} as const;
