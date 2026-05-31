export const CATEGORIES = [
  "Cultural",
  "Música",
  "Familiar",
  "Deportes",
  "Gastronomía",
  "Mercados y Ferias",
  "Teatro y Danza",
  "Otro",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Maps each category to Tailwind classes for the badge
export const CATEGORY_COLORS: Record<Category, string> = {
  Cultural:        "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Música:          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Familiar:        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Deportes:        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Gastronomía:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "Mercados y Ferias": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "Teatro y Danza": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  Otro:            "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export function getCategoryColor(category: string | null | undefined): string {
  return CATEGORY_COLORS[category as Category] ?? CATEGORY_COLORS["Otro"];
}

// Maps informal/legacy lowercase values to canonical categories
const CATEGORY_ALIASES: Record<string, Category> = {
  música: "Música",
  musica: "Música",
  music: "Música",
  teatro: "Teatro y Danza",
  danza: "Teatro y Danza",
  dance: "Teatro y Danza",
  cultural: "Cultural",
  cultura: "Cultural",
  exposición: "Cultural",
  exposicion: "Cultural",
  arte: "Cultural",
  art: "Cultural",
  literatura: "Cultural",
  familiar: "Familiar",
  infantil: "Familiar",
  family: "Familiar",
  deportes: "Deportes",
  deporte: "Deportes",
  sport: "Deportes",
  sports: "Deportes",
  gastronomía: "Gastronomía",
  gastronomia: "Gastronomía",
  food: "Gastronomía",
  mercados: "Mercados y Ferias",
  feria: "Mercados y Ferias",
  market: "Mercados y Ferias",
  otro: "Otro",
  other: "Otro",
  social: "Otro",
};

/** Normalize a free-text category string to a canonical Category, falling back to "Otro". */
export function normalizeCategory(raw: string): Category {
  const canonical = CATEGORIES.find(
    (c) => c.toLowerCase() === raw.toLowerCase()
  );
  if (canonical) return canonical;
  return CATEGORY_ALIASES[raw.toLowerCase()] ?? "Otro";
}
