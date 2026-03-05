import {
  type ApiErrorResponse,
  DEFAULT_ERROR_MESSAGES,
  ErrorCode,
} from '@split-snap/shared/errors';

// ─── AppError ──────────────────────────────────────────────

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    statusCode: number,
    message?: string,
    details?: unknown,
  ) {
    super(message ?? DEFAULT_ERROR_MESSAGES[code] ?? 'Unknown error');
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }

  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

// ─── Factory helpers ───────────────────────────────────────

export function badRequest(
  code: ErrorCode,
  message?: string,
  details?: unknown,
): AppError {
  return new AppError(code, 400, message, details);
}

export function unauthorized(code: ErrorCode, message?: string): AppError {
  return new AppError(code, 401, message);
}

export function forbidden(
  code: ErrorCode,
  message?: string,
  details?: unknown,
): AppError {
  return new AppError(code, 403, message, details);
}

export function notFound(code: ErrorCode, message?: string): AppError {
  return new AppError(code, 404, message);
}

export function conflict(code: ErrorCode, message?: string): AppError {
  return new AppError(code, 409, message);
}

export function internal(code: ErrorCode, message?: string): AppError {
  return new AppError(code, 500, message);
}
