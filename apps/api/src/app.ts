import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { sessionRoutes } from './routes/sessions.js';
import { receiptRoutes } from './routes/receipts.js';
import { authRoutes } from './routes/auth.js';
import { connectDB } from './lib/db.js';
import mongoose from 'mongoose';
import { config } from './lib/config.js';

export const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors());

app.get('/db-check', async (c) => {
  const started = Date.now();

  try {
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });

    const adminDb = mongoose.connection.db?.admin();
    const ping = await adminDb?.ping();

    return c.json({
      ok: true,
      connected: mongoose.connection.readyState === 1,
      dbName: mongoose.connection.name,
      ping,
      elapsedMs: Date.now() - started
    });
  } catch (err) {
    return c.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'UnknownError',
        elapsedMs: Date.now() - started
      },
      500
    );
  }
});

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
