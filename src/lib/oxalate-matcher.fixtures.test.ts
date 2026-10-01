import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/off-products.json";
import { matchStructuredIngredients, type MatchLevel } from "./oxalate-matcher";

// Niveaux attendus avec la table du 2026-10-01 (voir la spec, volet 4.1).
// Ces produits couvrent : tout faible (soda, fromage, huile, boisson
// lactée), blé non reconnu (Lotus, ancien faux « faible ») et chocolat
// noir dont le beurre de cacao est faible mais la masse de cacao, en
// allemand, reste inconnue en attendant l'étape 3.
const EXPECTED: Record<string, { level: MatchLevel; unknownTexts: string[] }> = {
  "5449000267412": { level: "faible", unknownTexts: [] }, // Coca-Cola goût original
  "3228021170039": { level: "faible", unknownTexts: [] }, // PRESIDENT Camembert
  "4056489141877": { level: "faible", unknownTexts: [] }, // Huile d'olive vierge extra
  "4056489406679": { level: "faible", unknownTexts: [] }, // Boisson lactée saveur chocolat
  "5410126806069": { level: "non déterminable", unknownTexts: ["Farine de BLÉ"] }, // Lotus Biscoff
  "4056489471264": { level: "non déterminable", unknownTexts: ["Kakaomasse", "fettarmes Kakaopulver"] }, // Edelbitter 90 %
};

describe("matchStructuredIngredients sur des produits réels d'Open Food Facts", () => {
  for (const product of fixture.products) {
    it(`${product.productName} (${product.code})`, () => {
      const result = matchStructuredIngredients(
        product.ingredients.map((ingredient) => ({
          text: ingredient.text,
          percentEstimate: ingredient.percent_estimate,
          offId: ingredient.id,
        }))
      );

      expect(result.level).toBe(EXPECTED[product.code].level);
      expect(result.unknownIngredients.map((u) => u.text)).toEqual(
        EXPECTED[product.code].unknownTexts
      );
    });
  }
});
