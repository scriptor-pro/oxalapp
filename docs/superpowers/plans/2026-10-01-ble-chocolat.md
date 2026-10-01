# Blé en trois paliers, chocolat et cacao, mention « niveau minimum » — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** reconnaître le blé (trois paliers par 100 g), le chocolat et le cacao, à la fois par
identifiant Open Food Facts (OFF) et dans le texte brut, et signaler quand un niveau n'est qu'un
minimum. Objectif chiffré : au plus 46 « non déterminable » sur les 200 produits de l'audit.

**Architecture :**
- Un second générateur, à logique pure, produit `src/data/risky-oxalate-ingredients.json`
  (identifiant → niveau et palier) à partir de familles de la taxonomie OFF.
- Le matcher consulte cette table après la table « faible ».
- Le texte brut reçoit de nouveaux mots-clés, ainsi qu'une exclusion « précédé de ».
- `ResultView` ajoute la ligne « Niveau minimum ».

**Tech Stack :** TypeScript, React 19, Vitest 4, Node 24 (exécute le TypeScript directement).

**Spec :** `docs/superpowers/specs/2026-10-01-ble-chocolat-design.md`

## Global Constraints

- Paliers du blé, par 100 g :
  - son → `très élevé` ;
  - complet → `élevé` ;
  - raffiné, pâtes comprises → `modéré`.
- Chocolat et cacao → `très élevé`. Le chocolat blanc est `faible` (OHF « Candy, White
  Chocolate » : 8 mg/100 g). Le beurre de cacao reste `faible`.
- Priorité dans le matcher :
  1. `offId` à risque exact ;
  2. table faible ;
  3. table à risque héritée ;
  4. mots-clés du texte.
- Jamais « blé » seul comme mot-clé.
- Texte affiché, mot pour mot : « Niveau minimum : ces ingrédients n'ont pas été reconnus et
  pourraient l'augmenter : … », seulement pour `modéré` et `élevé` avec des inconnus significatifs.
- Aucune nouvelle dépendance. User-Agent OFF :
  `oxalapp/0.1.0 (+https://github.com/scriptor-pro/oxalapp)`.
- `npx tsc -b`, `npx vitest run` et `npm run lint` doivent passer. Tout le travail se fait sur la
  branche `feature/ble-chocolat`.

## Review Focus

1. **Chocolat blanc dans un produit structuré** (`en:white-chocolate` à 30 %) : il doit sortir
   `faible`, et non « non déterminable ». Il faut l'ajouter aux familles faibles. Test en tâche 2
   (table) et en tâche 4 (matcher).
2. **« arôme chocolat »** dans un texte brut : un arôme n'est pas du chocolat. Aucune alerte
   attendue. Test en tâche 3.
3. **« farine de blé complète »** (féminin) dans un texte brut : `élevé`, et non `modéré`.
   Test en tâche 3.
4. **Inconnus tous négligeables** (moins de 2 %) avec un niveau `modéré` : pas de mention « Niveau
   minimum ». Test en tâche 5.
5. **« chocolat au lait »** et **« white chocolate »** dans un texte brut : le premier est
   `très élevé`, le second ne déclenche aucune alerte. Test en tâche 3.

---

### Task 1 : Logique pure du générateur à risque

**Files :**
- Modify : `scripts/low-oxalate-generator.ts` (exporter `walk` et `buildChildren`)
- Create : `scripts/risky-oxalate-generator.ts`
- Test : `scripts/risky-oxalate-generator.test.ts`

**Interfaces :**
- Produces :

```ts
export type RiskyLevel = "modéré" | "élevé" | "très élevé";
export interface RiskyUpgrade { pattern: string; level: RiskyLevel; label: string; justification: string }
export interface RiskyFamily { id: string; root: string; label: string; level: RiskyLevel; justification: string; upgrades?: RiskyUpgrade[] }
export interface RiskyRootsFile { families: RiskyFamily[]; exclude: { id: string; justification: string }[] }
export interface RiskyEntry { level: RiskyLevel; label: string; family: string }
export interface RiskyOxalateTable { tiers: Record<string, { level: RiskyLevel; justification: string }>; ids: Record<string, RiskyEntry> }
export interface RiskyOxalateReport { countsByTier: Record<string, number>; excluded: string[]; skippedLow: string[]; skippedKnown: string[]; inTwoFamilies: string[] }
export function computeRiskyOxalateIds(taxonomy: Taxonomy, rootsFile: RiskyRootsFile, lowIds: ReadonlySet<string>, knownOffIds: ReadonlySet<string>): { table: RiskyOxalateTable; report: RiskyOxalateReport };
```

