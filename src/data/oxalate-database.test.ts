import { describe, it, expect } from "vitest";
import database from "./oxalate-database.json";

interface OxalateEntry {
  item: string;
  avgOxalatePer100g: number;
  servingSize: string;
  servingGrams: number;
  oxalatePerServing: number;
  oxalatePerServingMin: number;
  oxalatePerServingMax: number;
  level: "faible" | "modéré" | "élevé" | "très élevé";
}

const entries = database as OxalateEntry[];

function expectedLevel(mg: number): OxalateEntry["level"] {
  if (mg < 5) return "faible";
  if (mg < 8) return "modéré";
  if (mg < 25) return "élevé";
  return "très élevé";
}

describe("oxalate-database.json", () => {
  it("has 737 entries", () => {
    expect(entries.length).toBe(737);
  });

  it("classifies every entry per the Mayo Clinic thresholds on oxalatePerServing", () => {
    for (const entry of entries) {
      expect(entry.level).toBe(expectedLevel(entry.oxalatePerServing));
    }
  });

  it("stores a ±35% uncertainty range around oxalatePerServing for every entry", () => {
    for (const entry of entries) {
      const expectedMin = Math.round(entry.oxalatePerServing * 0.65 * 10) / 10;
      const expectedMax = Math.round(entry.oxalatePerServing * 1.35 * 10) / 10;
      expect(entry.oxalatePerServingMin).toBeCloseTo(expectedMin, 1);
      expect(entry.oxalatePerServingMax).toBeCloseTo(expectedMax, 1);
    }
  });

  it("reclassifies spinach as très élevé", () => {
    const spinach = entries.find(
      (e) => e.item === "Spinach, fresh or frozen, boiled or steamed"
    );
    expect(spinach?.level).toBe("très élevé");
  });

  it("reclassifies green tea as élevé (was faible before recalibration)", () => {
    const greenTea = entries.find((e) =>
      e.item.startsWith("Tea, Green, Multiple Brands")
    );
    expect(greenTea?.level).toBe("élevé");
  });
});
