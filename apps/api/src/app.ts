import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { sessionRoutes } from './routes/sessions.js';
import { receiptRoutes } from './routes/receipts.js';
import { authRoutes } from './routes/auth.js';
import { connectDB } from './lib/db.js';

export const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors());

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('*', async (c, next) => {
  if (c.req.path === '/api/health') {
    return next();
  }

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

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
