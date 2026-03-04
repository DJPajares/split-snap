import { describe, expect, it } from 'vitest';

import { ApiError, parseApiError } from './errors';

describe('parseApiError', () => {
  it('parses structured API error responses', async () => {
    const res = new Response(
      JSON.stringify({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session does not exist',
          details: { code: 'ABC123' },
        },
      }),
      { status: 404 },
    );

    const err = await parseApiError(res);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('SESSION_NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Session does not exist');
    expect(err.details).toEqual({ code: 'ABC123' });
  });

  it('falls back to INTERNAL_ERROR for legacy error shape', async () => {
    const res = new Response(JSON.stringify({ error: 'Legacy failure' }), {
      status: 400,
    });

    const err = await parseApiError(res);

    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Legacy failure');
  });

  it('falls back to HTTP status text when response body cannot be parsed', async () => {
    const res = new Response('not-json', { status: 503 });

    const err = await parseApiError(res);

    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.statusCode).toBe(503);
    expect(err.message).toBe('HTTP 503');
  });
});
