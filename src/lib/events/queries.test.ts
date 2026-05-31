import { describe, it, expect } from "vitest";
import { getDateRange, groupByDay } from "./queries";
import type { EventRow } from "@/lib/db/schema";

// Helper: build a minimal EventRow-shaped object for testing
function makeEvent(startsAt: Date, overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: crypto.randomUUID(),
    dedupeKey: "key",
    title: "Test Event",
    normalizedTitle: "test event",
    description: null,
    startsAt,
    endsAt: null,
    timezone: "Europe/Madrid",
    allDay: null,
    venueName: null,
    address: null,
    city: "Burgos",
    lat: null,
    lng: null,
    category: null,
    tags: [],
    url: null,
    imageUrl: null,
    price: null,
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("getDateRange", () => {
  it("returns startOfToday with no rangeEnd when date is undefined", () => {
    const now = new Date("2026-06-10T15:00:00Z");
    const { rangeStart, rangeEnd } = getDateRange(undefined, now);
    expect(rangeStart.getHours()).toBe(0);
    expect(rangeStart.getMinutes()).toBe(0);
    expect(rangeEnd).toBeUndefined();
  });

  it("today: rangeEnd is end of same day", () => {
    const now = new Date("2026-06-10T15:00:00Z");
    const { rangeStart, rangeEnd } = getDateRange("today", now);
    expect(rangeStart.toDateString()).toBe(now.toDateString());
    expect(rangeEnd!.getHours()).toBe(23);
    expect(rangeEnd!.getMinutes()).toBe(59);
  });

  it("week: rangeEnd is 7 days from today", () => {
    const now = new Date("2026-06-10T10:00:00Z"); // Wednesday
    const { rangeStart, rangeEnd } = getDateRange("week", now);
    const diff = rangeEnd!.getTime() - rangeStart.getTime();
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("month: rangeEnd is 30 days from today", () => {
    const now = new Date("2026-06-10T10:00:00Z");
    const { rangeStart, rangeEnd } = getDateRange("month", now);
    const diff = rangeEnd!.getTime() - rangeStart.getTime();
    expect(diff).toBe(30 * 24 * 60 * 60 * 1000);
  });

  describe("weekend", () => {
    it("on a Wednesday: rangeStart is the coming Saturday", () => {
      const now = new Date("2026-06-10T10:00:00Z"); // Wednesday (day=3)
      const { rangeStart, rangeEnd } = getDateRange("weekend", now);
      expect(rangeStart.getDay()).toBe(6); // Saturday
      expect(rangeEnd!.getDay()).toBe(0); // Sunday
    });

    it("on a Saturday: rangeStart is today", () => {
      const now = new Date("2026-05-30T10:00:00Z"); // Saturday (day=6)
      const { rangeStart } = getDateRange("weekend", now);
      expect(rangeStart.getDay()).toBe(6); // still Saturday
      // rangeStart should be the same calendar day as now
      expect(rangeStart.getFullYear()).toBe(2026);
      expect(rangeStart.getMonth()).toBe(4); // May = 4
      expect(rangeStart.getDate()).toBe(30);
    });

    it("on a Sunday: rangeStart is yesterday (Saturday), rangeEnd is end of today", () => {
      const now = new Date("2026-05-31T10:00:00Z"); // Sunday (day=0)
      const { rangeStart, rangeEnd } = getDateRange("weekend", now);
      expect(rangeStart.getDay()).toBe(6); // Saturday
      // rangeEnd should be the Sunday (today) at 23:59:59
      expect(rangeEnd!.getDay()).toBe(0);
      expect(rangeEnd!.getHours()).toBe(23);
    });
  });
});

describe("groupByDay", () => {
  it("groups events by their ISO date", () => {
    const day1 = new Date("2026-06-10T10:00:00Z");
    const day2 = new Date("2026-06-11T18:00:00Z");
    const events = [makeEvent(day1), makeEvent(day1), makeEvent(day2)];
    const grouped = groupByDay(events);
    expect(grouped.size).toBe(2);
    expect(grouped.get("2026-06-10")?.length).toBe(2);
    expect(grouped.get("2026-06-11")?.length).toBe(1);
  });

  it("returns an empty map for no events", () => {
    expect(groupByDay([]).size).toBe(0);
  });

  it("preserves insertion order (earliest day first)", () => {
    const events = [
      makeEvent(new Date("2026-06-12T10:00:00Z")),
      makeEvent(new Date("2026-06-10T10:00:00Z")),
      makeEvent(new Date("2026-06-11T10:00:00Z")),
    ];
    // Events are pre-sorted by the DB query; groupByDay preserves that order
    const sorted = [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const grouped = groupByDay(sorted);
    const keys = [...grouped.keys()];
    expect(keys).toEqual(["2026-06-10", "2026-06-11", "2026-06-12"]);
  });
});
