/**
 * Curated list of sites where you can find out what's happening in Burgos.
 *
 * This is a hand-maintained directory — edit freely. Group places by `section`;
 * sections render in the order they first appear here. The URLs below are
 * scaffold placeholders: verify and refine them before publishing.
 */
export type Place = {
  /** Display name of the site or institution. */
  name: string;
  /** External URL — opens in a new tab. */
  url: string;
  /** One-line description of what you'll find there. */
  description: string;
  /** Grouping heading shown in the UI. */
  section: string;
};

export const PLACES: Place[] = [
  // Agendas oficiales
  {
    name: "Ayuntamiento de Burgos — Agenda",
    url: "https://www.aytoburgos.es/agenda",
    description: "Agenda municipal oficial de actividades culturales y de ocio.",
    section: "Agendas oficiales",
  },
  {
    name: "Turismo de Burgos",
    url: "https://www.turismoburgos.org",
    description: "Eventos, visitas y planes recomendados para turistas y locales.",
    section: "Agendas oficiales",
  },
  {
    name: "Instituto Municipal de Cultura y Turismo",
    url: "https://www.aytoburgos.es/cultura",
    description: "Programación cultural municipal: exposiciones, ciclos y talleres.",
    section: "Agendas oficiales",
  },

  // Prensa local
  {
    name: "Diario de Burgos",
    url: "https://www.diariodeburgos.es",
    description: "Periódico local con sección de agenda y ocio.",
    section: "Prensa local",
  },
  {
    name: "Burgosconecta",
    url: "https://www.burgosconecta.es",
    description: "Noticias y agenda de planes en la ciudad y la provincia.",
    section: "Prensa local",
  },

  // Cultura, música y escena
  {
    name: "Teatro Principal de Burgos",
    url: "https://www.teatroprincipalburgos.com",
    description: "Cartelera de teatro, danza y conciertos del teatro municipal.",
    section: "Cultura, música y escena",
  },
  {
    name: "Cultural Cordón / Fundación Cajacírculo",
    url: "https://www.fundacioncajacirculo.es",
    description: "Exposiciones, conciertos y actividades culturales.",
    section: "Cultura, música y escena",
  },
  {
    name: "Fórum Evolución Burgos",
    url: "https://www.forumevolucion.es",
    description: "Palacio de congresos: grandes conciertos, ferias y espectáculos.",
    section: "Cultura, música y escena",
  },
];

/** Group places by their `section`, preserving first-seen order. */
export function placesBySection(places: Place[] = PLACES): Map<string, Place[]> {
  const groups = new Map<string, Place[]>();
  for (const place of places) {
    const bucket = groups.get(place.section);
    if (bucket) bucket.push(place);
    else groups.set(place.section, [place]);
  }
  return groups;
}
