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

  it("does not eliminate two distinct structured entries whose keywords are in a substring relationship", () => {
    // « cacao » et « pâte de cacao » sont deux entrées OFF distinctes qui
    // contiennent toutes deux le mot-clé « cacao » : elles ne doivent pas
    // se dédoublonner entre elles (bug corrigé en 4012466). « beurre de
    // cacao », exclu depuis 2026-10-01, ne sert plus d'exemple.
    const result = matchStructuredIngredients([
      { text: "sucre", percentEstimate: 40 },
      { text: "cacao", percentEstimate: 30 },
      { text: "pâte de cacao", percentEstimate: 20 },
    ]);

    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients.length).toBe(2);
    expect(result.matchedIngredients.every((m) => m.ingredientText === "cacao")).toBe(true);
    expect(result.matchedIngredients.map((m) => m.percentEstimate).sort()).toEqual([20, 30]);
  });

  it("still dedupes within a single structured entry's own overlapping keyword matches", () => {
    const result = matchStructuredIngredients([
      { text: "Graines de fenouil", percentEstimate: 15 },
    ]);

    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.matchedIngredients[0].ingredientText).toBe("graines de fenouil");
  });

  it("matches by OFF taxonomy id when the ingredient text is in an unsupported language", () => {
    // "Haselnüsse" (German for hazelnuts) isn't in KNOWN_INGREDIENTS at
    // all — only the offId lets this resolve instead of falling through
    // to "non déterminable".
    const result = matchStructuredIngredients([
      { text: "Haselnüsse", percentEstimate: 20, offId: "en:hazelnut" },
    ]);

    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients[0].ingredientText).toBe("hazelnut");
  });

  it("applies proportion-based degradation to an offId match same as a text match", () => {
    const result = matchStructuredIngredients([
      { text: "Haselnüsse", percentEstimate: 0.5, offId: "en:hazelnut" },
    ]);

    expect(result.matchedIngredients[0].levelBeforeAdjustment).toBe("très élevé");
    expect(result.matchedIngredients[0].level).toBe("faible");
  });

  it("falls back to text matching when offId is absent", () => {
    const result = matchStructuredIngredients([
      { text: "epinard", percentEstimate: 50 },
    ]);

    expect(result.level).toBe("très élevé");
  });

  it("falls back to text matching when offId doesn't map to a known ingredient", () => {
    const result = matchStructuredIngredients([
      { text: "epinard", percentEstimate: 50, offId: "en:some-unmapped-id" },
    ]);

    expect(result.level).toBe("très élevé");
  });

  it("detects quinoa as très élevé", () => {
    const result = matchIngredients("Quinoa, eau, sel");

    expect(result.level).toBe("très élevé");
  });

  it("detects sesame as modéré", () => {
    const result = matchIngredients("Farine de blé, graines de sésame, sel");

    expect(result.level).toBe("modéré");
  });

  it("detects milk thistle (chardon-marie) as très élevé", () => {
    const result = matchIngredients("Extrait de chardon-marie, eau");

    expect(result.level).toBe("très élevé");
  });

  it("detects nori as élevé", () => {
    const result = matchIngredients("Riz, algue nori, vinaigre");

    expect(result.level).toBe("élevé");
  });
});

