/**
 * Apply pending Drizzle migrations (the SQL files in ./drizzle) to the database.
 *
 * Runs as part of the Vercel build (see the "vercel-build" npm script) so the
 * deployed database always has the current schema. Safe to run repeatedly —
 * Drizzle tracks which migrations have been applied. If no database URL is
 * configured it skips with exit 0 so local/early builds don't fail.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

import { getDatabaseUrl } from "../src/lib/db";

async function main() {
  const url = getDatabaseUrl();
  if (!url) {
    console.log("No database URL configured — skipping migrations.");
    process.exit(0);
  }

  const db = drizzle(neon(url));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migrations applied.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
