/**
 * Ingest every JSON file under data/events/ into the database.
 *
 * Usage:
 *   npm run ingest:files
 *
 * Each file may contain a single event object or an array of events, in the
 * canonical format (see docs/EVENT_FORMAT.md). Files are idempotent: running
 * this repeatedly merges sources rather than creating duplicates, so it's safe
 * to run on every deploy (and that's exactly what the Vercel build does).
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { ingestEvents } from "../src/lib/events/ingest";

const EVENTS_DIR = join(process.cwd(), "data", "events");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set — skipping file ingestion. (Set it in .env.local.)",
    );
    // Exit 0 so this doesn't fail builds before the DB is configured.
    process.exit(0);
  }

  let entries: string[];
  try {
    entries = await readdir(EVENTS_DIR);
  } catch {
    console.log(`No ${EVENTS_DIR} directory — nothing to ingest.`);
    return;
  }

  const jsonFiles = entries.filter((f) => f.endsWith(".json"));
  if (jsonFiles.length === 0) {
    console.log("No JSON files in data/events — nothing to ingest.");
    return;
  }

  let created = 0;
  let merged = 0;
  let updated = 0;
  let failed = 0;

  for (const file of jsonFiles) {
    const path = join(EVENTS_DIR, file);
    try {
      const payload = JSON.parse(await readFile(path, "utf8"));
      const results = await ingestEvents(payload);
      for (const r of results) {
        if (r.action === "created") created++;
        else if (r.action === "merged") merged++;
        else updated++;
      }
      console.log(`✓ ${file}: ${results.length} event(s)`);
    } catch (err) {
      failed++;
      console.error(`✗ ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(
    `\nDone. created=${created} merged=${merged} updated=${updated} failed=${failed}`,
  );
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
