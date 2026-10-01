// Logique pure du générateur de la table des ingrédients à risque hérités de
// la taxonomie OFF (blé en paliers, chocolat, cacao). Règles :
// docs/superpowers/specs/2026-10-01-ble-chocolat-design.md, volet 1.
import { buildChildren, walk, type Taxonomy } from "./low-oxalate-generator.ts";

export type RiskyLevel = "modéré" | "élevé" | "très élevé";
export interface RiskyUpgrade { pattern: string; level: RiskyLevel; label: string; justification: string }
export interface RiskyFamily { id: string; root: string; label: string; level: RiskyLevel; justification: string; upgrades?: RiskyUpgrade[] }
export interface RiskyRootsFile { families: RiskyFamily[]; exclude: { id: string; justification: string }[] }
export interface RiskyEntry { level: RiskyLevel; label: string; family: string }
export interface RiskyOxalateTable { tiers: Record<string, { level: RiskyLevel; justification: string }>; ids: Record<string, RiskyEntry> }
export interface RiskyOxalateReport { countsByTier: Record<string, number>; excluded: string[]; skippedLow: string[]; skippedKnown: string[]; inTwoFamilies: string[] }

const RANK: Record<RiskyLevel, number> = { "modéré": 1, "élevé": 2, "très élevé": 3 };

export function computeRiskyOxalateIds(
  taxonomy: Taxonomy,
  rootsFile: RiskyRootsFile,
  lowIds: ReadonlySet<string>,
  knownOffIds: ReadonlySet<string>
): { table: RiskyOxalateTable; report: RiskyOxalateReport } {
  for (const id of [...rootsFile.families.map((f) => f.root), ...rootsFile.exclude.map((e) => e.id)]) {
    if (!Object.hasOwn(taxonomy, id)) throw new Error(`Identifiant absent de la taxonomie : ${id}`);
  }
  const families = rootsFile.families.map((family) => ({
    family,
    upgrades: (family.upgrades ?? []).map((upgrade) => {
      try {
        return { ...upgrade, regex: new RegExp(upgrade.pattern) };
      } catch {
        throw new Error(`Motif invalide pour ${family.id} : ${upgrade.pattern}`);
      }
    }),
  }));

  const children = buildChildren(taxonomy);
  const descendantsOrSelf = (id: string) => walk(id, (node) => children.get(node) ?? []);
  const excluded = new Set<string>();
  for (const entry of rootsFile.exclude) for (const id of descendantsOrSelf(entry.id)) excluded.add(id);

  const tiers: RiskyOxalateTable["tiers"] = {};
  const ids: Record<string, RiskyEntry> = {};
  const skippedLow = new Set<string>();
  const skippedKnown = new Set<string>();
  const inTwoFamilies = new Set<string>();

  for (const { family, upgrades } of families) {
    tiers[family.label] = { level: family.level, justification: family.justification };
    for (const upgrade of upgrades) tiers[upgrade.label] = { level: upgrade.level, justification: upgrade.justification };
    for (const id of descendantsOrSelf(family.root)) {
      if (excluded.has(id)) continue;
      if (lowIds.has(id)) { skippedLow.add(id); continue; }
      if (knownOffIds.has(id)) { skippedKnown.add(id); continue; }
      // Le dernier motif reconnu l'emporte (« son » est déclaré après « complet »).
      let entry: RiskyEntry = { level: family.level, label: family.label, family: family.id };
      for (const upgrade of upgrades) {
        if (upgrade.regex.test(id)) entry = { level: upgrade.level, label: upgrade.label, family: family.id };
      }
      const existing = ids[id];
      if (existing) {
        inTwoFamilies.add(id);
        if (RANK[existing.level] >= RANK[entry.level]) continue;
      }
      ids[id] = entry;
    }
  }

  const countsByTier: Record<string, number> = {};
  for (const entry of Object.values(ids)) countsByTier[entry.label] = (countsByTier[entry.label] ?? 0) + 1;
  return {
    table: { tiers, ids },
    report: {
      countsByTier,
      excluded: [...excluded].sort(),
      skippedLow: [...skippedLow].sort(),
      skippedKnown: [...skippedKnown].sort(),
      inTwoFamilies: [...inTwoFamilies].sort(),
    },
  };
}
