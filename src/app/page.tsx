import { Suspense } from "react";
import { isDatabaseConfigured } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { FilterBar } from "@/components/FilterBar";
import { CalendarView } from "@/components/CalendarView";
import { getUpcomingEvents, groupByDay, type EventFilters } from "@/lib/events/queries";
import type { EventRow } from "@/lib/db/schema";

// Always read fresh from the DB; events change as scrapers/ingest run.
export const dynamic = "force-dynamic";

function formatDayHeading(isoDay: string): string {
  const date = new Date(`${isoDay}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function SetupNotice({ detail }: { detail?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
      <p className="font-medium text-neutral-800 dark:text-neutral-200">
        No events yet.
      </p>
      <p className="mt-2">
        Set <code>DATABASE_URL</code> in <code>.env.local</code>, run{" "}
        <code>npm run db:push</code>, then add events via{" "}
        <code>data/events/*.json</code> + <code>npm run ingest:files</code> or by
        POSTing to <code>/api/ingest</code>. See <code>docs/INGESTION.md</code>.
      </p>
      {detail && (
        <p className="mt-2 text-xs text-neutral-400">Details: {detail}</p>
      )}
    </div>
  );
}

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <>
        <Suspense><FilterBar /></Suspense>
        <SetupNotice />
      </>
    );
  }

  const isCalendar = sp.view === "calendar";

  const filters: EventFilters = {
    category: typeof sp.category === "string" ? sp.category : undefined,
    date: isCalendar
      ? "week"
      : typeof sp.date === "string"
        ? (sp.date as EventFilters["date"])
        : undefined,
  };

  const now = new Date();
  let events: EventRow[] = [];
  let days: [string, EventRow[]][] = [];
  try {
    events = await getUpcomingEvents(200, filters);
    if (!isCalendar) {
      days = [...groupByDay(events).entries()];
    }
  } catch (err) {
    return (
      <>
        <Suspense><FilterBar /></Suspense>
        <SetupNotice detail={err instanceof Error ? err.message : String(err)} />
      </>
    );
  }

  return (
    <div>
      <Suspense><FilterBar /></Suspense>
      {isCalendar ? (
        events.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No hay eventos para los filtros seleccionados.
          </p>
        ) : (
          <CalendarView events={events} />
        )
      ) : days.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No hay eventos para los filtros seleccionados.
        </p>
      ) : (
        <div className="space-y-8">
          {days.map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {formatDayHeading(day)}
              </h2>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isPast={event.startsAt < now}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
