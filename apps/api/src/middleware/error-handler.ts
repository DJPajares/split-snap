import type { ErrorHandler } from 'hono';
import { ErrorCode } from '@split-snap/shared/errors';
import { AppError } from '../lib/errors.js';

export const errorHandler: ErrorHandler = (err, c) => {
  // Already an AppError — return structured response
  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.statusCode as 400);
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError' && 'errors' in err) {
    const appErr = new AppError(
      ErrorCode.VALIDATION_FAILED,
      400,
      'Validation failed',
      err.message,
    );
    return c.json(appErr.toJSON(), 400);
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    const appErr = new AppError(
      ErrorCode.VALIDATION_FAILED,
      400,
      'Invalid identifier format',
    );
    return c.json(appErr.toJSON(), 400);
  }

  // Unknown / unhandled error — log it, return generic 500
  console.error('Unhandled error:', err);

  const appErr = new AppError(ErrorCode.INTERNAL_ERROR, 500);
  return c.json(appErr.toJSON(), 500);
};
