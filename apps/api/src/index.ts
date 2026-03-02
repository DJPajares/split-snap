import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createWorker } from 'tesseract.js';

import { connectDB } from './lib/db.js';

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
app.use('*', async (c, next) => {
  try {
    await dbReady;
    await next();
  } catch (err) {
    console.error('Mongo startup connection failed:', err);
    return c.json({ error: 'Database unavailable' }, 503);
  }
});

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
];

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'));
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/tesseract-test', async (c) => {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(
    'https://tesseract.projectnaptha.com/img/eng_bw.png'
  );

  const text = ret.data.text;
  await worker.terminate();

  return c.text(text);
});

app.post('/tesseract-upload-test', async (c) => {
  try {
    const contentType = c.req.header('Content-Type') || '';

    let imageBase64: string;
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('receipt') as File | null;
      if (!file) {
        return c.json({ error: 'No receipt image provided' }, 400);
      }

      mimeType = file.type || 'image/jpeg';
      const buffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString('base64');
    } else {
      // Expect JSON with base64 image
      const body = await c.req.json();
      if (!body.image) {
        return c.json({ error: 'No image data provided' }, 400);
      }
      imageBase64 = body.image;
      mimeType = body.mimeType || 'image/jpeg';
    }

    const result = await scanReceiptTest(imageBase64);

    return c.text(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to scan receipt';
    console.error('Receipt scan error:', err);
    return c.json({ error: message }, 500);
  }
});

app.route('/auth', authRoutes);
app.route('/receipts', receiptRoutes);
app.route('/sessions', sessionRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
