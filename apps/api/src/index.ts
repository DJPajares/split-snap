import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createWorker } from 'tesseract.js';

import { connectDB } from './lib/db.js';

import { authRoutes } from './routes/auth.js';
import { sessionRoutes } from './routes/sessions.js';
import { receiptRoutes } from './routes/receipts.js';

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
  const ret = await worker.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png');
  const text = ret.data.text;
  console.log('Tesseract OCR result:', text);
  await worker.terminate();
  return c.text(text);

  // WORKING EXAMPLE FOR TESSERACT.JS IN NODE
  // let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  // try {
  //   worker = await createWorker('eng');
  //   const ret = await worker.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png');
  //   return c.text(ret.data.text);
  // } catch (err) {
  //   console.error('Tesseract error:', err);
  //   return c.json(
  //     {
  //       error: 'Tesseract failed',
  //       message: err instanceof Error ? err.message : String(err),
  //     },
  //     500
  //   );
  // } finally {
  //   if (worker) await worker.terminate();
  // }
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
