import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Status of an event. `tentative` is useful for events we scraped but aren't
 * sure about (e.g. an Instagram post with a fuzzy date).
 */
export const eventStatus = pgEnum("event_status", [
  "confirmed",
  "tentative",
  "cancelled",
]);

/**
 * Canonical, de-duplicated events. One row == one real-world event, no matter
 * how many sources reported it. Source-specific provenance lives in
 * `eventSources` and is merged into these fields by the ingestion pipeline.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * Deterministic fingerprint (normalized title + date + venue). Used as the
     * fast path for dedupe: two payloads with the same key are the same event.
     * Fuzzy matching handles the near-misses; see src/lib/events/dedupe.ts.
     */
    dedupeKey: text("dedupe_key").notNull(),

    title: text("title").notNull(),
    /** Lowercased, accent/punctuation-stripped title kept for fuzzy matching. */
    normalizedTitle: text("normalized_title").notNull(),
    description: text("description"),

    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    timezone: text("timezone").notNull().default("Europe/Madrid"),
    allDay: text("all_day"), // "true"/"false" as text keeps it simple & nullable

    venueName: text("venue_name"),
    address: text("address"),
    city: text("city").notNull().default("Burgos"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),

    category: text("category"),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),

    /** Best canonical URL for the event (a source may override per-source). */
    url: text("url"),
    imageUrl: text("image_url"),
    price: text("price"),

    status: eventStatus("status").notNull().default("confirmed"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    dedupeKeyIdx: uniqueIndex("events_dedupe_key_idx").on(t.dedupeKey),
    startsAtIdx: index("events_starts_at_idx").on(t.startsAt),
    normalizedTitleIdx: index("events_normalized_title_idx").on(
      t.normalizedTitle,
    ),
  }),
);

/**
 * Per-source provenance. Each time a scraper/manual entry reports an event, we
 * record where it came from and the raw payload, then link it to the canonical
 * `events` row. This is what lets us "merge sources for event uniqueness".
 */
export const eventSources = pgTable(
  "event_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    /** e.g. "manual", "ai", "instagram", "website:teatroprincipal". */
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    /** Stable id from the origin (post id, slug, etc.), if available. */
    sourceUid: text("source_uid"),
    /** Original payload, untouched, for debugging and re-processing. */
    raw: jsonb("raw"),

    scrapedAt: timestamp("scraped_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // The same source shouldn't create two rows for the same origin item.
    sourceUidIdx: uniqueIndex("event_sources_source_uid_idx").on(
      t.source,
      t.sourceUid,
    ),
    eventIdIdx: index("event_sources_event_id_idx").on(t.eventId),
  }),
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type EventSourceRow = typeof eventSources.$inferSelect;
export type NewEventSourceRow = typeof eventSources.$inferInsert;
