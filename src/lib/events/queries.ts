import { and, asc, desc, gte, lt, lte, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { events, type EventRow } from "@/lib/db/schema";

export type EventFilters = {
  category?: string;
  date?: "today" | "weekend" | "week" | "month";
};

/** Compute the [rangeStart, rangeEnd] for a date filter. Exported for testing. */
export function getDateRange(
  date: EventFilters["date"],
  now = new Date()
): { rangeStart: Date; rangeEnd?: Date } {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (date === "today") {
    const rangeEnd = new Date(startOfToday);
    rangeEnd.setHours(23, 59, 59, 999);
    return { rangeStart: startOfToday, rangeEnd };
  }

  if (date === "weekend") {
    const day = now.getDay(); // 0=Sun, 6=Sat
    // daysUntilSat: 0 on Sat, -1 on Sun (show the past Saturday), else 6-day
    const daysUntilSat = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
    const sat = new Date(startOfToday);
    sat.setDate(sat.getDate() + daysUntilSat);
    const sun = new Date(sat);
    sun.setDate(sun.getDate() + 1);
    sun.setHours(23, 59, 59, 999);
    return { rangeStart: sat, rangeEnd: sun };
  }

  if (date === "week") {
    const rangeEnd = new Date(startOfToday);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    return { rangeStart: startOfToday, rangeEnd };
  }

  if (date === "month") {
    const rangeEnd = new Date(startOfToday);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
    return { rangeStart: startOfToday, rangeEnd };
  }

  return { rangeStart: startOfToday };
}

/** Upcoming events (from the start of today), soonest first. */
export async function getUpcomingEvents(
  limit = 200,
  filters: EventFilters = {}
): Promise<EventRow[]> {
  const db = getDb();
  const { rangeStart, rangeEnd } = getDateRange(filters.date);

  const conditions = [gte(events.startsAt, rangeStart)];
  if (rangeEnd) conditions.push(lte(events.startsAt, rangeEnd));
  if (filters.category) conditions.push(eq(events.category, filters.category));

  return db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

/** Past events (before the start of today), most recent first. */
export async function getPastEvents(
  limit = 200,
  filters: Pick<EventFilters, "category"> = {}
): Promise<EventRow[]> {
  const db = getDb();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const conditions = [lt(events.startsAt, startOfToday)];
  if (filters.category) conditions.push(eq(events.category, filters.category));

  return db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.startsAt))
    .limit(limit);
}

/** Group events by their calendar day for sectioned rendering. */
export function groupByDay(rows: EventRow[]): Map<string, EventRow[]> {
  const groups = new Map<string, EventRow[]>();
  for (const row of rows) {
    const key = row.startsAt.toISOString().slice(0, 10);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}