describe("matchStructuredIngredients — monde fermé (spec 2026-10-01)", () => {
  it("conclut faible quand tous les ingrédients sont reconnus faibles", () => {
    const result = matchStructuredIngredients([
      { text: "eau gazéifiée", percentEstimate: 81.4, offId: "en:carbonated-water" },
      { text: "sucre", percentEstimate: 10.6, offId: "en:sugar" },
      { text: "acide phosphorique", percentEstimate: 2, offId: "en:e338" },
    ]);

    expect(result.level).toBe("faible");
    expect(result.matchedIngredients).toEqual([]);
    expect(result.unknownIngredients).toEqual([]);
  });

  it("reste non déterminable et liste l'inconnu présent à 2 % ou plus", () => {
    const result = matchStructuredIngredients([
      { text: "Farine de seigle", percentEstimate: 50.15, offId: "en:rye-flour" },
      { text: "sucre", percentEstimate: 37.47, offId: "en:sugar" },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.unknownIngredients).toEqual([
      { text: "Farine de seigle", offId: "en:rye-flour", percentEstimate: 50.15 },
    ]);
  });

  it("ignore un inconnu présent à moins de 2 %", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 98.5, offId: "en:milk" },
      { text: "ingrédient mystère", percentEstimate: 1.5, offId: "en:mystery" },
    ]);

    expect(result.level).toBe("faible");
    expect(result.unknownIngredients).toEqual([]);
  });

  it("n'ignore plus rien quand les inconnus ignorés dépassent 5 % au total", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 94.3, offId: "en:milk" },
      { text: "inconnu A", percentEstimate: 1.9, offId: null },
      { text: "inconnu B", percentEstimate: 1.9, offId: null },
      { text: "inconnu C", percentEstimate: 1.9, offId: null },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.unknownIngredients.map((u) => u.text)).toEqual(["inconnu A", "inconnu B", "inconnu C"]);
  });

  it("compte un inconnu de proportion inconnue comme significatif", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 90, offId: "en:milk" },
      { text: "préparation spéciale", percentEstimate: null, offId: null },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.unknownIngredients).toEqual([
      { text: "préparation spéciale", offId: null, percentEstimate: null },
    ]);
  });

  it("garde un niveau élevé comme minimum malgré un inconnu significatif", () => {
    const result = matchStructuredIngredients([
      { text: "lentilles", percentEstimate: 20, offId: "en:lentils" },
      { text: "Farine de seigle", percentEstimate: 40, offId: "en:rye-flour" },
      { text: "eau", percentEstimate: 40, offId: "en:water" },
    ]);

    expect(result.level).toBe("élevé");
    expect(result.unknownIngredients.map((u) => u.offId)).toEqual(["en:rye-flour"]);
  });

  it("ne conclut plus faible quand une trace d'ingrédient à risque masque un inconnu majeur (règle A)", () => {
    const result = matchStructuredIngredients([
      { text: "Farine de seigle", percentEstimate: 60, offId: "en:rye-flour" },
      { text: "sucre", percentEstimate: 39.2, offId: "en:sugar" },
      { text: "noisettes", percentEstimate: 0.8, offId: "en:hazelnut" },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.matchedIngredients[0].level).toBe("faible");
    expect(result.matchedIngredients[0].levelBeforeAdjustment).toBe("très élevé");
  });

  it("conclut faible pour une trace d'ingrédient à risque quand tout le reste est faible", () => {
    const result = matchStructuredIngredients([
      { text: "sucre", percentEstimate: 99.2, offId: "en:sugar" },
      { text: "noisettes", percentEstimate: 0.8, offId: "en:hazelnut" },
    ]);

    expect(result.level).toBe("faible");
  });

  it("traite un pourcentage hors de [0, 100] comme inconnu au lieu de rétrograder", () => {
    const result = matchStructuredIngredients([
      { text: "cranberries", percentEstimate: -359.5, offId: "en:cranberry" },
      { text: "sucre", percentEstimate: 33, offId: "en:sugar" },
    ]);

    expect(result.level).toBe("élevé");
    expect(result.matchedIngredients[0].percentEstimate).toBeUndefined();
    expect(result.matchedIngredients[0].levelBeforeAdjustment).toBeUndefined();
  });

  it("traite un pourcentage non fini comme inconnu", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 90, offId: "en:milk" },
      { text: "inconnu", percentEstimate: Number.NaN, offId: null },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.unknownIngredients).toEqual([{ text: "inconnu", offId: null, percentEstimate: null }]);
  });

  it("reconnaît le beurre de cacao comme faible par son identifiant malgré le mot cacao", () => {
    const result = matchStructuredIngredients([
      { text: "sucre", percentEstimate: 45, offId: "en:sugar" },
      { text: "beurre de cacao", percentEstimate: 30, offId: "en:cocoa-butter" },
      { text: "lait en poudre", percentEstimate: 25, offId: "en:milk-powder" },
    ]);

    expect(result.level).toBe("faible");
    expect(result.matchedIngredients).toEqual([]);
  });

  it("détecte toujours la pâte de cacao par le texte", () => {
    const result = matchStructuredIngredients([
      { text: "pâte de cacao", percentEstimate: 60, offId: "en:cocoa-paste" },
      { text: "sucre", percentEstimate: 40, offId: "en:sugar" },
    ]);

    expect(result.level).toBe("très élevé");
  });

  it("reconnaît les additifs de la table mais pas le rouge de betterave E162", () => {
    const withCitricAcid = matchStructuredIngredients([
      { text: "eau", percentEstimate: 97, offId: "en:water" },
      { text: "acide citrique", percentEstimate: 3, offId: "en:e330" },
    ]);
    // Texte neutre : on vérifie l'absence d'E162 dans la table, pas le
    // mot-clé « betterave » (voir le test suivant).
    const withBeetrootRed = matchStructuredIngredients([
      { text: "eau", percentEstimate: 97, offId: "en:water" },
      { text: "colorant E162", percentEstimate: 3, offId: "en:e162" },
    ]);

    expect(withCitricAcid.level).toBe("faible");
    expect(withBeetrootRed.level).toBe("non déterminable");
    expect(withBeetrootRed.unknownIngredients.map((u) => u.offId)).toEqual(["en:e162"]);
  });

  it("détecte la betterave dans le texte d'un E162 libellé « rouge de betterave »", () => {
    const result = matchStructuredIngredients([
      { text: "eau", percentEstimate: 97, offId: "en:water" },
      { text: "rouge de betterave", percentEstimate: 3, offId: "en:e162" },
    ]);

    expect(result.level).toBe("élevé");
    expect(result.matchedIngredients[0].levelBeforeAdjustment).toBe("très élevé");
  });

  it("reste non déterminable, sans inconnu listé, quand seuls de minuscules inconnus composent la liste", () => {
    const result = matchStructuredIngredients([
      { text: "Calcium 240", percentEstimate: 0.5, offId: "fr:calcium-240" },
      { text: "pH = 7,6", percentEstimate: 0.5, offId: "fr:ph-7-6" },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.unknownIngredients).toEqual([]);
  });

  it("garde unknownIngredients vide pour le texte brut", () => {
    expect(matchIngredients("Eau, sel").unknownIngredients).toEqual([]);
    expect(matchIngredients("").unknownIngredients).toEqual([]);
    expect(matchIngredients("épinards").unknownIngredients).toEqual([]);
  });
});

