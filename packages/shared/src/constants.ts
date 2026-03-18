const APP = {
  NAME: 'SplitSnap™',
};

const SESSION_CODE_LENGTH = 6;
const SESSION_EXPIRY_DAYS = 7;
const DEFAULT_CURRENCY = 'SGD';
const KICK_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const SESSION_STATUSES = {
  DRAFT: 'draft' as const,
  ACTIVE: 'active' as const,
  SETTLED: 'settled' as const,
};

const API_ROUTES = {
  RECEIPTS_SCAN: '/receipts/scan',
  SESSIONS: '/sessions',
  SESSION: (code: string) => `/sessions/${code}`,
  SESSION_DELETE: (code: string) => `/sessions/${code}`,
  SESSION_JOIN: (code: string) => `/sessions/${code}/join`,
  SESSION_CLAIM: (code: string, itemId: string) =>
    `/sessions/${code}/items/${itemId}/claim`,
  SESSION_CLAIM_ALL: (code: string) => `/sessions/${code}/items/claim`,
  SESSION_SETTLE: (code: string) => `/sessions/${code}/settle`,
  SESSION_UNSETTLE: (code: string) => `/sessions/${code}/unsettle`,
  SESSION_KICK: (code: string, participantId: string) =>
    `/sessions/${code}/participants/${participantId}`,
  SESSION_UPGRADE_PARTICIPANT: (code: string, participantId: string) =>
    `/sessions/${code}/participants/${participantId}/upgrade`,
  SESSION_MERGE_PARTICIPANTS: (code: string) =>
    `/sessions/${code}/participants/merge`,
  SESSION_APPROVE_PARTICIPANT: (code: string, participantId: string) =>
    `/sessions/${code}/participants/${participantId}/approve`,
  SESSION_REJECT_PARTICIPANT: (code: string, participantId: string) =>
    `/sessions/${code}/participants/${participantId}/reject`,
  SESSION_SETTINGS: (code: string) => `/sessions/${code}/settings`,
  SESSION_UPDATE_ITEMS: (code: string) => `/sessions/${code}/items`,
  SESSION_EVENTS: (code: string) => `/sessions/${code}/events`,
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  EXCHANGE_RATES: '/exchange-rates',
} as const;

const STORAGE_KEYS = {
  KEY_AUTH_TOKEN: 'auth_token',
  KEY_PARTICIPANT_TOKEN: 'participant_token',
  KEY_EXCHANGE_RATES: 'exchange_rates',
  KEY_RECEIPT_IMAGE: 'receipt_image',
  KEY_PENDING_SESSION_CODE: 'pending_session_code',
  KEY_PENDING_PARTICIPANT_ID: 'pending_participant_id',
  KEY_GUEST_PARTICIPANT_PREFIX: 'guest_participant_',
  KEY_PARTICIPANT_PREFIX: 'participant_',
  KEY_HOST_TOKEN_PREFIX: 'host_token_',
};

export {
  APP,
  SESSION_CODE_LENGTH,
  SESSION_EXPIRY_DAYS,
  DEFAULT_CURRENCY,
  KICK_COOLDOWN_MS,
  SESSION_STATUSES,
  API_ROUTES,
  STORAGE_KEYS,
};
