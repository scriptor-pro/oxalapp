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

  it("detects lentils as élevé", () => {
    const result = matchIngredients("Lentilles corail, eau, sel");

    expect(result.level).toBe("élevé");
  });

  it("detects cashew as très élevé", () => {
    const result = matchIngredients("Noix de cajou grillées et salées");

    expect(result.level).toBe("très élevé");
  });

  it("detects cinnamon as très élevé", () => {
    const result = matchIngredients("Biscuits, farine de blé, cannelle, sucre");

    expect(result.level).toBe("très élevé");
  });

  it("detects turmeric as très élevé", () => {
    const result = matchIngredients("Curcuma, poivre noir, huile de tournesol");

    expect(result.level).toBe("très élevé");
  });

  it("detects hazelnut (noisette) as très élevé", () => {
    const result = matchIngredients("Pâte à tartiner, noisettes, sucre, cacao");

    expect(result.level).toBe("très élevé");
  });

  it("does not false-positive on générique noix de coco against noix de Grenoble keyword", () => {
    const result = matchIngredients("Farine, sucre, noix de coco râpée");

    expect(result.level).toBe("non déterminable");
  });

  it("does not false-positive on anis inside organismes génétiquement modifiés", () => {
    const result = matchIngredients(
      "Eau, sucre, sel, ne contient pas d'organismes génétiquement modifiés"
    );

    expect(result.level).toBe("non déterminable");
  });

  it("still matches anis as a standalone word", () => {
    const result = matchIngredients("Pastis, anis étoilé, sucre");

    expect(result.level).toBe("élevé");
    expect(
      result.matchedIngredients.some((m) => m.ingredientText === "anis")
    ).toBe(true);
  });

  it("detects Dutch-labeled kurkuma as très élevé", () => {
    const result = matchIngredients("Kurkuma");

    expect(result.level).toBe("très élevé");
  });

  it("detects Dutch-labeled spinazie (spinach) as très élevé", () => {
    const result = matchIngredients("Spinazie, water, zout");

    expect(result.level).toBe("très élevé");
  });

  it("detects Dutch plural hazelnoten (-noot/-noten stem change)", () => {
    const result = matchIngredients("Hazelnoten, suiker");

    expect(result.level).toBe("très élevé");
  });

  it("detects Dutch plural walnoten (-noot/-noten stem change)", () => {
    const result = matchIngredients("Walnoten");

    expect(result.level).toBe("élevé");
  });

  it("detects Dutch plural linzen (-e/-en stem change)", () => {
    const result = matchIngredients("Groene linzen, water, zout");

    expect(result.level).toBe("élevé");
  });

  it("detects tomate as élevé", () => {
    const result = matchIngredients("Sauce tomate, sel, sucre");

    expect(result.level).toBe("élevé");
  });

  it("detects pomme de terre as très élevé", () => {
    const result = matchIngredients("Pommes de terre, huile de tournesol, sel");

    expect(result.level).toBe("très élevé");
  });

  it("detects blette as très élevé", () => {
    const result = matchIngredients("Blettes, eau, sel");

    expect(result.level).toBe("très élevé");
  });

  it("detects Dutch aardappel/aardappelen as très élevé", () => {
    const result = matchIngredients("Aardappelen, zonnebloemolie, zout");

    expect(result.level).toBe("très élevé");
  });

  it("does not double-report when a longer keyword contains a shorter one (graines de fenouil vs fenouil)", () => {
    const result = matchIngredients("Graines de fenouil, sel");

    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.matchedIngredients[0].ingredientText).toBe("graines de fenouil");
  });

  it("does not double-report when a longer keyword contains a shorter one (graines de celeri vs celeri)", () => {
    const result = matchIngredients("Graines de céleri, sel");

    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.matchedIngredients[0].ingredientText).toBe("graines de celeri");
  });

  it("does not double-report French and Dutch synonyms of the same dbItem (amande/amandel)", () => {
    const result = matchIngredients("Amandel, suiker");

    expect(result.matchedIngredients).toHaveLength(1);
  });
});