- [ ] **Step 1 : Créer la branche et exporter les deux aides de parcours**

```bash
cd /home/Baudouin/Documents/Projets/oxalapp && git switch -c feature/ble-chocolat
sed -i 's/^function walk(/export function walk(/; s/^function buildChildren(/export function buildChildren(/' scripts/low-oxalate-generator.ts
grep -n "^export function" scripts/low-oxalate-generator.ts
```

Expected : les lignes `export function walk(`, `export function buildChildren(` et
`export function computeLowOxalateIds(`.

- [ ] **Step 2 : Écrire les tests** — créer `scripts/risky-oxalate-generator.test.ts` :

```ts
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
```

- [ ] **Step 3 : Vérifier l'échec** — Run : `npx vitest run scripts/risky-oxalate-generator.test.ts`.
  Expected : FAIL, module `./risky-oxalate-generator` introuvable.

- [ ] **Step 4 : Implémenter** — créer `scripts/risky-oxalate-generator.ts` :

```ts
// Logique pure du générateur de la table des ingrédients à risque hérités de
// la taxonomie OFF (blé en paliers, chocolat, cacao). Règles :
// docs/superpowers/specs/2026-10-01-ble-chocolat-design.md, volet 1.
import { buildChildren, walk, type Taxonomy } from "./low-oxalate-generator";

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
```

- [ ] **Step 5 : Vérifier** — Run :
  `npx vitest run scripts/risky-oxalate-generator.test.ts scripts/low-oxalate-generator.test.ts`.
  Expected : PASS (8 + 13 tests).

- [ ] **Step 6 : Commit**

```bash
git add scripts/low-oxalate-generator.ts scripts/risky-oxalate-generator.ts scripts/risky-oxalate-generator.test.ts
git commit -m "Add pure generator for risky ingredients inherited from the OFF taxonomy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : Familles, point d'entrée unique et tables générées

**Files :**
- Create : `scripts/risky-oxalate-roots.json`
- Rename : `scripts/generate-low-oxalate-ingredients.ts` → `scripts/generate-oxalate-tables.ts`
- Modify : `scripts/low-oxalate-roots.json` (ajout du chocolat blanc), `package.json`,
  `scripts/audit-non-determinable.test.ts` (commentaire de la commande)
- Create (généré) : `src/data/risky-oxalate-ingredients.json` ; régénère
  `src/data/low-oxalate-ingredients.json`

**Interfaces :**
- Consumes : `computeRiskyOxalateIds` (tâche 1) et `computeLowOxalateIds` (existant).
- Produces : `src/data/risky-oxalate-ingredients.json`, de forme
  `{ source, tiers, ids: Record<id, { level, label, family }> }`. Le chocolat blanc figure dans la
  table faible.

- [ ] **Step 1 : Créer `scripts/risky-oxalate-roots.json`**, avec exactement le contenu JSON du
  volet 1.1 de la spec : familles `wheat`, `chocolate` et `cocoa`, avec leurs motifs, libellés et
  justifications ; exclusion `en:white-chocolate`. Le recopier tel quel, sans les commentaires
  `jsonc`.

- [ ] **Step 2 : Ajouter le chocolat blanc aux familles faibles** — dans
  `scripts/low-oxalate-roots.json`, ajouter à la fin du tableau `roots` :

```json
    { "id": "en:white-chocolate", "kind": "ohf", "justification": "Candy, White Chocolate, bar or chips (8 mg/100 g)" }
