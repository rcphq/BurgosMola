import type { EventRow } from "@/lib/db/schema";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/events/ics";

/**
 * Add-to-calendar actions. Pure links (no client JS):
 *  - Google / Outlook open a prefilled "new event" form.
 *  - .ics downloads from our API route (works with Apple Calendar, etc.).
 */
export function AddToCalendar({ event }: { event: EventRow }) {
  const linkClass =
    "rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className={linkClass}
        href={googleCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Google Calendar
      </a>
      <a
        className={linkClass}
        href={outlookCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Outlook
      </a>
      <a className={linkClass} href={`/api/events/${event.id}/ics`}>
        .ics
      </a>
    </div>
  );
}
