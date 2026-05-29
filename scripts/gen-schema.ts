/**
 * Generate a JSON Schema from the canonical Zod event schema and write it to
 * schemas/event.schema.json. That file is the machine-readable contract an
 * editor, linter, or another AI session can validate event JSON against.
 *
 * Run after changing src/lib/events/schema.ts:  npm run schema:gen
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { zodToJsonSchema } from "zod-to-json-schema";

import { eventInputSchema } from "../src/lib/events/schema";

const OUT = join(process.cwd(), "schemas", "event.schema.json");

const jsonSchema = zodToJsonSchema(eventInputSchema, {
  name: "BurgosEvent",
  $refStrategy: "none",
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(jsonSchema, null, 2) + "\n");
console.log(`✓ Wrote ${OUT}`);
