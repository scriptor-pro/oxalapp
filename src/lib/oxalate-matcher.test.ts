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
    // épinard (spinach) is très élevé; amande (almond) is modéré-ish;
    // overall must be the highest of the matched set.
    const result = matchIngredients("farine de blé, épinards, sucre");

    expect(result.level).toBe("très élevé");
  });
});
