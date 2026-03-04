import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createWorker } from 'tesseract.js';
import { ErrorCode } from '@split-snap/shared/errors';

import { connectDB } from './lib/db.js';
import { AppError, badRequest, internal } from './lib/errors.js';
import { errorHandler } from './middleware/error-handler.js';

import { authRoutes } from './routes/auth.js';
import { sessionRoutes } from './routes/sessions.js';
import { receiptRoutes } from './routes/receipts.js';

import { scanReceiptTest } from './services/receipt-scanner.js';

const app = new Hono();

// one-time startup connection (fail-fast on cold start)
const dbReady = (async () => {
  await connectDB();
})();

app.use('*', logger());
app.use('*', cors());

// gate all requests behind startup DB check
app.use('*', async (_c, next) => {
  try {
    await dbReady;
  } catch (err) {
    console.error('Mongo startup connection failed:', err);
    throw new AppError(ErrorCode.DATABASE_UNAVAILABLE, 503);
  }
  await next();
});

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono',
];

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'));
});

app.get('/health', (c) => {
  return c.json(
    {
      ok: true,
      service: 'split-snap-api',
      timestamp: new Date().toISOString(),
    },
    200,
  );
});

app.get('/tesseract-test', async (c) => {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(
    'https://tesseract.projectnaptha.com/img/eng_bw.png',
  );

  const text = ret.data.text;
  await worker.terminate();

  return c.text(text);
});

app.post('/tesseract-upload-test', async (c) => {
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
    const result = await scanReceiptTest(imageBase64);
    return c.text(result);
  } catch (err: unknown) {
    console.error('Receipt scan error:', err);
    throw internal(
      ErrorCode.RECEIPT_SCAN_FAILED,
      err instanceof Error ? err.message : undefined,
    );
  }
});

app.route('/auth', authRoutes);
app.route('/receipts', receiptRoutes);
app.route('/sessions', sessionRoutes);

app.notFound((c) => {
  const err = new AppError(ErrorCode.NOT_FOUND, 404);
  return c.json(err.toJSON(), 404);
});

app.onError(errorHandler);

export default app;
