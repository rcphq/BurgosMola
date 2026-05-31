import type { Metadata } from "next";
import { placesBySection } from "@/lib/places";

export const metadata: Metadata = {
  title: "Lugares — BurgosMola",
  description:
    "Sitios donde descubrir qué pasa en Burgos: agendas oficiales, prensa local y espacios culturales.",
};

export default function LugaresPage() {
  const sections = [...placesBySection().entries()];

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Sitios donde descubrir qué pasa en Burgos. Visítalos para encontrar más
        planes, agendas y novedades que todavía no estén aquí.
      </p>

      {sections.map(([section, places]) => (
        <section key={section}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {section}
          </h2>
          <div className="space-y-3">
            {places.map((place) => (
              <a
                key={place.url}
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {place.name}
                </h3>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                  {place.description}
                </p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
