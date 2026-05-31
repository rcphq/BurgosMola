import { Suspense } from "react";
import { isDatabaseConfigured } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { FilterBar } from "@/components/FilterBar";
import { getPastEvents, groupByDay, type EventFilters } from "@/lib/events/queries";

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

function EmptyNotice({ detail }: { detail?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
      <p className="font-medium text-neutral-800 dark:text-neutral-200">
        Todavía no hay eventos pasados.
      </p>
      {detail && (
        <p className="mt-2 text-xs text-neutral-400">Details: {detail}</p>
      )}
    </div>
  );
}

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function PasadosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <>
        <Suspense><FilterBar showDateChips={false} /></Suspense>
        <EmptyNotice />
      </>
    );
  }

  const filters: Pick<EventFilters, "category"> = {
    category: typeof sp.category === "string" ? sp.category : undefined,
  };

  let days: [string, Awaited<ReturnType<typeof getPastEvents>>][];
  try {
    const events = await getPastEvents(200, filters);
    days = [...groupByDay(events).entries()];
  } catch (err) {
    return (
      <>
        <Suspense><FilterBar showDateChips={false} /></Suspense>
        <EmptyNotice detail={err instanceof Error ? err.message : String(err)} />
      </>
    );
  }

  return (
    <div>
      <Suspense><FilterBar showDateChips={false} /></Suspense>
      {days.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No hay eventos pasados para los filtros seleccionados.
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
                  <EventCard key={event.id} event={event} isPast />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