```

- [ ] **Step 3 : Renommer le point d'entrée et produire les deux tables**

```bash
git mv scripts/generate-low-oxalate-ingredients.ts scripts/generate-oxalate-tables.ts
sed -i 's#"generate:low-oxalate": "node scripts/generate-low-oxalate-ingredients.ts"#"generate:oxalate-tables": "node scripts/generate-oxalate-tables.ts"#' package.json
grep -n "generate:" package.json
```

Puis, dans `scripts/generate-oxalate-tables.ts` :
- (a) remplacer l'en-tête par :

```ts
// Génère src/data/low-oxalate-ingredients.json et
// src/data/risky-oxalate-ingredients.json à partir de la taxonomie des
// ingrédients d'Open Food Facts, de scripts/low-oxalate-roots.json et de
// scripts/risky-oxalate-roots.json. Usage : npm run generate:oxalate-tables
```

- (b) ajouter l'import :

```ts
import { computeRiskyOxalateIds, type RiskyRootsFile } from "./risky-oxalate-generator.ts";
```

- (c) ajouter les chemins :

```ts
const RISKY_ROOTS_PATH = fileURLToPath(new URL("./risky-oxalate-roots.json", import.meta.url));
const RISKY_OUTPUT_PATH = fileURLToPath(new URL("../src/data/risky-oxalate-ingredients.json", import.meta.url));
```

- (d) ajouter à la fin du fichier :

```ts
const riskyRootsFile = JSON.parse(fs.readFileSync(RISKY_ROOTS_PATH, "utf8")) as RiskyRootsFile;
const risky = computeRiskyOxalateIds(taxonomy, riskyRootsFile, new Set(Object.keys(table.ids)), riskyOffIds);
fs.writeFileSync(
  RISKY_OUTPUT_PATH,
  `${JSON.stringify(
    {
      source: { ...output.source },
      tiers: risky.table.tiers,
      ids: Object.fromEntries(Object.entries(risky.table.ids).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    2
  )}\n`
);
console.log(`\nIngrédients à risque hérités : ${Object.keys(risky.table.ids).length}`);
console.log("Par palier :", risky.report.countsByTier);
console.log(`Laissés à la table faible : ${risky.report.skippedLow.join(" ")}`);
console.log(`Laissés aux offId connus : ${risky.report.skippedKnown.join(" ")}`);
console.log(`Exclus : ${risky.report.excluded.join(" ")}`);
console.log(`Dans deux familles : ${risky.report.inTwoFamilies.join(" ")}`);
console.log(`Paliers « blé » (raffiné) : ${Object.entries(risky.table.ids).filter(([, e]) => e.label === "blé").map(([id]) => id).join(" ")}`);
console.log(`Paliers « blé complet » : ${Object.entries(risky.table.ids).filter(([, e]) => e.label === "blé complet").map(([id]) => id).join(" ")}`);
```

Dans `scripts/audit-non-determinable.test.ts`, rien à changer (la commande d'audit est inchangée).

- [ ] **Step 4 : Générer et relire**

Run : `npm run generate:oxalate-tables`

Expected :
- le rapport de la table faible, dont environ 3 060 identifiants ;
- environ 190 ingrédients à risque, avec les paliers « blé » (~70), « blé complet » (~50),
  « chocolat » et « cacao » ;
- `en:cocoa-butter` et `en:white-chocolate` dans « Laissés à la table faible » ;
- `en:wheat`, `en:wheat-bran` et `en:cocoa` dans « Laissés aux offId connus ».

Relire la liste « blé complet ». Tout identifiant qui y figure à tort, ou qui manque, se corrige
dans le motif `upgrades`, puis on relance l'étape. Consigner les corrections dans le message de
commit.

- [ ] **Step 5 : Vérifier les identifiants clés**

```bash
node -e 'const {ids}=require("./src/data/risky-oxalate-ingredients.json"); const low=require("./src/data/low-oxalate-ingredients.json").ids; for (const id of ["en:wheat-flour","en:durum-wheat-semolina","en:whole-wheat-flour","en:wheat-germ","en:chocolate-chunk","en:milk-chocolate","en:cocoa-paste","en:fat-reduced-cocoa-powder"]) console.log(id, JSON.stringify(ids[id])); console.log("white-chocolate faible :", low["en:white-chocolate"], "| risque :", ids["en:white-chocolate"]); console.log("cocoa-butter risque :", ids["en:cocoa-butter"]);'
```

Expected :
- farine blanche et semoule → `modéré` ;
- farine complète et germe → `élevé` ;
- chocolat et cacao → `très élevé` ;
- chocolat blanc → famille faible, absent de la table à risque ;
- beurre de cacao absent de la table à risque.

- [ ] **Step 6 : Vérifier la suite et committer**

Run : `npx vitest run && npx tsc -b`. Expected : tout passe. Le matcher ne lit pas encore la
nouvelle table, mais la table faible a changé : le chocolat blanc y est ajouté.

```bash
git add scripts/ package.json src/data/low-oxalate-ingredients.json src/data/risky-oxalate-ingredients.json
git commit -m "Generate risky ingredient table for wheat tiers, chocolate and cocoa

