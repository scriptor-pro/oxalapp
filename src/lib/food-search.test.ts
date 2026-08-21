import { describe, it, expect } from "vitest";
import { searchFoodByName } from "./food-search";

describe("searchFoodByName", () => {
  it("matches a KNOWN_INGREDIENTS keyword directly", () => {
    const result = searchFoodByName("épinard");

    expect(result.level).toBe("très élevé");
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].label).toBe("epinard");
  });

  it("returns non déterminable when nothing matches", () => {
    const result = searchFoodByName("zorblax");

    expect(result.level).toBe("non déterminable");
    expect(result.matches).toEqual([]);
  });

  it("falls back to oxalate-database.json and returns every matching preparation", () => {
    const result = searchFoodByName("poulet");

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].level).toBe("modéré");
  });

  it("returns all matching preparations for pomme de terre, not just the worst", () => {
    const result = searchFoodByName("pomme de terre");

    const labels = result.matches.map((m) => m.label);
    expect(labels).toContain("Potato, White, deep fried");
    expect(labels).toContain("Potato, White/Russet, boiled, with/without skin");
    expect(result.matches.length).toBeGreaterThan(1);
  });

  it("returns non déterminable for empty or whitespace-only input", () => {
    expect(searchFoodByName("").level).toBe("non déterminable");
    expect(searchFoodByName("   ").level).toBe("non déterminable");
  });

  it("is case and accent insensitive", () => {
    const result = searchFoodByName("ÉPINARD");

    expect(result.level).toBe("très élevé");
  });
});
