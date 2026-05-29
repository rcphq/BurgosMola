/**
 * Validate event JSON files against the canonical Zod schema without touching
 * the database. Use this to lint hand-written or AI-generated events before
 * committing or POSTing them.
 *
 *   npm run validate data/events/my-event.json
 *   npm run validate data/events/*.json
 *   npm run validate            # validates everything in data/events/
 *
 * Exits non-zero if any file is invalid, printing the exact problems.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { eventBatchSchema } from "../src/lib/events/schema";

function filesToCheck(): string[] {
  const args = process.argv.slice(2);
  if (args.length > 0) return args;
  const dir = join(process.cwd(), "data", "events");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => join(dir, f));
}

let ok = 0;
let bad = 0;

for (const file of filesToCheck()) {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    const result = eventBatchSchema.safeParse(parsed);
    if (result.success) {
      const count = Array.isArray(result.data) ? result.data.length : 1;
      console.log(`✓ ${file} (${count} event(s))`);
      ok++;
    } else {
      bad++;
      console.error(`✗ ${file}`);
      for (const issue of result.error.issues) {
        const path = issue.path.join(".") || "(root)";
        console.error(`    - ${path}: ${issue.message}`);
      }
    }
  } catch (err) {
    bad++;
    console.error(`✗ ${file}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`\n${ok} valid, ${bad} invalid`);
if (bad > 0) process.exit(1);
