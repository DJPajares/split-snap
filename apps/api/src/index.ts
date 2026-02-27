import { config } from "./lib/config.js";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { connectDB } from "./lib/db.js";

async function main() {
  await connectDB();

  serve({ fetch: app.fetch, port: config.PORT }, (info) => {
    console.log(`🚀 Split-Snap API running on http://localhost:${info.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