Single entry point now writes both the low and the risky tables. White
chocolate joins the low families (OHF 8 mg/100 g).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : Mots-clés du texte brut et exclusion « précédé de »

**Files :**
- Modify : `src/data/known-ingredients.ts` (interface, entrées `cacao` et `cocoa`, nouvelles
  entrées)
- Modify : `src/lib/oxalate-matcher.ts` (`matchKnownIngredientsInText`)
- Test : `src/lib/oxalate-matcher.test.ts`

**Interfaces :**
- Produces : `KnownIngredient.excludePrecededBy?: string[]`.

- [ ] **Step 1 : Écrire les tests** — à la fin de `src/lib/oxalate-matcher.test.ts` :

```ts
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

  it("reconnaît toujours la pâte de cacao à côté du beurre de cacao", () => {
    const result = matchIngredients("sucre, pâte de cacao, beurre de cacao");
    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients.map((m) => m.labelText)).toEqual(["cacao"]);
  });
});
```

Remarque : « melkchocolade » est un mot unique ; sans limite de mot, il n'est pas reconnu par le
texte. C'est voulu et testé. La reconnaissance par identifiant (tâche 4) couvre les produits OFF
structurés.

Remplacer aussi le test existant « does not eliminate two distinct structured entries whose
keywords are in a substring relationship ». Le « beurre de cacao » n'y est plus une alerte : il
utilise maintenant « pâte de cacao ».

```ts
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
```

- [ ] **Step 2 : Vérifier l'échec** — Run : `npx vitest run src/lib/oxalate-matcher.test.ts`.
  Expected : les nouveaux tests échouent (farine non reconnue, chocolat non reconnu, beurre de
  cacao encore en alerte). Les anciens passent.

- [ ] **Step 3 : Implémenter**

(a) `src/data/known-ingredients.ts` : dans `interface KnownIngredient`, après `excludeFollowedBy`,
ajouter :

```ts
  // Words that must NOT immediately precede the keyword (e.g. "beurre de"
  // before "cacao", "white" before "chocolate").
  excludePrecededBy?: string[];
```

(b) Même fichier, compléter les deux entrées existantes :

```ts
  { keyword: "cacao", offId: "en:cocoa", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé", excludePrecededBy: ["beurre de"] },
  { keyword: "cocoa", offId: "en:cocoa", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé", excludeFollowedBy: ["butter"] },
```

(c) Même fichier, avant le `];` final :

```ts

  // Blé en trois paliers par 100 g et chocolat (spec
  // docs/superpowers/specs/2026-10-01-ble-chocolat-design.md). Pas
  // d'offId : la reconnaissance par identifiant passe par
  // src/data/risky-oxalate-ingredients.json. Jamais « blé » seul.
  { keyword: "farine de ble", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "farine de froment", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "semoule de ble", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "semoule de ble dur", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "ble dur", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "tarwebloem", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "wheat flour", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "durum wheat semolina", dbItem: "blé raffiné", level: "modéré" },
  { keyword: "farine de ble complet", dbItem: "blé complet", level: "élevé" },
  { keyword: "farine de ble complete", dbItem: "blé complet", level: "élevé" },
  { keyword: "farine complete de ble", dbItem: "blé complet", level: "élevé" },
  { keyword: "farine complete", dbItem: "blé complet", level: "élevé" },
  { keyword: "ble complet", dbItem: "blé complet", level: "élevé" },
  { keyword: "flocons de ble", dbItem: "blé complet", level: "élevé" },
  { keyword: "germe de ble", dbItem: "blé complet", level: "élevé" },
  { keyword: "volkoren tarwemeel", dbItem: "blé complet", level: "élevé" },
  { keyword: "whole wheat flour", dbItem: "blé complet", level: "élevé" },
  { keyword: "wholemeal flour", dbItem: "blé complet", level: "élevé" },
  { keyword: "wheat germ", dbItem: "blé complet", level: "élevé" },
  { keyword: "chocolat", dbItem: "chocolat", level: "très élevé", excludeFollowedBy: ["blanc"], excludePrecededBy: ["arome"] },
  { keyword: "chocolade", dbItem: "chocolat", level: "très élevé", excludePrecededBy: ["witte"] },
  { keyword: "chocolate", dbItem: "chocolat", level: "très élevé", excludePrecededBy: ["white"], excludeFollowedBy: ["flavour", "flavouring", "flavor"] },
```

