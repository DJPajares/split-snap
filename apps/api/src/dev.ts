import { serve } from '@hono/node-server';

import app from './index.js';
import { config } from './lib/config.js';

// Local dev server — in production (Vercel), vercel.ts is used instead
serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`🚀 Split-Snap API running on http://localhost:${info.port}`);
});
