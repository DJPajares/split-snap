import { Hono } from 'hono';

import { ErrorCode } from '@split-snap/shared/errors';

import { badRequest, internal } from '../lib/errors.js';
import { getActiveProvider, scanReceipt } from '../services/receipt-scanner.js';

export const receiptRoutes = new Hono();

// ─── Get active scanner provider ──────────────────────────

receiptRoutes.get('/provider', (c) => {
  return c.json({ provider: getActiveProvider() });
});

// ─── Scan receipt image ────────────────────────────────────

receiptRoutes.post('/scan', async (c) => {
  const contentType = c.req.header('Content-Type') || '';

  let imageBase64: string;
  let mimeType = 'image/jpeg';

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('receipt') as File | null;
    if (!file) {
      throw badRequest(ErrorCode.RECEIPT_NO_IMAGE, 'No receipt image provided');
    }

    mimeType = file.type || 'image/jpeg';
    const buffer = await file.arrayBuffer();
    imageBase64 = Buffer.from(buffer).toString('base64');
  } else {
    // Expect JSON with base64 image
    const body = await c.req.json();
    if (!body.image) {
      throw badRequest(ErrorCode.RECEIPT_NO_IMAGE, 'No image data provided');
    }
    imageBase64 = body.image;
    mimeType = body.mimeType || 'image/jpeg';
  }

  try {
    const result = await scanReceipt(imageBase64, mimeType);
    return c.json(result);
  } catch (err: unknown) {
    console.error('Receipt scan error:', err);
    throw internal(
      ErrorCode.RECEIPT_SCAN_FAILED,
      err instanceof Error ? err.message : undefined,
    );
  }
});
