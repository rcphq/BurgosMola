import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";

/**
 * THE canonical event format.
 *
 * This is the single shape everything funnels through — scrapers, the
 * /api/ingest endpoint, and JSON files dropped in data/events/. Keep it small
 * and forgiving so it's trivial to produce by hand, from a phone shortcut, or
 * from an AI. Only `title` and `startsAt` are required.
 *
 * Dates are ISO 8601 strings. If you include a timezone offset (e.g.
 * 2026-06-21T20:00:00+02:00) it's respected; otherwise the event's `timezone`
 * (default Europe/Madrid) is assumed.
 */
export const sourceSchema = z.object({
  /** Where this came from: "manual", "ai", "instagram", "website:<name>", ... */
  name: z.string().min(1).default("manual"),
  /** Link to the origin (post, page, listing) — where we found the event. */
  url: z.string().url().optional(),
  /** Stable id from the origin, if any (post id, slug). Enables clean re-runs. */
  uid: z.string().optional(),
  /** When it was scraped/seen. Defaults to now at ingest time. */
  scrapedAt: z.string().datetime({ offset: true }).optional(),
});

/** A source given as a bare string (e.g. "instagram") is shorthand for { name }. */
const sourceInput = z
  .union([z.string(), sourceSchema])
  .transform((s) => (typeof s === "string" ? { name: s } : s));

export const eventInputSchema = z.object({
  title: z.string().min(1, "title is required").trim(),
  description: z.string().trim().optional(),

  startsAt: z
    .string()
    .datetime({ offset: true })
    .describe("ISO 8601 start, e.g. 2026-06-21T20:00:00+02:00"),
  endsAt: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().optional(),
  allDay: z.boolean().optional(),

  venueName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),

  category: z.enum([...CATEGORIES] as [string, ...string[]]).optional(),
  tags: z.array(z.string().trim()).optional(),

  url: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  price: z.string().trim().optional(),

  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),

  /**
   * Provenance — WHERE this event came from. Preserve every place you found it.
   * Use `sources` (array) when an event appears in more than one place; use the
   * singular `source` as a shorthand for one. Both accept a bare string
   * (e.g. "instagram") or an object. They're combined at ingest time, and each
   * one is stored and linked back to the event so we keep all original links.
   */
  source: sourceInput.optional(),
  sources: z.array(sourceInput).optional(),

  /** Optional raw origin payload, stored verbatim for debugging/reprocessing. */
  raw: z.unknown().optional(),
});

export type EventInput = z.input<typeof eventInputSchema>;
export type ParsedEventInput = z.output<typeof eventInputSchema>;

/** A batch can be a single event or an array of events. */
export const eventBatchSchema = z.union([
  eventInputSchema,
  z.array(eventInputSchema),
]);
