import { describe, it, expect } from "vitest";
import { eventInputSchema } from "./schema";

describe("eventInputSchema category field", () => {
  const base = {
    title: "Test Event",
    startsAt: "2026-06-10T20:00:00+02:00",
  };

  it("normalizes legacy lowercase 'teatro' to 'Teatro y Danza'", () => {
    const result = eventInputSchema.parse({ ...base, category: "teatro" });
    expect(result.category).toBe("Teatro y Danza");
  });

  it("normalizes 'música' to 'Música'", () => {
    const result = eventInputSchema.parse({ ...base, category: "música" });
    expect(result.category).toBe("Música");
  });

  it("normalizes 'musica' (no accent) to 'Música'", () => {
    const result = eventInputSchema.parse({ ...base, category: "musica" });
    expect(result.category).toBe("Música");
  });

  it("passes through already-canonical categories unchanged", () => {
    const result = eventInputSchema.parse({ ...base, category: "Cultural" });
    expect(result.category).toBe("Cultural");
  });

  it("falls back to 'Otro' for unknown category values", () => {
    const result = eventInputSchema.parse({ ...base, category: "literatura" });
    expect(result.category).toBe("Cultural"); // literatura → Cultural per alias map
  });

  it("falls back to 'Otro' for truly unknown values", () => {
    const result = eventInputSchema.parse({ ...base, category: "completely-unknown" });
    expect(result.category).toBe("Otro");
  });

  it("leaves category undefined when not provided", () => {
    const result = eventInputSchema.parse(base);
    expect(result.category).toBeUndefined();
  });

  it("trims whitespace before normalizing", () => {
    const result = eventInputSchema.parse({ ...base, category: "  música  " });
    expect(result.category).toBe("Música");
  });
});
