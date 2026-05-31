import { describe, it, expect } from "vitest";
import { normalizeCategory, getCategoryColor, CATEGORIES } from "./categories";

describe("normalizeCategory", () => {
  it("passes through already-canonical values unchanged", () => {
    for (const cat of CATEGORIES) {
      expect(normalizeCategory(cat)).toBe(cat);
    }
  });

  it("normalizes legacy lowercase aliases", () => {
    expect(normalizeCategory("teatro")).toBe("Teatro y Danza");
    expect(normalizeCategory("música")).toBe("Música");
    expect(normalizeCategory("musica")).toBe("Música");
    expect(normalizeCategory("familiar")).toBe("Familiar");
    expect(normalizeCategory("infantil")).toBe("Familiar");
    expect(normalizeCategory("deporte")).toBe("Deportes");
    expect(normalizeCategory("deportes")).toBe("Deportes");
    expect(normalizeCategory("literatura")).toBe("Cultural");
    expect(normalizeCategory("exposición")).toBe("Cultural");
    expect(normalizeCategory("social")).toBe("Otro");
  });

  it("is case-insensitive for canonical names", () => {
    expect(normalizeCategory("MÚSICA")).toBe("Música");
    expect(normalizeCategory("cultural")).toBe("Cultural");
    expect(normalizeCategory("FAMILIAR")).toBe("Familiar");
  });

  it("falls back to 'Otro' for unknown values", () => {
    expect(normalizeCategory("unknown-category")).toBe("Otro");
    expect(normalizeCategory("xyz")).toBe("Otro");
    expect(normalizeCategory("")).toBe("Otro");
  });
});

describe("getCategoryColor", () => {
  it("returns a non-empty string for every canonical category", () => {
    for (const cat of CATEGORIES) {
      const color = getCategoryColor(cat);
      expect(color).toBeTruthy();
      expect(typeof color).toBe("string");
    }
  });

  it("returns the 'Otro' color for null, undefined, and unknown values", () => {
    const otroColor = getCategoryColor("Otro");
    expect(getCategoryColor(null)).toBe(otroColor);
    expect(getCategoryColor(undefined)).toBe(otroColor);
    expect(getCategoryColor("not-a-category")).toBe(otroColor);
  });

  it("each category has a distinct color class", () => {
    const colors = CATEGORIES.map(getCategoryColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(CATEGORIES.length);
  });
});
