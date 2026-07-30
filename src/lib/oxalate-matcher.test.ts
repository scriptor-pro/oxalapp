import { describe, it, expect } from "vitest";
import { matchIngredients } from "./oxalate-matcher";

describe("matchIngredients", () => {
  it("returns très élevé when ingredients include cocoa", () => {
    const result = matchIngredients("Sucre, pâte de cacao, beurre de cacao, noisettes");

    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients.length).toBeGreaterThan(0);
    expect(
      result.matchedIngredients.some((m) => m.ingredientText.toLowerCase().includes("cacao"))
    ).toBe(true);
  });

  it("is case and accent insensitive", () => {
    const result = matchIngredients("CACAO en poudre");

    expect(result.level).toBe("très élevé");
  });

  it("returns non déterminable when no known ingredient matches", () => {
    const result = matchIngredients("Eau, sel, arôme naturel");

    expect(result.level).toBe("non déterminable");
    expect(result.matchedIngredients).toEqual([]);
  });

  it("returns non déterminable for empty or malformed input", () => {
    expect(matchIngredients("").level).toBe("non déterminable");
    expect(matchIngredients("   ").level).toBe("non déterminable");
  });

  it("takes the highest level among multiple matched ingredients", () => {
    // épinard (spinach) and amande (almond) are both très élevé after
    // recalibration; overall must be the highest of the matched set.
    const result = matchIngredients("farine de blé, épinards, sucre");

    expect(result.level).toBe("très élevé");
  });

  it("reclassifies green tea as élevé after recalibration (unchanged)", () => {
    const result = matchIngredients("Extrait de thé vert, eau, sucre");

    expect(result.level).toBe("élevé");
  });

  it("reclassifies almond as très élevé after recalibration (was élevé)", () => {
    const result = matchIngredients("Amandes grillées, sel");

    expect(result.level).toBe("très élevé");
  });

  it("reclassifies beet as très élevé after recalibration (was modéré)", () => {
    const result = matchIngredients("Betterave cuite, vinaigre");

    expect(result.level).toBe("très élevé");
  });
});