(d) `src/lib/oxalate-matcher.ts`, dans `matchKnownIngredientsInText` : juste avant
`const keywordPattern = …`, ajouter :

```ts
    // Lookbehind négatif : le mot-clé ne compte pas s'il suit l'un de ces
    // mots (« beurre de cacao », « white chocolate », « arôme chocolat »).
    const exclusionLookbehind = known.excludePrecededBy?.length
      ? `(?<!(?:${known.excludePrecededBy.map((w) => escapeRegex(normalize(w))).join("|")}) )`
      : "";
```

Puis remplacer la ligne `const keywordPattern = new RegExp(...)` par :

```ts
    const keywordPattern = new RegExp(
      `${exclusionLookbehind}(?:\\b${escapedKeyword}${exclusionLookahead}s?\\b${pluralAlternative})`
    );
```

- [ ] **Step 4 : Vérifier** — Run : `npx vitest run src/lib/oxalate-matcher.test.ts && npx tsc -b`.
  Expected : PASS, `tsc -b` propre.

- [ ] **Step 5 : Commit**

```bash
git add src/data/known-ingredients.ts src/lib/oxalate-matcher.ts src/lib/oxalate-matcher.test.ts
git commit -m "Recognize wheat tiers and chocolate in raw ingredient text

Adds precise FR/NL/EN wheat flour and chocolate keywords (never bare
\"blé\") and an excludePrecededBy option, so cocoa butter, white
chocolate and chocolate flavouring no longer raise alerts in raw text.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : Matcher — table à risque héritée pour les ingrédients structurés

**Files :**
- Modify : `src/lib/oxalate-matcher.ts`
- Test : `src/lib/oxalate-matcher.test.ts`, `src/lib/oxalate-matcher.fixtures.test.ts`

**Interfaces :**
- Consumes : `src/data/risky-oxalate-ingredients.json` (tâche 2), champ `ids`.

- [ ] **Step 1 : Écrire les tests** — à la fin de `src/lib/oxalate-matcher.test.ts` :

```ts
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

  it("reconnaît la pâte de cacao étiquetée en allemand par son identifiant", () => {
    const result = matchStructuredIngredients([{ text: "Kakaomasse", percentEstimate: 60, offId: "en:cocoa-paste" }, { text: "Zucker", percentEstimate: 40, offId: "en:sugar" }]);
    expect(result.level).toBe("très élevé");
    expect(result.matchedIngredients[0].labelText).toBe("Kakaomasse");
  });
});
```

Puis remplacer, dans les tests existants du `describe("matchStructuredIngredients — monde fermé (spec 2026-10-01)")`,
la farine de blé utilisée comme **inconnu** par de la farine de seigle, qui reste inconnue :
- dans « reste non déterminable et liste l'inconnu présent à 2 % ou plus », « garde un niveau
  élevé comme minimum malgré un inconnu significatif » et « ne conclut plus faible quand une
  trace d'ingrédient à risque masque un inconnu majeur (règle A) », remplacer chaque
  `offId: "en:wheat-flour"` par `offId: "en:rye-flour"` ;
- remplacer les textes `"Farine de BLÉ"` et `"Farine de blé"` / `"farine de blé"` de ces trois
  tests par `"Farine de seigle"` ;
- dans le même test, remplacer `toEqual(["en:wheat-flour"])` par `toEqual(["en:rye-flour"])`.

Commande de contrôle :
`grep -n "en:wheat-flour" src/lib/oxalate-matcher.test.ts`. Expected : seulement les nouveaux
tests de ce `describe`.

Dans `src/lib/oxalate-matcher.fixtures.test.ts`, mettre à jour deux attendus :

```ts
  "5410126806069": { level: "modéré", unknownTexts: [] }, // Lotus Biscoff : farine de blé raffinée
  "4056489471264": { level: "très élevé", unknownTexts: [] }, // Edelbitter 90 % : pâte et poudre de cacao
