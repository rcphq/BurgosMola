import type { EventRow } from "@/lib/db/schema";

/** Format a Date as UTC iCalendar timestamp: 20260621T180000Z. */
function toICalUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape text per RFC 5545 (commas, semicolons, backslashes, newlines). */
function escapeICal(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Default duration when an event has no explicit end time. */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function endOrDefault(event: EventRow): Date {
  if (event.endsAt) return event.endsAt;
  return new Date(event.startsAt.getTime() + DEFAULT_DURATION_MS);
}

function location(event: EventRow): string {
  return [event.venueName, event.address, event.city]
    .filter(Boolean)
    .join(", ");
}

/** Build a single VEVENT body (without the VCALENDAR wrapper). */
function buildVEvent(event: EventRow): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.id}@burgoseventhub`,
    `DTSTAMP:${toICalUtc(new Date())}`,
    `DTSTART:${toICalUtc(event.startsAt)}`,
    `DTEND:${toICalUtc(endOrDefault(event))}`,
    `SUMMARY:${escapeICal(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeICal(event.description)}`);
  const loc = location(event);
  if (loc) lines.push(`LOCATION:${escapeICal(loc)}`);
  if (event.url) lines.push(`URL:${escapeICal(event.url)}`);
  if (event.status === "cancelled") lines.push("STATUS:CANCELLED");
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

/** Wrap one or more events into a full .ics calendar document. */
export function buildICalendar(events: EventRow | EventRow[]): string {
  const list = Array.isArray(events) ? events : [events];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BurgosEventHub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...list.map(buildVEvent),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** "Add to Google Calendar" URL. */
export function googleCalendarUrl(event: EventRow): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toICalUtc(event.startsAt)}/${toICalUtc(endOrDefault(event))}`,
  });
  if (event.description) params.set("details", event.description);
  const loc = location(event);
  if (loc) params.set("location", loc);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** "Add to Outlook (web)" URL. */
export function outlookCalendarUrl(event: EventRow): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: event.startsAt.toISOString(),
    enddt: endOrDefault(event).toISOString(),
  });
  if (event.description) params.set("body", event.description);
  const loc = location(event);
  if (loc) params.set("location", loc);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
