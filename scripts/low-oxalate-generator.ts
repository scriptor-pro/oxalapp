// Logique pure du générateur de la table des ingrédients pauvres en
// oxalate. Règles : docs/superpowers/specs/2026-10-01-ingredients-faibles-monde-ferme-design.md,
// volet 1. Aucune entrée-sortie ici (voir generate-low-oxalate-ingredients.ts).

export type Taxonomy = Record<string, { parents?: string[] }>;
export type RootKind = "ohf" | "neutre" | "forme-raffinée";
export type FamilyKind = RootKind | "exception";

export interface RootEntry {
  id: string;
  kind: RootKind;
  justification: string;
}

export interface ListEntry {
  id: string;
  justification: string;
}

export interface RootsFile {
  roots: RootEntry[];
  forceLow: ListEntry[];
  exclude: ListEntry[];
}

export interface LowOxalateTable {
  families: Record<string, { kind: FamilyKind; justification: string }>;
  // Identifiant OFF faible → clé de sa famille d'origine (racine,
  // forceLow ou ADDITIVES_FAMILY).
  ids: Record<string, string>;
}

export interface LowOxalateReport {
  descendantsByFamily: Record<string, number>;
  riskyConflicts: string[];
  excluded: string[];
  forcedLow: string[];
}

// Codes E tels que la taxonomie OFF les nomme : en:e330, en:e500ii,
// en:e160c, en:e1422, en:e322i…
export const ADDITIVE_ID = /^en:e\d{3,4}[a-z]?(?:i{1,3}|iv|v|vi)?$/;
export const ADDITIVES_FAMILY = "additifs";
const ADDITIVES_JUSTIFICATION =
  "additif alimentaire autorisé (code E) : molécule purifiée ou extrait utilisé à très faible dose";

// Parcours en profondeur avec ensemble de visités : la taxonomie OFF est un
// graphe orienté qui peut contenir des cycles.
function walk(start: string, next: (id: string) => readonly string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    stack.push(...next(id));
  }
  return seen;
}

function buildChildren(taxonomy: Taxonomy): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const [id, node] of Object.entries(taxonomy)) {
    for (const parent of node.parents ?? []) {
      const siblings = children.get(parent);
      if (siblings) siblings.push(id);
      else children.set(parent, [id]);
    }
  }
  return children;
}

export function computeLowOxalateIds(
  taxonomy: Taxonomy,
  rootsFile: RootsFile,
  riskyOffIds: ReadonlySet<string>
): { table: LowOxalateTable; report: LowOxalateReport } {
  for (const entry of [...rootsFile.roots, ...rootsFile.forceLow, ...rootsFile.exclude]) {
    if (!Object.hasOwn(taxonomy, entry.id)) {
      throw new Error(`Identifiant absent de la taxonomie : ${entry.id}`);
    }
  }

  const children = buildChildren(taxonomy);
  const descendantsOrSelf = (id: string) => walk(id, (node) => children.get(node) ?? []);
  const ancestorCache = new Map<string, Set<string>>();
  const ancestorsOrSelf = (id: string): Set<string> => {
    let ancestors = ancestorCache.get(id);
    if (!ancestors) {
      ancestors = walk(id, (node) => taxonomy[node]?.parents ?? []);
      ancestorCache.set(id, ancestors);
    }
    return ancestors;
  };
  const riskyAncestorsOf = (id: string) => [...ancestorsOrSelf(id)].filter((a) => riskyOffIds.has(a));

  // Règle 1 : exclude l'emporte sur tout, descendants compris.
  const excluded = new Set<string>();
  for (const entry of rootsFile.exclude) {
    for (const id of descendantsOrSelf(entry.id)) excluded.add(id);
  }

  const families: LowOxalateTable["families"] = {};
  const ids: Record<string, string> = {};
  const descendantsByFamily: Record<string, number> = {};
  const riskyConflicts = new Set<string>();
  const assign = (id: string, family: string) => {
    ids[id] = family;
    descendantsByFamily[family] = (descendantsByFamily[family] ?? 0) + 1;
  };

  // Règle 3 : familles écrites à la main, puis codes E (famille synthétique).
  const familyRoots = rootsFile.roots.map((root) => ({ rootId: root.id, family: root.id }));
  for (const root of rootsFile.roots) {
    families[root.id] = { kind: root.kind, justification: root.justification };
  }
  const additiveIds = Object.keys(taxonomy).filter((id) => ADDITIVE_ID.test(id));
  if (additiveIds.length > 0) {
    families[ADDITIVES_FAMILY] = { kind: "neutre", justification: ADDITIVES_JUSTIFICATION };
    for (const id of additiveIds) familyRoots.push({ rootId: id, family: ADDITIVES_FAMILY });
  }
  for (const { rootId, family } of familyRoots) {
    for (const id of descendantsOrSelf(rootId)) {
      if (excluded.has(id) || Object.hasOwn(ids, id)) continue;
      if (riskyAncestorsOf(id).length > 0) {
        riskyConflicts.add(id);
        continue;
      }
      assign(id, family);
    }
  }

  // Règle 2 : forceLow ne pardonne que les ancêtres à risque situés
  // au-dessus de l'identifiant forcé lui-même.
  const forcedLow: string[] = [];
  for (const entry of rootsFile.forceLow) {
    families[entry.id] = { kind: "exception", justification: entry.justification };
    const forgiven = ancestorsOrSelf(entry.id);
    for (const id of descendantsOrSelf(entry.id)) {
      if (excluded.has(id) || riskyOffIds.has(id) || Object.hasOwn(ids, id)) continue;
      if (!riskyAncestorsOf(id).every((a) => forgiven.has(a))) continue;
      assign(id, entry.id);
      forcedLow.push(id);
      riskyConflicts.delete(id);
    }
  }

  return {
    table: { families, ids },
    report: {
      descendantsByFamily,
      riskyConflicts: [...riskyConflicts].sort(),
      excluded: [...excluded].sort(),
      forcedLow: forcedLow.sort(),
    },
  };
}