```

et le commentaire au-dessus de `EXPECTED` : « Niveaux attendus avec les tables du 2026-10-01
(chantiers ingrédients faibles et blé/chocolat). »

- [ ] **Step 2 : Vérifier l'échec** — Run :
  `npx vitest run src/lib/oxalate-matcher.test.ts src/lib/oxalate-matcher.fixtures.test.ts`.
  Expected : FAIL sur les nouveaux tests par identifiant et sur Lotus et Edelbitter, qui sont
  encore « non déterminable ».

- [ ] **Step 3 : Implémenter** dans `src/lib/oxalate-matcher.ts` :

(a) sous l'import de la table faible :

```ts
import riskyOxalateTable from "../data/risky-oxalate-ingredients.json";
```

(b) après `isLowOxalateId` :

```ts
// Ingrédients à risque hérités de la taxonomie OFF (blé en paliers,
// chocolat, cacao), générés par scripts/generate-oxalate-tables.ts.
const RISKY_INHERITED_IDS = riskyOxalateTable.ids as Record<
  string,
  { level: OxalateLevel; label: string; family: string }
>;

function matchInheritedRiskyId(offId: string | null | undefined): MatchedIngredient | null {
  if (!offId || !Object.hasOwn(RISKY_INHERITED_IDS, offId)) return null;
  const entry = RISKY_INHERITED_IDS[offId];
  return { ingredientText: entry.label, dbItem: entry.label, level: entry.level };
}
```

(c) dans `classifyStructuredIngredient`, juste après
`if (isLowOxalateId(ingredient.offId)) return { kind: "low" };` :

```ts
  const inherited = matchInheritedRiskyId(ingredient.offId);
  if (inherited) {
    return { kind: "risky", matches: [labelText ? { ...inherited, labelText } : inherited] };
  }
