import type { EventRow } from "@/lib/db/schema";
import { getCategoryColor } from "@/lib/categories";

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 8;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function getSevenDays(): string[] {
  const todayISO = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
  }).format(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${todayISO}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function getLocalHourDecimal(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).formatToParts(date);
  let h = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const m = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  if (h === 24) h = 0;
  return h + m / 60;
}

function formatDayHeader(isoDay: string): { weekday: string; day: string } {
  const d = new Date(`${isoDay}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(d)
    .replace(".", "")
    .toUpperCase();
  const day = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
  return { weekday, day };
}

function getEffectiveEnd(event: EventRow): Date {
  return (
    event.endsAt ?? new Date(event.startsAt.getTime() + 2 * 60 * 60 * 1000)
  );
}

type PositionedEvent = { event: EventRow; col: number; totalCols: number };

function assignColumns(dayEvents: EventRow[]): PositionedEvent[] {
  if (!dayEvents.length) return [];
  const sorted = [...dayEvents].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  );
  const colEnds: Date[] = [];
  const assignments: Array<{ event: EventRow; col: number }> = [];

  for (const event of sorted) {
    const endTime = getEffectiveEnd(event);
    let col = colEnds.findIndex((end) => end <= event.startsAt);
    if (col === -1) col = colEnds.length;
    colEnds[col] = endTime;
    assignments.push({ event, col });
  }

  const totalCols = Math.max(1, colEnds.length);
  return assignments.map((a) => ({ ...a, totalCols }));
}

function EventBlock({ event, col, totalCols }: PositionedEvent) {
  const tz = event.timezone;
  const startHD = getLocalHourDecimal(event.startsAt, tz);
  const endHD = getLocalHourDecimal(getEffectiveEnd(event), tz);

  const clampedStart = Math.max(START_HOUR, startHD);
  const clampedEnd = Math.min(END_HOUR, endHD);
  if (clampedEnd <= clampedStart) return null;

  const top = (clampedStart - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max(22, (clampedEnd - clampedStart) * HOUR_HEIGHT);
  const style = {
    top,
    height,
    left: `calc(${(col / totalCols) * 100}% + 1px)`,
    width: `calc(${(1 / totalCols) * 100}% - 2px)`,
  };

  const timeLabel = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(event.startsAt);

  const colorClass = getCategoryColor(event.category);
  const blockClass = `absolute overflow-hidden rounded px-1 py-0.5 text-xs leading-tight ${colorClass}`;

  const inner = (
    <>
      <div className="font-semibold truncate">{event.title}</div>
      {height >= 36 && <div className="opacity-70 truncate">{timeLabel}</div>}
    </>
  );

  if (event.url) {
    return (
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className={blockClass}
        style={style}
      >
        {inner}
      </a>
    );
  }
  return (
    <div className={blockClass} style={style}>
      {inner}
    </div>
  );
}

export function CalendarView({ events }: { events: EventRow[] }) {
  const days = getSevenDays();
  const today = days[0];

  const eventsByDay = new Map<string, EventRow[]>(days.map((d) => [d, []]));
  const allDayByDay = new Map<string, EventRow[]>(days.map((d) => [d, []]));

  for (const event of events) {
    const day = new Intl.DateTimeFormat("sv-SE", {
      timeZone: event.timezone,
    }).format(event.startsAt);
    if (event.allDay === "true") {
      allDayByDay.get(day)?.push(event);
    } else {
      eventsByDay.get(day)?.push(event);
    }
  }

  const hasAllDay = [...allDayByDay.values()].some((v) => v.length > 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-12 flex-shrink-0" />
          {days.map((day) => {
            const { weekday, day: dayNum } = formatDayHeader(day);
            const isToday = day === today;
            return (
              <div key={day} className="flex-1 min-w-0 py-2 text-center">
                <div
                  className={`text-xs font-medium ${
                    isToday
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-neutral-400"
                  }`}
                >
                  {weekday}
                </div>
                <div
                  className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {dayNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* All-day row */}
        {hasAllDay && (
          <div className="flex border-b border-neutral-200 dark:border-neutral-800">
            <div className="w-12 flex-shrink-0 flex items-center justify-end pr-2">
              <span className="text-xs text-neutral-400 leading-none">todo el día</span>
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="flex-1 min-w-0 border-l border-neutral-100 p-1 dark:border-neutral-800"
              >
                {(allDayByDay.get(day) ?? []).map((event) => (
                  <div
                    key={event.id}
                    className={`mb-0.5 truncate rounded px-1 text-xs ${getCategoryColor(event.category)}`}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Time grid */}
        <div className="flex">
          {/* Hour labels */}
          <div
            className="relative w-12 flex-shrink-0"
            style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
          >
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute right-2 text-xs text-neutral-400 leading-none"
                style={{ top: i * HOUR_HEIGHT + 2 }}
              >
                {String(START_HOUR + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = eventsByDay.get(day) ?? [];
            const positioned = assignColumns(dayEvents);
            return (
              <div
                key={day}
                className="relative flex-1 min-w-0 border-l border-neutral-100 dark:border-neutral-800"
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
              >
                {/* Hour grid lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-neutral-100 dark:border-neutral-800"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}
                {/* Event blocks */}
                {positioned.map(({ event, col, totalCols }) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    col={col}
                    totalCols={totalCols}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