describe("texte d'affichage des ingrédients à risque (labelText)", () => {
  it("garde le texte de l'étiquette pour une correspondance par identifiant OFF", () => {
    const result = matchStructuredIngredients([
      { text: "Haselnüsse", percentEstimate: 20, offId: "en:hazelnut" },
    ]);

    expect(result.matchedIngredients[0].labelText).toBe("Haselnüsse");
    expect(result.matchedIngredients[0].ingredientText).toBe("hazelnut");
  });

  it("garde l'entrée d'étiquette entière quand un seul mot-clé y est reconnu", () => {
    const result = matchStructuredIngredients([
      { text: "pâte de cacao", percentEstimate: 60, offId: "en:cocoa-paste" },
    ]);

    expect(result.matchedIngredients[0].labelText).toBe("pâte de cacao");
  });

  it("garde le passage exact de chaque mot-clé quand une entrée en contient plusieurs", () => {
    const result = matchStructuredIngredients([
      { text: "noisettes et amandes", percentEstimate: 30, offId: null },
    ]);

    expect(result.matchedIngredients.map((m) => m.labelText).sort()).toEqual(["amandes", "noisettes"]);
  });

  it("garde le passage original, accents et pluriel compris, dans un texte brut", () => {
    const result = matchIngredients("Farine de blé, Épinards, sucre");

    expect(result.matchedIngredients[0].labelText).toBe("Épinards");
  });

  it("n'invente pas de passage quand la normalisation change la longueur du texte", () => {
    const result = matchIngredients("가 épinards");

    expect(result.matchedIngredients[0].labelText).toBeUndefined();
    expect(result.matchedIngredients[0].ingredientText).toBe("epinard");
  });
});

