// ─── Error Codes ───────────────────────────────────────────

export const ErrorCode = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_MISSING_TOKEN: 'AUTH_MISSING_TOKEN',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',

  // Session
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_SETTLED: 'SESSION_SETTLED',
  SESSION_NOT_SETTLED: 'SESSION_NOT_SETTLED',
  SESSION_DELETE_FORBIDDEN: 'SESSION_DELETE_FORBIDDEN',
  SESSION_SETTLE_FORBIDDEN: 'SESSION_SETTLE_FORBIDDEN',
  SESSION_UNSETTLE_FORBIDDEN: 'SESSION_UNSETTLE_FORBIDDEN',
  SESSION_EDIT_FORBIDDEN: 'SESSION_EDIT_FORBIDDEN',
  SESSION_KICK_FORBIDDEN: 'SESSION_KICK_FORBIDDEN',
  SESSION_KICK_ACTIVE_ONLY: 'SESSION_KICK_ACTIVE_ONLY',
  SESSION_ITEMS_NOT_ALL_CLAIMED: 'SESSION_ITEMS_NOT_ALL_CLAIMED',
  SESSION_CODE_GENERATION_FAILED: 'SESSION_CODE_GENERATION_FAILED',
  SESSION_JOIN_PENDING: 'SESSION_JOIN_PENDING',
  SESSION_JOIN_REJECTED: 'SESSION_JOIN_REJECTED',
  SESSION_JOIN_KICKED: 'SESSION_JOIN_KICKED',
  SESSION_SETTINGS_FORBIDDEN: 'SESSION_SETTINGS_FORBIDDEN',
  SESSION_APPROVE_FORBIDDEN: 'SESSION_APPROVE_FORBIDDEN',

  // Items & Participants
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  PARTICIPANT_NOT_FOUND: 'PARTICIPANT_NOT_FOUND',
  PENDING_PARTICIPANT_NOT_FOUND: 'PENDING_PARTICIPANT_NOT_FOUND',

  // Receipts
  RECEIPT_NO_IMAGE: 'RECEIPT_NO_IMAGE',
  RECEIPT_SCAN_FAILED: 'RECEIPT_SCAN_FAILED',

  // Generic
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Critical Error Codes (trigger modal on frontend) ──────

export const CRITICAL_ERROR_CODES: ReadonlySet<ErrorCode> = new Set([
  ErrorCode.AUTH_INVALID_CREDENTIALS,
  ErrorCode.AUTH_EMAIL_TAKEN,
  ErrorCode.AUTH_MISSING_TOKEN,
  ErrorCode.AUTH_INVALID_TOKEN,
  ErrorCode.AUTH_USER_NOT_FOUND,
  ErrorCode.SESSION_NOT_FOUND,
  ErrorCode.SESSION_SETTLED,
  ErrorCode.SESSION_NOT_SETTLED,
  ErrorCode.SESSION_DELETE_FORBIDDEN,
  ErrorCode.SESSION_SETTLE_FORBIDDEN,
  ErrorCode.SESSION_UNSETTLE_FORBIDDEN,
  ErrorCode.SESSION_EDIT_FORBIDDEN,
  ErrorCode.SESSION_KICK_FORBIDDEN,
  ErrorCode.SESSION_KICK_ACTIVE_ONLY,
  ErrorCode.SESSION_ITEMS_NOT_ALL_CLAIMED,
  ErrorCode.SESSION_JOIN_KICKED,
  ErrorCode.SESSION_JOIN_REJECTED,
  ErrorCode.SESSION_SETTINGS_FORBIDDEN,
  ErrorCode.SESSION_APPROVE_FORBIDDEN,
  ErrorCode.DATABASE_UNAVAILABLE
]);

export function isCriticalError(code: string): boolean {
  return CRITICAL_ERROR_CODES.has(code as ErrorCode);
}

// ─── Default User-Friendly Messages ────────────────────────

export const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.AUTH_EMAIL_TAKEN]: 'This email is already registered.',
  [ErrorCode.AUTH_MISSING_TOKEN]: 'You need to log in to continue.',
  [ErrorCode.AUTH_INVALID_TOKEN]:
    'Your session has expired. Please log in again.',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'Account not found.',

  // Session
  [ErrorCode.SESSION_NOT_FOUND]:
    'This session was not found. It may have been deleted.',
  [ErrorCode.SESSION_SETTLED]: 'This session has already been settled.',
  [ErrorCode.SESSION_NOT_SETTLED]: 'This session is not settled.',
  [ErrorCode.SESSION_DELETE_FORBIDDEN]:
    'Only the session creator can delete this session.',
  [ErrorCode.SESSION_SETTLE_FORBIDDEN]:
    'Only the session creator can settle this session.',
  [ErrorCode.SESSION_UNSETTLE_FORBIDDEN]:
    'Only the session creator can undo settlement.',
  [ErrorCode.SESSION_EDIT_FORBIDDEN]:
    'Only the session creator can edit items.',
  [ErrorCode.SESSION_KICK_FORBIDDEN]:
    'Only the session creator can remove participants.',
  [ErrorCode.SESSION_KICK_ACTIVE_ONLY]:
    'Participants can only be removed from active sessions.',
  [ErrorCode.SESSION_ITEMS_NOT_ALL_CLAIMED]:
    'All items must be claimed before settling.',
  [ErrorCode.SESSION_CODE_GENERATION_FAILED]:
    'Failed to generate a session code. Please try again.',
  [ErrorCode.SESSION_JOIN_PENDING]:
    'Your join request is pending host approval.',
  [ErrorCode.SESSION_JOIN_REJECTED]:
    'Your join request was rejected by the host.',
  [ErrorCode.SESSION_JOIN_KICKED]:
    'You have been removed from this session. You can rejoin after a short cooldown.',
  [ErrorCode.SESSION_SETTINGS_FORBIDDEN]:
    'Only the session creator can change settings.',
  [ErrorCode.SESSION_APPROVE_FORBIDDEN]:
    'Only the session creator can approve or reject participants.',

  // Items & Participants
  [ErrorCode.ITEM_NOT_FOUND]: 'Item not found.',
  [ErrorCode.PARTICIPANT_NOT_FOUND]: 'Participant not found.',
  [ErrorCode.PENDING_PARTICIPANT_NOT_FOUND]: 'Pending participant not found.',

  // Receipts
  [ErrorCode.RECEIPT_NO_IMAGE]: 'No receipt image was provided.',
  [ErrorCode.RECEIPT_SCAN_FAILED]:
    'Failed to scan the receipt. Please try again or enter items manually.',

  // Generic
  [ErrorCode.VALIDATION_FAILED]: 'Please check your input and try again.',
  [ErrorCode.DATABASE_UNAVAILABLE]:
    'The service is temporarily unavailable. Please try again later.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.INTERNAL_ERROR]: 'Something went wrong. Please try again later.'
};

// ─── API Error Response Shape ──────────────────────────────

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}
