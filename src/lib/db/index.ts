import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Lazily-created Drizzle client over Neon's HTTP driver.
 *
 * We don't throw at import time when DATABASE_URL is missing so the app can
 * still boot (and show a friendly "set up your database" message) before Neon
 * is configured. Anything that actually touches the DB calls `getDb()`.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }
  if (!_db) {
    const client = neon(process.env.DATABASE_URL);
    _db = drizzle(client, { schema });
  }
  return _db;
}

export { schema };
