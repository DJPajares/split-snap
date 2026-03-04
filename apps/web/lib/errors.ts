import {
  DEFAULT_ERROR_MESSAGES,
  type ErrorCode,
  isCriticalError,
} from '@split-snap/shared/errors';

/**
 * Structured error thrown by the API client.
 * Carries the machine-readable error code, human-friendly message,
 * HTTP status, and optional validation details.
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /** Whether this error should trigger a blocking modal (vs. a toast). */
  get isCritical(): boolean {
    return isCriticalError(this.code);
  }
}

/**
 * Parse a fetch Response into an ApiError.
 * Handles both the new structured format `{ error: { code, message, details } }`
 * and the legacy format `{ error: "string" }`.
 */
export async function parseApiError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();

    // New structured format
    if (body?.error?.code) {
      return new ApiError(
        body.error.code as ErrorCode,
        body.error.message ||
          DEFAULT_ERROR_MESSAGES[body.error.code as ErrorCode] ||
          'Request failed',
        res.status,
        body.error.details,
      );
    }

    // Legacy format: { error: "message string" }
    if (typeof body?.error === 'string') {
      return new ApiError(
        'INTERNAL_ERROR' as ErrorCode,
        body.error,
        res.status,
      );
    }

    return new ApiError(
      'INTERNAL_ERROR' as ErrorCode,
      `HTTP ${res.status}`,
      res.status,
    );
  } catch {
    return new ApiError(
      'INTERNAL_ERROR' as ErrorCode,
      `HTTP ${res.status}`,
      res.status,
    );
  }
}
