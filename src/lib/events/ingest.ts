import { and, eq, gte, lt } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { events, eventSources, type EventRow } from "@/lib/db/schema";
import {
  buildDedupeKey,
  diceSimilarity,
  FUZZY_MERGE_THRESHOLD,
  normalizeTitle,
} from "@/lib/events/dedupe";
import {
  eventBatchSchema,
  type ParsedEventInput,
} from "@/lib/events/schema";

export type IngestAction = "created" | "merged" | "updated";

export interface IngestResult {
  action: IngestAction;
  eventId: string;
  title: string;
  /** Set when the fuzzy matcher (not the exact key) decided this was a dupe. */
  matchedBy?: "dedupe_key" | "fuzzy";
  similarity?: number;
}

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Europe/Madrid";
const DEFAULT_CITY = process.env.DEFAULT_CITY || "Burgos";

/** Pick the first non-empty value (used to fill gaps when merging sources). */
function coalesce<T>(existing: T | null | undefined, incoming: T | null | undefined): T | null {
  const isEmpty = (v: unknown) => v === null || v === undefined || v === "";
  if (!isEmpty(existing)) return existing as T;
  if (!isEmpty(incoming)) return incoming as T;
  return (existing ?? null) as T | null;
}

/** Find an existing event that is fuzzily the same (same day, similar title). */
async function findFuzzyMatch(
  db: ReturnType<typeof getDb>,
  input: ParsedEventInput,
): Promise<{ row: EventRow; similarity: number } | null> {
  const start = new Date(input.startsAt);
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const sameDay = await db
    .select()
    .from(events)
    .where(and(gte(events.startsAt, dayStart), lt(events.startsAt, dayEnd)));

  let best: { row: EventRow; similarity: number } | null = null;
  for (const row of sameDay) {
    const sim = diceSimilarity(row.title, input.title);
    if (sim >= FUZZY_MERGE_THRESHOLD && (!best || sim > best.similarity)) {
      best = { row, similarity: sim };
    }
  }
  return best;
}

async function upsertSource(
  db: ReturnType<typeof getDb>,
  eventId: string,
  input: ParsedEventInput,
) {
  const source = input.source ?? { name: "manual" };
  await db
    .insert(eventSources)
    .values({
      eventId,
      source: source.name,
      sourceUrl: source.url ?? input.url ?? null,
      sourceUid: source.uid ?? null,
      raw: input.raw ?? null,
      scrapedAt: source.scrapedAt ? new Date(source.scrapedAt) : new Date(),
    })
    // If this exact origin item was already recorded, leave it be.
    .onConflictDoNothing({
      target: [eventSources.source, eventSources.sourceUid],
    });
}

/** Ingest one validated event: dedupe, then create / merge / update. */
async function ingestOne(
  db: ReturnType<typeof getDb>,
  input: ParsedEventInput,
): Promise<IngestResult> {
  const dedupeKey = buildDedupeKey({
    title: input.title,
    startsAt: input.startsAt,
    venueName: input.venueName,
  });

  // 1. Exact-match fast path.
  const [exact] = await db
    .select()
    .from(events)
    .where(eq(events.dedupeKey, dedupeKey))
    .limit(1);

  // 2. Fuzzy fallback (same day, similar title).
  const match = exact
    ? { row: exact, similarity: 1, matchedBy: "dedupe_key" as const }
    : await findFuzzyMatch(db, input).then((m) =>
        m ? { ...m, matchedBy: "fuzzy" as const } : null,
      );

  if (match) {
    // Merge: fill gaps from the incoming payload, never destroy good data.
    const row = match.row;
    await db
      .update(events)
      .set({
        description: coalesce(row.description, input.description),
        endsAt: row.endsAt ?? (input.endsAt ? new Date(input.endsAt) : null),
        venueName: coalesce(row.venueName, input.venueName),
        address: coalesce(row.address, input.address),
        lat: row.lat ?? input.lat ?? null,
        lng: row.lng ?? input.lng ?? null,
        category: coalesce(row.category, input.category),
        tags: row.tags?.length ? row.tags : (input.tags ?? []),
        url: coalesce(row.url, input.url),
        imageUrl: coalesce(row.imageUrl, input.imageUrl),
        price: coalesce(row.price, input.price),
        status: input.status ?? row.status,
        updatedAt: new Date(),
      })
      .where(eq(events.id, row.id));

    await upsertSource(db, row.id, input);

    return {
      action: exact ? "updated" : "merged",
      eventId: row.id,
      title: row.title,
      matchedBy: match.matchedBy,
      similarity: match.similarity,
    };
  }

  // 3. No match — create a new canonical event.
  const [created] = await db
    .insert(events)
    .values({
      dedupeKey,
      title: input.title,
      normalizedTitle: normalizeTitle(input.title),
      description: input.description ?? null,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      timezone: input.timezone ?? DEFAULT_TIMEZONE,
      allDay: input.allDay === undefined ? null : String(input.allDay),
      venueName: input.venueName ?? null,
      address: input.address ?? null,
      city: input.city ?? DEFAULT_CITY,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      category: input.category ?? null,
      tags: input.tags ?? [],
      url: input.url ?? null,
      imageUrl: input.imageUrl ?? null,
      price: input.price ?? null,
      status: input.status ?? "confirmed",
    })
    .returning();

  await upsertSource(db, created.id, input);

  return { action: "created", eventId: created.id, title: created.title };
}

/**
 * Public entry point. Accepts a single event or an array, validates with Zod,
 * and ingests each one. Throws a ZodError on invalid input.
 */
export async function ingestEvents(payload: unknown): Promise<IngestResult[]> {
  const parsed = eventBatchSchema.parse(payload);
  const inputs = Array.isArray(parsed) ? parsed : [parsed];
  const db = getDb();

  const results: IngestResult[] = [];
  for (const input of inputs) {
    results.push(await ingestOne(db, input));
  }
  return results;
}
