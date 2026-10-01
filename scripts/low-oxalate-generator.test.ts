import { describe, expect, it } from "vitest";
import {
  ADDITIVES_FAMILY,
  computeLowOxalateIds,
  type RootsFile,
  type Taxonomy,
} from "./low-oxalate-generator";

// Mini-taxonomie reproduisant les cas réels rencontrés dans la taxonomie
// OFF (voir la spec, volet 1).
const taxonomy: Taxonomy = {
  "en:dairy": {},
  "en:milk": { parents: ["en:dairy"] },
  "en:skimmed-milk-powder": { parents: ["en:milk"] },
  "en:oat-milk": { parents: ["en:dairy"] },
  "en:loop-a": { parents: ["en:loop-b"] },
  "en:loop-b": { parents: ["en:loop-a", "en:dairy"] },
  "en:sugar": {},
  "en:peanut": {},
  "en:caramelised-peanut": { parents: ["en:sugar", "en:peanut"] },
  "en:cocoa": {},
  "en:vegetable-fat": {},
  "en:cocoa-butter": { parents: ["en:cocoa", "en:vegetable-fat"] },
  "en:pure-cocoa-butter": { parents: ["en:cocoa-butter"] },
  "en:cocoa-paste": { parents: ["en:cocoa"] },
  "en:cocoa-mass-and-cocoa-butter": { parents: ["en:cocoa-butter", "en:cocoa-paste"] },
  "en:orange": {},
  "en:carrot": {},
  "en:fruit-juice": {},
  "en:orange-juice": { parents: ["en:fruit-juice", "en:orange"] },
  "en:orange-carrot-juice": { parents: ["en:orange-juice", "en:carrot"] },
  "en:e330": {},
  "en:e322": {},
  "en:e322i": { parents: ["en:e322"] },
  "en:soya-lecithin": { parents: ["en:e322i"] },
  "en:e162": {},
  "en:beetroot-red": { parents: ["en:e162"] },
};

const risky = new Set(["en:peanut", "en:cocoa", "en:orange", "en:carrot", "en:oat-milk"]);

const rootsFile: RootsFile = {
  roots: [
    { id: "en:dairy", kind: "ohf", justification: "Milk, Cows or Goats, All types" },
    { id: "en:sugar", kind: "forme-raffinée", justification: "Sugar, Cane, White" },
    { id: "en:vegetable-fat", kind: "forme-raffinée", justification: "Oils, All types nut, vegetable and seed oils" },
  ],
  forceLow: [
    { id: "en:cocoa-butter", justification: "Candy, White Chocolate, bar or chips" },
    { id: "en:orange-juice", justification: "Juice, Orange," },
  ],
  exclude: [
    { id: "en:cocoa-mass-and-cocoa-butter", justification: "contient de la masse de cacao" },
    { id: "en:e162", justification: "rouge de betterave" },
  ],
};

const { table, report } = computeLowOxalateIds(taxonomy, rootsFile, risky);

describe("computeLowOxalateIds", () => {
  it("rend faibles une famille et tous ses descendants", () => {
    expect(table.ids["en:dairy"]).toBe("en:dairy");
    expect(table.ids["en:milk"]).toBe("en:dairy");
    expect(table.ids["en:skimmed-milk-powder"]).toBe("en:dairy");
  });

  it("tolère les cycles dans la taxonomie", () => {
    expect(table.ids["en:loop-a"]).toBe("en:dairy");
    expect(table.ids["en:loop-b"]).toBe("en:dairy");
  });

  it("écarte un descendant qui a un ancêtre à risque (l'ingrédient à risque l'emporte)", () => {
    expect(table.ids["en:caramelised-peanut"]).toBeUndefined();
    expect(report.riskyConflicts).toContain("en:caramelised-peanut");
  });

  it("écarte un descendant qui est lui-même un identifiant à risque", () => {
    expect(table.ids["en:oat-milk"]).toBeUndefined();
  });

  it("rend faible un forceLow et ses descendants malgré l'ancêtre à risque pardonné", () => {
    expect(table.ids["en:cocoa-butter"]).toBe("en:cocoa-butter");
    expect(table.ids["en:pure-cocoa-butter"]).toBe("en:cocoa-butter");
    expect(report.forcedLow).toEqual(
      expect.arrayContaining(["en:cocoa-butter", "en:pure-cocoa-butter", "en:orange-juice"])
    );
    expect(report.riskyConflicts).not.toContain("en:cocoa-butter");
  });

  it("ne pardonne pas un ancêtre à risque venu d'une autre branche que le forceLow", () => {
    expect(table.ids["en:orange-juice"]).toBe("en:orange-juice");
    expect(table.ids["en:orange-carrot-juice"]).toBeUndefined();
  });

  it("fait passer exclude avant forceLow", () => {
    expect(table.ids["en:cocoa-mass-and-cocoa-butter"]).toBeUndefined();
    expect(report.excluded).toContain("en:cocoa-mass-and-cocoa-butter");
  });

  it("range les codes E et leurs descendants dans la famille additifs", () => {
    expect(table.ids["en:e330"]).toBe(ADDITIVES_FAMILY);
    expect(table.ids["en:e322i"]).toBe(ADDITIVES_FAMILY);
    expect(table.ids["en:soya-lecithin"]).toBe(ADDITIVES_FAMILY);
  });

  it("n'inclut pas un code E exclu ni ses descendants", () => {
    expect(table.ids["en:e162"]).toBeUndefined();
    expect(table.ids["en:beetroot-red"]).toBeUndefined();
  });

  it("ne rend pas faible un identifiant hors de toute famille", () => {
    expect(table.ids["en:cocoa-paste"]).toBeUndefined();
    expect(table.ids["en:fruit-juice"]).toBeUndefined();
  });

  it("décrit chaque famille avec son type et sa justification", () => {
    expect(table.families["en:dairy"]).toEqual({ kind: "ohf", justification: "Milk, Cows or Goats, All types" });
    expect(table.families["en:cocoa-butter"].kind).toBe("exception");
    expect(table.families[ADDITIVES_FAMILY].kind).toBe("neutre");
  });

  it("compte les descendants retenus par famille", () => {
    // en:dairy, en:milk, en:skimmed-milk-powder, en:loop-a, en:loop-b
    expect(report.descendantsByFamily["en:dairy"]).toBe(5);
  });

  it("échoue sur un identifiant absent de la taxonomie", () => {
    expect(() =>
      computeLowOxalateIds(
        taxonomy,
        { ...rootsFile, roots: [{ id: "en:does-not-exist", kind: "ohf", justification: "x" }] },
        risky
      )
    ).toThrow(/en:does-not-exist/);
  });
});
