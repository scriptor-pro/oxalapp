import { describe, expect, it } from "vitest";
import type { Taxonomy } from "./low-oxalate-generator";
import { computeRiskyOxalateIds, type RiskyRootsFile } from "./risky-oxalate-generator";

const taxonomy: Taxonomy = {
  "en:wheat": {},
  "en:wheat-flour": { parents: ["en:wheat"] },
  "en:soft-wheat-flour": { parents: ["en:wheat-flour"] },
  "en:whole-wheat-flour": { parents: ["en:wheat-flour"] },
  "en:wheat-bran-flakes": { parents: ["en:wheat"] },
  "en:durum-wheat-semolina": { parents: ["en:wheat"] },
  "en:wheat-starch": { parents: ["en:wheat"] },
  "en:chocolate": {},
  "en:chocolate-chunk": { parents: ["en:chocolate"] },
  "en:white-chocolate": { parents: ["en:chocolate"] },
  "en:white-chocolate-chips": { parents: ["en:white-chocolate"] },
  "en:cocoa": {},
  "en:cocoa-paste": { parents: ["en:cocoa"] },
  "en:cocoa-butter": { parents: ["en:cocoa"] },
  "en:chocolate-cocoa-mix": { parents: ["en:chocolate", "en:cocoa"] },
};

const rootsFile: RiskyRootsFile = {
  families: [
    {
      id: "wheat", root: "en:wheat", label: "blé", level: "modéré", justification: "raffiné",
      upgrades: [
        { pattern: "whole|flakes", level: "élevé", label: "blé complet", justification: "complet" },
        { pattern: "bran", level: "très élevé", label: "son de blé", justification: "son" },
      ],
    },
    { id: "chocolate", root: "en:chocolate", label: "chocolat", level: "très élevé", justification: "chocolat" },
    { id: "cocoa", root: "en:cocoa", label: "cacao", level: "très élevé", justification: "cacao" },
  ],
  exclude: [{ id: "en:white-chocolate", justification: "faible" }],
};

const { table, report } = computeRiskyOxalateIds(
  taxonomy, rootsFile, new Set(["en:wheat-starch", "en:cocoa-butter"]), new Set(["en:wheat", "en:cocoa"])
);

describe("computeRiskyOxalateIds", () => {
  it("donne le niveau de la famille aux descendants raffinés", () => {
    expect(table.ids["en:wheat-flour"]).toEqual({ level: "modéré", label: "blé", family: "wheat" });
    expect(table.ids["en:soft-wheat-flour"].level).toBe("modéré");
    expect(table.ids["en:durum-wheat-semolina"].level).toBe("modéré");
  });

  it("relève les formes complètes", () => {
    expect(table.ids["en:whole-wheat-flour"]).toEqual({ level: "élevé", label: "blé complet", family: "wheat" });
  });

  it("applique le dernier motif reconnu (son après complet)", () => {
    expect(table.ids["en:wheat-bran-flakes"].label).toBe("son de blé");
    expect(table.ids["en:wheat-bran-flakes"].level).toBe("très élevé");
  });

  it("exclut le chocolat blanc et ses descendants", () => {
    expect(table.ids["en:white-chocolate"]).toBeUndefined();
    expect(table.ids["en:white-chocolate-chips"]).toBeUndefined();
    expect(report.excluded).toContain("en:white-chocolate-chips");
  });

  it("laisse la priorité à la table faible et aux offId connus", () => {
    expect(table.ids["en:wheat-starch"]).toBeUndefined();
    expect(table.ids["en:cocoa-butter"]).toBeUndefined();
    expect(table.ids["en:wheat"]).toBeUndefined();
    expect(report.skippedLow).toEqual(["en:cocoa-butter", "en:wheat-starch"]);
    expect(report.skippedKnown).toEqual(["en:cocoa", "en:wheat"]);
  });

  it("garde le niveau le plus élevé pour un identifiant de deux familles et le signale", () => {
    expect(table.ids["en:chocolate-cocoa-mix"].level).toBe("très élevé");
    expect(report.inTwoFamilies).toEqual(["en:chocolate-cocoa-mix"]);
  });

  it("décrit chaque palier et compte les identifiants par palier", () => {
    expect(table.tiers["blé complet"]).toEqual({ level: "élevé", justification: "complet" });
    expect(report.countsByTier["blé"]).toBe(3);
  });

  it("échoue sur une racine absente ou un motif invalide", () => {
    expect(() => computeRiskyOxalateIds(taxonomy, { ...rootsFile, families: [{ ...rootsFile.families[1], root: "en:nope" }] }, new Set(), new Set())).toThrow(/en:nope/);
    expect(() => computeRiskyOxalateIds(taxonomy, { families: [{ ...rootsFile.families[0], upgrades: [{ pattern: "(", level: "élevé", label: "x", justification: "x" }] }], exclude: [] }, new Set(), new Set())).toThrow(/Motif invalide/);
  });
});