```

- [ ] **Step 4 : Vérifier** — Run :
  `npx vitest run src/lib && npx tsc -b`. Expected : PASS, `tsc -b` propre.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/oxalate-matcher.ts src/lib/oxalate-matcher.test.ts src/lib/oxalate-matcher.fixtures.test.ts
git commit -m "Match structured wheat, chocolate and cocoa via the inherited risky table

Wheat flour is modéré, whole wheat élevé, chocolate and cocoa très
élevé; cocoa butter and white chocolate stay faible. Tests that used
wheat flour as an unknown ingredient now use rye flour; Lotus Biscoff
becomes modéré and Edelbitter 90% très élevé.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : `ResultView` — mention « niveau minimum »

**Files :**
- Modify : `src/components/ResultView.tsx`
- Test : `src/components/ResultView.test.tsx`

- [ ] **Step 1 : Écrire et adapter les tests**

(a) Remplacer la farine de blé utilisée comme inconnu dans deux tests existants :
- « shows both the reduced-contribution note and the unknown ingredients when flour is
  unrecognized » : `{ text: "Farine de blé", percentEstimate: 70, offId: "en:wheat-flour" }` →
  `{ text: "Farine de seigle", percentEstimate: 70, offId: "en:rye-flour" }` ; `ingredientsText`
  `"Farine de blé, noisettes 0.8%, sucre"` → `"Farine de seigle, noisettes 0.8%, sucre"` ; attendu
  `"Ingrédients non reconnus : Farine de seigle (70%)."` ;
- « lists unknown ingredients with rounded percentages and omits unknown proportions » :
  `{ text: "Farine de BLÉ", percentEstimate: 50.15, offId: "en:wheat-flour" }` →
  `{ text: "Farine de SEIGLE", percentEstimate: 50.15, offId: "en:rye-flour" }` ; attendu
  `"Ingrédients non reconnus : Farine de SEIGLE (50%), arôme de malt."`.

(b) Ajouter à la fin du fichier :

```ts
describe("ResultView minimum level notice", () => {
  const NOTICE = /Niveau minimum : ces ingrédients n'ont pas été reconnus et pourraient l'augmenter/;

  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({ create: vi.fn().mockResolvedValue({ id: "scan1" }) });
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  function mockStructuredProduct(structuredIngredients: { text: string; percentEstimate: number | null; offId?: string | null }[]) {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000", rawCode: "0000000000000", productName: "Produit test",
      ingredientsText: structuredIngredients.map((i) => i.text).join(", "),
      structuredIngredients, imageUrl: null, lang: "fr", sources: ["open_food_facts"],
    });
  }

  it("flags a modéré level as a minimum when significant ingredients are unknown", async () => {
    mockStructuredProduct([
      { text: "farine de blé", percentEstimate: 55, offId: "en:wheat-flour" },
      { text: "farine de seigle", percentEstimate: 40, offId: "en:rye-flour" },
      { text: "sucre", percentEstimate: 5, offId: "en:sugar" },
    ]);
    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);
    expect(
      await screen.findByText("Niveau minimum : ces ingrédients n'ont pas été reconnus et pourraient l'augmenter : farine de seigle (40%).")
    ).toBeInTheDocument();
  });

  it("flags an élevé level as a minimum too", async () => {
    mockStructuredProduct([
      { text: "farine complète", percentEstimate: 60, offId: "en:whole-wheat-flour" },
      { text: "farine de seigle", percentEstimate: 40, offId: "en:rye-flour" },
    ]);
    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);
    expect(await screen.findByText(NOTICE)).toBeInTheDocument();
  });

  it("does not flag très élevé, which cannot be exceeded", async () => {
    mockStructuredProduct([
      { text: "pépites de chocolat", percentEstimate: 30, offId: "en:chocolate-chunk" },
      { text: "farine de seigle", percentEstimate: 70, offId: "en:rye-flour" },
    ]);
    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);
    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("does not flag a level whose unknown ingredients are all negligible", async () => {
    mockStructuredProduct([
      { text: "farine de blé", percentEstimate: 98.5, offId: "en:wheat-flour" },
      { text: "ingrédient mystère", percentEstimate: 1.5, offId: "en:mystery" },
    ]);
    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);
    expect(await screen.findByText(/modéré/i)).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Vérifier l'échec** — Run : `npx vitest run src/components/ResultView.test.tsx`.
  Expected : FAIL sur les deux premiers nouveaux tests (mention absente). Les deux derniers
  passent déjà, car ils protègent un comportement existant.

- [ ] **Step 3 : Implémenter** — dans `src/components/ResultView.tsx`, juste après le bloc
  `{state.result.level === "faible" && ( … )}`, ajouter :

```tsx
        {(state.result.level === "modéré" || state.result.level === "élevé") &&
          state.result.unknownIngredients.length > 0 && (
            <p className="ingredient-line">
              Niveau minimum : ces ingrédients n'ont pas été reconnus et pourraient
              l'augmenter : {formatUnknownIngredients(state.result.unknownIngredients)}.
            </p>
          )}
```

- [ ] **Step 4 : Vérifier** — Run :
  `npx vitest run && npx tsc -b && npm run lint`. Expected : tout passe, sans nouvelle erreur de
  lint.

- [ ] **Step 5 : Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Flag modéré and élevé levels as a minimum when ingredients stay unknown

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : Mesure et vérification finale

- [ ] **Step 1 : Audit** — Run :
  `OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts --reporter=default`.
  Expected :
  - `Non déterminable : N/200`, avec **N ≤ 46** ;
  - la liste des produits qui changent de niveau par rapport à la référence enregistrée le
    2026-10-01.

  Relire en particulier :
  - les produits qui passent à « très élevé » grâce au chocolat (Chocapic, Granola, goûters aux
    pépites) ;
  - les pâtes et pains, qui doivent être « modéré » ;
  - tout produit dont le niveau baisse : chaque baisse doit être expliquée, et la cause corrigée le
    cas échéant.

- [ ] **Step 2 : Vérification complète** — Run : `npx vitest run && npx tsc -b && npm run lint`.
  Expected : tout passe.

- [ ] **Step 3 : Résumé à l'utilisateur**, sans fusionner ni pousser :
  - taux avant/après ;
  - produits qui changent de niveau ;
  - répartition « blé » et « blé complet » du rapport du générateur ;
  - décisions prises en cours de route.

  Proposer ensuite la fusion (superpowers:finishing-a-development-branch).
