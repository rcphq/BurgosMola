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

/**
 * Resolve the Postgres connection string. We prefer DATABASE_URL but also accept
 * the variable names the Vercel ↔ Neon integration injects, so the app works
 * whether you set DATABASE_URL yourself or rely on the connector's vars.
 * (Pooled URLs are preferred for the serverless HTTP driver.)
 */
export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or use the Vercel Neon integration, which injects POSTGRES_URL).",
    );
  }
  if (!_db) {
    const client = neon(url);
    _db = drizzle(client, { schema });
  }
  return _db;
}

export { schema };
