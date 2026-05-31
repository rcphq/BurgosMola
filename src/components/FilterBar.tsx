"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

const DATE_CHIPS = [
  { label: "Hoy", value: "today" },
  { label: "Este fin de semana", value: "weekend" },
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
] as const;

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const activeCategory = params.get("category") ?? "";
  const activeDate = params.get("date") ?? "";

  function setFilter(key: "category" | "date", value: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) {
      next.delete(key); // toggle off
    } else {
      next.set(key, value);
    }
    router.push(`/?${next.toString()}`);
  }

  const hasFilters = activeCategory || activeDate;

  const chipBase =
    "rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer whitespace-nowrap";
  const chipActive =
    "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900";
  const chipInactive =
    "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800";

  return (
    <div className="mb-6 space-y-2">
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter("category", cat)}
            className={`${chipBase} ${activeCategory === cat ? chipActive : chipInactive}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Date chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DATE_CHIPS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter("date", value)}
            className={`${chipBase} ${activeDate === value ? chipActive : chipInactive}`}
          >
            {label}
          </button>
        ))}
        {hasFilters && (
          <Link
            href="/"
            className="ml-auto shrink-0 text-xs text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
          >
            Limpiar filtros
          </Link>
        )}
      </div>
    </div>
  );
}