describe("blé et chocolat dans le texte brut (spec 2026-10-01-ble-chocolat)", () => {
  it("classe la farine de blé raffinée modéré et la farine complète élevé", () => {
    expect(matchIngredients("farine de blé, sucre").level).toBe("modéré");
    expect(matchIngredients("Farine de blé complet, sucre").level).toBe("élevé");
    expect(matchIngredients("farine de blé complète, sel").level).toBe("élevé");
    expect(matchIngredients("Semoule de blé dur, eau").level).toBe("modéré");
    expect(matchIngredients("Whole wheat flour, salt").level).toBe("élevé");
  });

  it("ne retient que le mot-clé le plus précis pour la farine complète", () => {
    const result = matchIngredients("Farine de blé complet, sucre");
    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.matchedIngredients[0].labelText).toBe("Farine de blé complet");
  });

  it("ne reconnaît jamais « blé » seul", () => {
    expect(matchIngredients("blé, sucre").level).toBe("non déterminable");
  });

  it("classe le chocolat très élevé en français, néerlandais et anglais", () => {
    expect(matchIngredients("sucre, pépites de chocolat, farine").level).toBe("très élevé");
    expect(matchIngredients("chocolat au lait 30%, sucre").level).toBe("très élevé");
    expect(matchIngredients("melkchocolade, suiker").level).toBe("non déterminable");
    expect(matchIngredients("pure chocolade, suiker").level).toBe("très élevé");
    expect(matchIngredients("dark chocolate, sugar").level).toBe("très élevé");
  });

  it("n'alerte pas sur le chocolat blanc, le beurre de cacao ni un arôme", () => {
    expect(matchIngredients("chocolat blanc, sucre").level).toBe("non déterminable");
    expect(matchIngredients("white chocolate, sugar").level).toBe("non déterminable");
    expect(matchIngredients("witte chocolade, suiker").level).toBe("non déterminable");
    expect(matchIngredients("sucre, beurre de cacao, lait").level).toBe("non déterminable");
    expect(matchIngredients("sugar, cocoa butter, milk").level).toBe("non déterminable");
    expect(matchIngredients("eau, arôme chocolat").level).toBe("non déterminable");
  });

  it("n'alerte sur aucune forme d'arôme de chocolat ou de cacao", () => {
    for (const text of [
      "eau, arôme de chocolat",
      "eau, arôme naturel de chocolat",
      "eau, arômes naturels de chocolat",
      "eau, arôme naturel chocolat",
      "eau, arôme cacao",
      "eau, arôme de cacao",
      "eau, arôme naturel de cacao",
      "water, natural cocoa flavouring",
      "water, cocoa flavour",
      "water, chocolate aroma",
      "water, cocoa aroma",
      "water, aroma chocolade",
      "water, natuurlijk chocolade-aroma",
      "water, cacao-aroma",
    ]) {
      expect(matchIngredients(text).level, text).toBe("non déterminable");
    }
  });

  it("reconnaît toujours le chocolat et le cacao réels à côté d'un arôme", () => {
    expect(matchIngredients("sucre, cacao maigre en poudre, arôme").level).toBe("très élevé");
    expect(matchIngredients("sucre, arôme, chocolat noir").level).toBe("très élevé");
    expect(matchIngredients("arôme de chocolat, pépites de chocolat").level).toBe("très élevé");
    expect(matchIngredients("sugar, cocoa powder, flavouring").level).toBe("très élevé");
  });

  it("reconnaît toujours la pâte de cacao à côté du beurre de cacao", () => {
    const result = matchIngredients("sucre, pâte de cacao, beurre de cacao");
    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients.map((m) => m.labelText)).toEqual(["cacao"]);
  });
});

describe("blé et chocolat par identifiant OFF (table à risque héritée)", () => {
  it("classe la farine blanche modéré, la complète élevé et les pâtes modéré", () => {
    const flour = matchStructuredIngredients([{ text: "farine de blé", percentEstimate: 60, offId: "en:wheat-flour" }, { text: "sucre", percentEstimate: 40, offId: "en:sugar" }]);
    const whole = matchStructuredIngredients([{ text: "farine complète", percentEstimate: 60, offId: "en:whole-wheat-flour" }, { text: "eau", percentEstimate: 40, offId: "en:water" }]);
    const pasta = matchStructuredIngredients([{ text: "semoule de blé dur", percentEstimate: 100, offId: "en:durum-wheat-semolina" }]);
    expect(flour.level).toBe("modéré");
    expect(whole.level).toBe("élevé");
    expect(pasta.level).toBe("modéré");
    expect(flour.matchedIngredients[0].labelText).toBe("farine de blé");
  });

  it("classe les pépites de chocolat très élevé, et élevé à 5 %", () => {
    const at15 = matchStructuredIngredients([{ text: "pépites de chocolat", percentEstimate: 15, offId: "en:chocolate-chunk" }, { text: "sucre", percentEstimate: 85, offId: "en:sugar" }]);
    const at5 = matchStructuredIngredients([{ text: "pépites de chocolat", percentEstimate: 5, offId: "en:chocolate-chunk" }, { text: "sucre", percentEstimate: 95, offId: "en:sugar" }]);
    expect(at15.level).toBe("très élevé");
    expect(at5.level).toBe("élevé");
  });

  it("garde le beurre de cacao et le chocolat blanc faibles", () => {
    const result = matchStructuredIngredients([
      { text: "chocolat blanc", percentEstimate: 30, offId: "en:white-chocolate" },
      { text: "beurre de cacao", percentEstimate: 20, offId: "en:cocoa-butter" },
      { text: "sucre", percentEstimate: 50, offId: "en:sugar" },
    ]);
    expect(result.level).toBe("faible");
    expect(result.matchedIngredients).toEqual([]);
  });

  it("garde la poudre de chocolat blanc faible, bien qu'OFF la range sous le chocolat", () => {
    const result = matchStructuredIngredients([
      { text: "poudre de chocolat blanc", percentEstimate: 30, offId: "en:white-chocolate-powder" },
      { text: "sucre", percentEstimate: 70, offId: "en:sugar" },
    ]);
    expect(result.level).toBe("faible");
  });

  it("reconnaît la pâte de cacao étiquetée en allemand par son identifiant", () => {
    const result = matchStructuredIngredients([{ text: "Kakaomasse", percentEstimate: 60, offId: "en:cocoa-paste" }, { text: "Zucker", percentEstimate: 40, offId: "en:sugar" }]);
    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients[0].labelText).toBe("Kakaomasse");
  });
});
