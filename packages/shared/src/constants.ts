export const SESSION_STATUSES = {
  DRAFT: 'draft' as const,
  ACTIVE: 'active' as const,
  SETTLED: 'settled' as const
};

export const API_ROUTES = {
  RECEIPTS_SCAN: '/api/receipts/scan',
  SESSIONS: '/api/sessions',
  SESSION: (code: string) => `/api/sessions/${code}`,
  SESSION_JOIN: (code: string) => `/api/sessions/${code}/join`,
  SESSION_CLAIM: (code: string, itemId: string) =>
    `/api/sessions/${code}/items/${itemId}/claim`,
  SESSION_SETTLE: (code: string) => `/api/sessions/${code}/settle`,
  SESSION_EVENTS: (code: string) => `/api/sessions/${code}/events`,
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_ME: '/api/auth/me'
} as const;
