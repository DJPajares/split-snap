import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { authRoutes } from './routes/auth.js';
import { connectDB } from './lib/db.js';

import { sessionRoutes } from './routes/sessions.js';
import { receiptRoutes } from './routes/receipts.js';

const app = new Hono();

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
];

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'));
});

app.use('*', logger());
app.use('*', cors());

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('*', async (c, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Mongo connect failed:', err);
    return c.json({ error: 'Database unavailable' }, 503);
  }

  await next();
});

app.route('/auth', authRoutes);
app.route('/receipts', receiptRoutes);
app.route('/sessions', sessionRoutes);

// app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
