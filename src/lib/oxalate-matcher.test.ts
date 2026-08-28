import { describe, it, expect } from "vitest";
import { matchIngredients, matchStructuredIngredients } from "./oxalate-matcher";

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

  it("detects myrtille as très élevé", () => {
    const result = matchIngredients("Myrtilles, sucre, pectine");

    expect(result.level).toBe("très élevé");
  });

  it("detects grenade as très élevé", () => {
    const result = matchIngredients("Jus de grenade, eau");

    expect(result.level).toBe("très élevé");
  });

  it("does not false-positive groseille against the oseille keyword", () => {
    const result = matchIngredients("Confiture de groseille, sucre");

    expect(
      result.matchedIngredients.some((m) => m.ingredientText === "oseille")
    ).toBe(false);
  });

  it("detects Dutch bosbes (blueberry) as très élevé", () => {
    const result = matchIngredients("Bosbessen, suiker");

    expect(result.level).toBe("très élevé");
  });

  it("detects lait d'avoine as élevé", () => {
    const result = matchIngredients("Lait d'avoine, eau, sel");

    expect(result.level).toBe("élevé");
  });

  it("detects eau de coco as élevé", () => {
    const result = matchIngredients("Eau de coco, sucre de canne");

    expect(result.level).toBe("élevé");
  });

  it("detects the mate as élevé", () => {
    const result = matchIngredients("Thé mate, arôme naturel");

    expect(result.level).toBe("élevé");
  });

  it("detects English-labeled spinach as très élevé", () => {
    const result = matchIngredients("Spinach, water, salt");

    expect(result.level).toBe("très élevé");
  });

  it("detects English-labeled cinnamon as très élevé", () => {
    const result = matchIngredients("Wheat flour, cinnamon, sugar");

    expect(result.level).toBe("très élevé");
  });

  it("detects English-labeled turmeric as très élevé", () => {
    const result = matchIngredients("Turmeric, black pepper, sunflower oil");

    expect(result.level).toBe("très élevé");
  });

  it("detects English-labeled potato as très élevé", () => {
    const result = matchIngredients("Potatoes, sunflower oil, salt");

    expect(result.level).toBe("très élevé");
  });

  it("does not flag potato starch as high-oxalate (OHF rates potato starch as faible, unlike whole potato)", () => {
    const result = matchIngredients("Water, potato starch, salt");

    expect(result.level).toBe("non déterminable");
  });

  it("does not flag potato flour as high-oxalate", () => {
    const result = matchIngredients("Water, potato flour, salt");

    expect(result.level).toBe("non déterminable");
  });

  it("does not flag potato protein as high-oxalate (not in the OHF database)", () => {
    const result = matchIngredients("Water, potato protein, salt");

    expect(result.level).toBe("non déterminable");
  });

  it("does not false-positive on the Boursin Vegan example that started this investigation", () => {
    const result = matchIngredients(
      "water, coconut oil (22%), potato starch, inulin, sunflower oil, garlic, herbs (1,7%), salt, potato protein, white pepper, preservative (potassium sorbate), thickener (xanthan gum), natural flavouring, may contain traces of milk"
    );

    expect(result.level).toBe("non déterminable");
  });

  it("detects English-labeled almond as très élevé", () => {
    const result = matchIngredients("Roasted almonds, salt");

    expect(result.level).toBe("très élevé");
  });

  it("detects English-labeled tomato as élevé", () => {
    const result = matchIngredients("Tomato sauce, salt, sugar");

    expect(result.level).toBe("élevé");
  });
});

describe("matchStructuredIngredients", () => {
  it("keeps the level unchanged when the matched ingredient's percentEstimate is >= 10", () => {
    const result = matchStructuredIngredients([
      { text: "Épinards", percentEstimate: 55 },
      { text: "crème", percentEstimate: 20 },
      { text: "sel", percentEstimate: 5 },
    ]);

    expect(result.level).toBe("très élevé");
    const spinach = result.matchedIngredients.find((m) =>
      m.ingredientText.includes("epinard")
    );
    expect(spinach?.level).toBe("très élevé");
    expect(spinach?.levelBeforeAdjustment).toBeUndefined();
    expect(spinach?.percentEstimate).toBe(55);
  });

  it("degrades the level by one tier when percentEstimate is between 2 and 10", () => {
    const result = matchStructuredIngredients([
      { text: "Farine", percentEstimate: 80 },
      { text: "noisettes", percentEstimate: 5 },
      { text: "sucre", percentEstimate: 15 },
    ]);

    const hazelnut = result.matchedIngredients.find((m) =>
      m.ingredientText.includes("noisette")
    );
    // noisette is "très élevé" pre-adjustment (see KNOWN_INGREDIENTS)
    expect(hazelnut?.levelBeforeAdjustment).toBe("très élevé");
    expect(hazelnut?.level).toBe("élevé");
    expect(hazelnut?.percentEstimate).toBe(5);
  });

  it("degrades the level by two tiers, floored at faible, when percentEstimate is below 2", () => {
    const result = matchStructuredIngredients([
      { text: "Farine de blé", percentEstimate: 70 },
      { text: "eau", percentEstimate: 20 },
      { text: "noisettes", percentEstimate: 0.8 },
    ]);

    const hazelnut = result.matchedIngredients.find((m) =>
      m.ingredientText.includes("noisette")
    );
    expect(hazelnut?.levelBeforeAdjustment).toBe("très élevé");
    expect(hazelnut?.level).toBe("faible");
    expect(hazelnut?.percentEstimate).toBe(0.8);
  });

  it("does not lower an already-faible level below faible (floor, not wraparound)", () => {
    // "anis" is rated élevé; at <2% it degrades two tiers, which floors at
    // faible rather than going negative/undefined.
    const result = matchStructuredIngredients([
      { text: "anis", percentEstimate: 0.5 },
    ]);

    expect(result.matchedIngredients[0].level).toBe("faible");
  });

  it("leaves the level unadjusted when percentEstimate is null (unknown proportion)", () => {
    const result = matchStructuredIngredients([
      { text: "cacao", percentEstimate: null },
    ]);

    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients[0].levelBeforeAdjustment).toBeUndefined();
    expect(result.matchedIngredients[0].percentEstimate).toBeUndefined();
  });

  it("computes the overall level as the max of post-adjustment levels", () => {
    // Both critical cases from the same product: spinach at 55% (stays très
    // élevé) must dominate hazelnut at 0.8% (degraded to faible).
    const result = matchStructuredIngredients([
      { text: "Épinards", percentEstimate: 55 },
      { text: "noisettes", percentEstimate: 0.8 },
    ]);

    expect(result.level).toBe("très élevé");
  });

  it("returns non déterminable for an empty structured ingredients list", () => {
    const result = matchStructuredIngredients([]);
    expect(result.level).toBe("non déterminable");
    expect(result.matchedIngredients).toEqual([]);
  });

  it("skips structured entries whose text matches no known ingredient", () => {
    const result = matchStructuredIngredients([
      { text: "eau", percentEstimate: 90 },
      { text: "sel", percentEstimate: 10 },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.matchedIngredients).toEqual([]);
  });
});
