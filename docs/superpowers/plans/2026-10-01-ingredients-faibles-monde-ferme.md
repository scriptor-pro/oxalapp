# Ingrédients faibles en monde fermé — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** faire passer le taux de « non déterminable » d'environ 57 % à
45 % au plus. Pour cela : reconnaître les ingrédients pauvres en oxalate
(table générée depuis la taxonomie Open Food Facts), conclure « faible »
seulement quand tous les ingrédients significatifs sont reconnus, et
ignorer les inconnus présents à moins de 2 %.

**Architecture :**
- Un générateur Node (`scripts/`) lit la taxonomie OFF et une liste de
  familles écrite à la main. Il produit `src/data/low-oxalate-ingredients.json`,
  versionné dans le dépôt.
- `matchStructuredIngredients` consulte cette table, applique la règle
  stricte et expose `unknownIngredients`.
- `ResultView` affiche une justification pour « faible » et la liste des
  inconnus pour « non déterminable ».
- Un audit Vitest, lancé à la demande, mesure l'effet avant/après sur
  200 produits réels.

**Tech Stack :** TypeScript, React 19, Vitest 4 (jsdom), Node 24 (exécution
directe du TypeScript), API publique Open Food Facts.

**Spec :** `docs/superpowers/specs/2026-10-01-ingredients-faibles-monde-ferme-design.md`

## Global Constraints

- Aucune nouvelle dépendance npm.
- User-Agent des requêtes OFF :
  `oxalapp/0.1.0 (+https://github.com/scriptor-pro/oxalapp)`. Jamais
  d'adresse e-mail.
- Seuils : inconnu ignoré si son pourcentage est dans [0, 2) ; garde-fou
  au-delà de 5 % d'inconnus ignorés au total ; un pourcentage hors de
  [0, 100] (ou non fini) devient `null`.
- `npx tsc -b` doit passer : c'est ce que lance `scripts/build-apk.sh`, et
  il traite les imports inutilisés comme des erreurs (TS6133).
  `npx tsc --noEmit` ne suffit pas.
- Textes affichés, mot pour mot :
  - « Tous les ingrédients présents à 2 % ou plus sont reconnus comme
    pauvres en oxalate. »
  - « Ingrédients non reconnus : … »
  - avertissement : « Estimation indicative — les valeurs d'oxalate varient
    selon la variété, le sol, la cuisson, etc. Ce niveau est déduit de la
    liste d'ingrédients, pas d'une quantité mesurée dans ce produit
    précis. »
- Le texte brut (`matchIngredients`) garde son comportement. Il renvoie
  toujours `unknownIngredients: []`.
- Travail sur la branche `feature/ingredients-faibles`, jamais directement
  sur `main`.

## Review Focus

1. **Ingrédient inconnu sans texte** (`text: ""`, cas rare côté OFF) :
   l'affichage ne doit pas produire « Ingrédients non reconnus :
   (50%) ». On affiche l'identifiant OFF, ou « ingrédient sans nom ».
   Test dans la tâche 7.
2. **Pourcentage `NaN` ou `Infinity`** : traité comme inconnu (`null`),
   jamais comme une trace. Test dans la tâche 5.
3. **Inconnu en double** dans la liste OFF (par exemple
   `en:wholemeal-rye-flour` deux fois dans un Knäckebrot) : un seul nom
   affiché, à sa première occurrence. Test dans la tâche 7.
4. **Liste faite uniquement de minuscules inconnus** (fiches OFF mal
   découpées, comme celles des eaux minérales) : « non déterminable », avec
   `unknownIngredients` vide et le message `no-match`. Il ne faut ni
   « faible » ni message vide. Tests dans les tâches 5 et 7.
5. **Ingrédient à risque rétrogradé plus inconnu significatif** : les deux
   informations s'affichent (« contribution réduite » et « Ingrédients non
   reconnus »), et le niveau est « non déterminable ». Test dans la
   tâche 7.

---

### Task 1 : Outil d'audit et mesure de référence

**Files :**
- Create : `scripts/audit-non-determinable.test.ts`
- Modify : `.gitignore` (ajout de `.cache/`)

**Interfaces :**
- Consumes : `matchIngredients`, `matchStructuredIngredients` et
  `MatchResult`, depuis `src/lib/oxalate-matcher.ts` (existants).
- Produces : `.cache/off-audit-sample.json` (échantillon brut) et
  `.cache/off-audit-baseline.json` (`Record<code, niveau>`), relus par la
  tâche 8.

- [ ] **Step 1 : Créer la branche**

```bash
cd /home/Baudouin/Documents/Projets/oxalapp
git switch -c feature/ingredients-faibles
```

- [ ] **Step 2 : Ignorer le cache**

Ajouter à la fin de `.gitignore` :

```
# Échantillons et mesures de l'audit « non déterminable » (scripts/audit-non-determinable.test.ts)
.cache/
```

- [ ] **Step 3 : Écrire l'audit**

Créer `scripts/audit-non-determinable.test.ts` :

```ts
// @vitest-environment node
// Mesure à la demande du taux de « non déterminable » sur les produits
// belges les plus scannés d'Open Food Facts. Désactivé par défaut :
//   OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts
// L'échantillon est mis en cache dans .cache/ (ignoré par git) pour que
// les mesures avant/après portent sur les mêmes produits. Le premier
// lancement enregistre aussi les niveaux de référence ; les suivants
// affichent chaque produit dont le niveau a changé.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  matchIngredients,
  matchStructuredIngredients,
  type MatchResult,
} from "../src/lib/oxalate-matcher";

const CACHE_DIR = fileURLToPath(new URL("../.cache/", import.meta.url));
const SAMPLE_PATH = `${CACHE_DIR}off-audit-sample.json`;
const BASELINE_PATH = `${CACHE_DIR}off-audit-baseline.json`;
const PAGES = 2;
const PAGE_SIZE = 100;
const USER_AGENT = "oxalapp/0.1.0 (+https://github.com/scriptor-pro/oxalapp)";

interface OffSearchIngredient {
  id?: string;
  text?: string;
  percent_estimate?: number;
}

interface OffSearchProduct {
  code: string;
  product_name?: string;
  ingredients_text?: string;
  ingredients?: OffSearchIngredient[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// L'API de recherche OFF est limitée à 10 requêtes par minute et renvoie
// régulièrement une page HTML 503 de maintenance : on réessaie en
// espaçant de plus en plus.
async function fetchPage(page: number): Promise<OffSearchProduct[]> {
  const url =
    "https://world.openfoodfacts.org/api/v2/search" +
    `?countries_tags_en=belgium&sort_by=unique_scans_n&page_size=${PAGE_SIZE}&page=${page}` +
    "&fields=code,product_name,lang,ingredients_text,ingredients";
  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) {
      try {
        const data = (await response.json()) as { products: OffSearchProduct[] };
        return data.products;
      } catch {
        // Page HTML au lieu de JSON : on réessaie.
      }
    }
    await sleep(15_000 * attempt);
  }
  throw new Error(`Open Food Facts indisponible pour la page ${page}`);
}

async function loadSample(): Promise<OffSearchProduct[]> {
  if (fs.existsSync(SAMPLE_PATH)) {
    return JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8")) as OffSearchProduct[];
  }
  const products: OffSearchProduct[] = [];
  for (let page = 1; page <= PAGES; page++) {
    if (page > 1) await sleep(10_000);
    products.push(...(await fetchPage(page)));
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(SAMPLE_PATH, JSON.stringify(products));
  return products;
}

// Même choix que ResultView : ingrédients structurés s'il y en a, texte
// brut sinon.
function matchProduct(product: OffSearchProduct): MatchResult {
  const structured = (product.ingredients ?? []).map((ingredient) => ({
    text: ingredient.text ?? "",
    percentEstimate: ingredient.percent_estimate ?? null,
    offId: ingredient.id ?? null,
  }));
  return structured.length > 0
    ? matchStructuredIngredients(structured)
    : matchIngredients(product.ingredients_text ?? "");
}

describe.runIf(process.env.OXA_AUDIT === "1")("audit « non déterminable »", () => {
  it("mesure le taux sur l'échantillon et compare à la référence", async () => {
    const products = await loadSample();
    const results = new Map(products.map((p) => [p.code, matchProduct(p)]));

    const counts: Record<string, number> = {};
    for (const result of results.values()) {
      counts[result.level] = (counts[result.level] ?? 0) + 1;
    }
    const undetermined = counts["non déterminable"] ?? 0;
    console.log(
      `Non déterminable : ${undetermined}/${products.length} ` +
        `(${Math.round((100 * undetermined) / products.length)} %)`
    );
    console.log("Répartition :", counts);

    const levels = Object.fromEntries(
      [...results].map(([code, result]) => [code, result.level])
    );
    if (!fs.existsSync(BASELINE_PATH)) {
      fs.writeFileSync(BASELINE_PATH, JSON.stringify(levels, null, 2));
      console.log(`Référence enregistrée dans ${BASELINE_PATH}`);
    } else {
      const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) as Record<string, string>;
      const changes = products
        .filter((p) => baseline[p.code] !== undefined && baseline[p.code] !== levels[p.code])
        .map((p) => `  ${baseline[p.code]} → ${levels[p.code]} | ${p.product_name ?? "?"} (${p.code})`)
        .sort();
      console.log(`Produits dont le niveau change (${changes.length}) :\n${changes.join("\n")}`);
    }

    expect(products.length).toBeGreaterThan(0);
  }, 600_000);
});
```

- [ ] **Step 4 : Vérifier que l'audit est inactif par défaut**

Run : `npx vitest run scripts/audit-non-determinable.test.ts`
Expected : 1 test ignoré (`skipped`), aucun échec, aucune requête réseau.

- [ ] **Step 5 : Enregistrer la référence (comportement actuel)**

Run : `OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts`
Expected :
- PASS, avec une ligne `Non déterminable : N/200 (≈57 %)` et
  `Référence enregistrée` ;
- les fichiers `.cache/off-audit-sample.json` et
  `.cache/off-audit-baseline.json` existent ;
- noter N dans le résumé de fin de chantier.

Si OFF reste indisponible après les nouvelles tentatives, relancer plus
tard. Ne pas continuer sans référence.

- [ ] **Step 6 : Commit**

```bash
git add .gitignore scripts/audit-non-determinable.test.ts
git commit -m "Add on-demand non déterminable audit over popular Belgian OFF products

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : Extraire `KNOWN_INGREDIENTS` dans `src/data/known-ingredients.ts`

Déplacement pur, sans changement de contenu (spec 2.1). Le générateur de la
tâche 4 doit pouvoir lire la liste des ingrédients à risque sans charger
le matcher.

**Files :**
- Create : `src/data/known-ingredients.ts`
- Modify : `src/lib/oxalate-matcher.ts` (retrait des lignes 3, 19-38 et
  40-385 actuelles ; ajout des imports et réexports)

**Interfaces :**
- Produces : `src/data/known-ingredients.ts` exporte
  `type OxalateLevel`, `interface KnownIngredient` et
  `const KNOWN_INGREDIENTS: KnownIngredient[]`. Ce fichier n'importe
  rien.
- `src/lib/oxalate-matcher.ts` les réexporte à l'identique (même nom) :
  aucun autre fichier ne change ses imports.

- [ ] **Step 1 : Effectuer le déplacement par script (repères textuels)**

```bash
cd /home/Baudouin/Documents/Projets/oxalapp
python3 - <<'EOF'
import re
from pathlib import Path

matcher = Path("src/lib/oxalate-matcher.ts")
lines = matcher.read_text().split("\n")

def find(predicate, start=0):
    for i in range(start, len(lines)):
        if predicate(lines[i]):
            return i
    raise SystemExit("repère introuvable")

level_line = find(lambda l: l.startswith("export type OxalateLevel ="))
iface_start = find(lambda l: l.startswith("export interface KnownIngredient {"))
iface_end = find(lambda l: l == "}", iface_start)
array_start = find(lambda l: l.startswith("// Curated high-signal keywords."))
array_end = find(lambda l: l == "];", array_start)

header = [
    "// Ingrédients à risque connus : mots-clés et identifiants de la taxonomie",
    "// Open Food Facts. Extrait de src/lib/oxalate-matcher.ts pour que",
    "// scripts/generate-low-oxalate-ingredients.ts puisse le lire sans charger",
    "// le matcher (qui importe la table générée). Réexporté par le matcher.",
    "",
]
moved = (
    [lines[level_line], ""]
    + lines[iface_start : iface_end + 1]
    + [""]
    + lines[array_start : array_end + 1]
)
Path("src/data/known-ingredients.ts").write_text("\n".join(header + moved) + "\n")

removed = {level_line, *range(iface_start, iface_end + 1), *range(array_start, array_end + 1)}
kept = [l for i, l in enumerate(lines) if i not in removed]
imports = [
    'import { KNOWN_INGREDIENTS } from "../data/known-ingredients";',
    'import type { KnownIngredient, OxalateLevel } from "../data/known-ingredients";',
    "",
    "export { KNOWN_INGREDIENTS };",
    "export type { KnownIngredient, OxalateLevel };",
]
kept = kept[:1] + imports + kept[1:]
matcher.write_text(re.sub(r"\n{3,}", "\n\n", "\n".join(kept)))
EOF
head -12 src/lib/oxalate-matcher.ts
```

Expected : le haut du matcher ressemble à :

```ts
import type { StructuredIngredient } from "./off-client";
import { KNOWN_INGREDIENTS } from "../data/known-ingredients";
import type { KnownIngredient, OxalateLevel } from "../data/known-ingredients";

export { KNOWN_INGREDIENTS };
export type { KnownIngredient, OxalateLevel };

export type MatchLevel = OxalateLevel | "non déterminable";
```

`src/data/known-ingredients.ts` commence par l'en-tête, puis
`export type OxalateLevel`, `export interface KnownIngredient { … }`, et
enfin le commentaire « Curated high-signal keywords » suivi du tableau
complet.

- [ ] **Step 2 : Vérifier que rien n'a changé de comportement**

Run : `npx vitest run && npx tsc -b`
Expected : tous les tests passent, avec le même nombre qu'avant la tâche ;
`tsc -b` ne produit aucune sortie.

- [ ] **Step 3 : Vérifier que Node peut lire le fichier seul**

Run : `node -e 'import("./src/data/known-ingredients.ts").then(m => console.log(m.KNOWN_INGREDIENTS.length))'`
Expected : un nombre (environ 300), sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/data/known-ingredients.ts src/lib/oxalate-matcher.ts
git commit -m "Move KNOWN_INGREDIENTS into src/data/known-ingredients.ts

Pure move, re-exported by oxalate-matcher.ts so existing imports are
unchanged. Lets the low-oxalate generator read the risky offIds without
loading the matcher, which will import the generated table.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : Logique pure du générateur

**Files :**
- Create : `scripts/low-oxalate-generator.ts`
- Test : `scripts/low-oxalate-generator.test.ts`

**Interfaces :**
- Produces (utilisé par la tâche 4) :

```ts
export type Taxonomy = Record<string, { parents?: string[] }>;
export type RootKind = "ohf" | "neutre" | "forme-raffinée";
export type FamilyKind = RootKind | "exception";
export interface RootEntry { id: string; kind: RootKind; justification: string }
export interface ListEntry { id: string; justification: string }
export interface RootsFile { roots: RootEntry[]; forceLow: ListEntry[]; exclude: ListEntry[] }
export interface LowOxalateTable {
  families: Record<string, { kind: FamilyKind; justification: string }>;
  ids: Record<string, string>; // identifiant faible → clé de famille
}
export interface LowOxalateReport {
  descendantsByFamily: Record<string, number>;
  riskyConflicts: string[]; // écartés par un ancêtre à risque (triés)
  excluded: string[];       // écartés par `exclude`, descendants compris (triés)
  forcedLow: string[];      // rendus faibles par `forceLow` (triés)
}
export const ADDITIVE_ID: RegExp;
export const ADDITIVES_FAMILY = "additifs";
export function computeLowOxalateIds(
  taxonomy: Taxonomy,
  rootsFile: RootsFile,
  riskyOffIds: ReadonlySet<string>
): { table: LowOxalateTable; report: LowOxalateReport };
```

- [ ] **Step 1 : Écrire les tests**

Créer `scripts/low-oxalate-generator.test.ts` :

```ts
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
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run : `npx vitest run scripts/low-oxalate-generator.test.ts`
Expected : FAIL, le module `./low-oxalate-generator` est introuvable.

- [ ] **Step 3 : Implémenter**

Créer `scripts/low-oxalate-generator.ts` :

```ts
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
```

- [ ] **Step 4 : Vérifier qu'ils passent**

Run : `npx vitest run scripts/low-oxalate-generator.test.ts`
Expected : PASS (13 tests).

- [ ] **Step 5 : Commit**

```bash
git add scripts/low-oxalate-generator.ts scripts/low-oxalate-generator.test.ts
git commit -m "Add pure low-oxalate table generator logic over the OFF taxonomy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : Familles, point d'entrée du générateur et table générée

**Files :**
- Create : `scripts/low-oxalate-roots.json`
- Create : `scripts/generate-low-oxalate-ingredients.ts`
- Create (généré) : `src/data/low-oxalate-ingredients.json`
- Modify : `package.json` (script `generate:low-oxalate`)

**Interfaces :**
- Consumes : `computeLowOxalateIds`, `RootsFile` et `Taxonomy` (tâche 3) ;
  `KNOWN_INGREDIENTS` (tâche 2).
- Produces : `src/data/low-oxalate-ingredients.json`, de forme
  `{ source: {...}, families: Record<string, {kind, justification}>, ids: Record<string, string> }`.
  Lu par la tâche 5 via `lowOxalateTable.ids`.

- [ ] **Step 1 : Écrire les familles**

Créer `scripts/low-oxalate-roots.json` :

```json
{
  "roots": [
    { "id": "en:dairy", "kind": "ohf", "justification": "Milk, Cows or Goats, All types ; Cheese, hard and soft variety ; Butter ; Milk Products, Yogurt, fresh & frozen, variety, Multi-Brands" },
    { "id": "en:egg", "kind": "ohf", "justification": "Eggs Whole and Egg White Products" },
    { "id": "en:fish", "kind": "ohf", "justification": "Fish and Seafood, Variety" },
    { "id": "en:apple", "kind": "ohf", "justification": "Apple, Variety, Fresh ; Juice, Apple" },
    { "id": "en:pear", "kind": "ohf", "justification": "Pears, variety, fresh, canned or baked" },
    { "id": "en:grape", "kind": "ohf", "justification": "Grapes, Green or Red ; Juice, Grape, Green" },
    { "id": "en:lemon", "kind": "ohf", "justification": "Lemon, raw ; Juice, Lemon" },
    { "id": "en:lime", "kind": "ohf", "justification": "Lime, raw ; Juice, Lime" },
    { "id": "en:pineapple", "kind": "ohf", "justification": "Pineapple, preserved w/out sugar ; Juice, Pineapple" },
    { "id": "en:peach", "kind": "ohf", "justification": "Peaches, raw or canned" },
    { "id": "en:plum", "kind": "ohf", "justification": "Plums, variety, fresh" },
    { "id": "en:cherry", "kind": "ohf", "justification": "Cherries, Sweet, raw ; Cherries, dried ; Juice, Cherry" },
    { "id": "en:melon", "kind": "ohf", "justification": "Melons, variety including watermelon" },
    { "id": "en:grapefruit-juice", "kind": "ohf", "justification": "Juice, Grapefruit" },
    { "id": "en:onion", "kind": "ohf", "justification": "Onion, Variety, boiled or sautéed ; Herbs and Spices, Onion Powder" },
    { "id": "en:garlic", "kind": "ohf", "justification": "Garlic, raw ; Herbs and Spices, Garlic powder" },
    { "id": "en:shallot", "kind": "ohf", "justification": "Shallots" },
    { "id": "en:cabbage", "kind": "ohf", "justification": "Cabbage, green, raw, shredded ; Kale, Variety, Raw ; Kohlrabi" },
    { "id": "en:cauliflower", "kind": "ohf", "justification": "Cauliflower, raw, boiled or steamed" },
    { "id": "en:mushroom", "kind": "ohf", "justification": "Mushrooms, Variety, boiled or canned ; Mushrooms, Variety, dried" },
    { "id": "en:lettuce", "kind": "ohf", "justification": "Lettuce, variety, shredded or chopped, raw" },
    { "id": "en:pea", "kind": "ohf", "justification": "Legumes, Peas, Green Peas, dried & boiled or canned ; Legumes, Peas, Split Peas, Yellow or Green, boiled" },
    { "id": "en:broccoli", "kind": "ohf", "justification": "Broccoli, boiled or steamed" },
    { "id": "en:coffee", "kind": "ohf", "justification": "Coffee, Black" },
    { "id": "en:vinegar", "kind": "ohf", "justification": "Condiments, Vinegar, Variety flavors" },
    { "id": "en:honey", "kind": "ohf", "justification": "Honey, Clover, Madhava Mountain Gold" },
    { "id": "en:milk-proteins", "kind": "ohf", "justification": "Milk, Cows or Goats, All types (protéines extraites du lait)" },
    { "id": "en:apple-juice", "kind": "ohf", "justification": "Juice, Apple" },
    { "id": "en:lemon-juice", "kind": "ohf", "justification": "Juice, Lemon" },
    { "id": "en:vanilla-extract", "kind": "ohf", "justification": "Herbs and Spices, Vanilla Extract, pure, McCormick" },
    { "id": "en:water", "kind": "neutre", "justification": "eau, aucun tissu végétal" },
    { "id": "en:salt", "kind": "neutre", "justification": "minéral, aucun tissu végétal" },
    { "id": "en:minerals", "kind": "neutre", "justification": "sels minéraux ajoutés, aucun tissu végétal" },
    { "id": "en:vitamins", "kind": "neutre", "justification": "vitamines ajoutées (molécules purifiées)" },
    { "id": "en:yeast", "kind": "neutre", "justification": "levure (champignon), aucun tissu végétal ; Yeast Nutritional, Laramie Co-op (OHF faible)" },
    { "id": "en:ferment", "kind": "neutre", "justification": "cultures microbiennes" },
    { "id": "en:lactic-ferments", "kind": "neutre", "justification": "cultures microbiennes" },
    { "id": "en:rennet", "kind": "neutre", "justification": "enzyme de coagulation" },
    { "id": "en:alcohol", "kind": "neutre", "justification": "Alcohol, Distilled Spirits ; Alcohol, Wine ; Alcohol, Beer (OHF faible)" },
    { "id": "en:caffeine", "kind": "neutre", "justification": "molécule purifiée" },
    { "id": "en:emulsifier", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:acid", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:colour", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:thickener", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:stabiliser", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:preservative", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:antioxidant", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:acidity-regulator", "kind": "neutre", "justification": "catégorie d'additif (molécules purifiées)" },
    { "id": "en:raising-agent", "kind": "neutre", "justification": "catégorie d'additif ; Baking Powder, Baking Soda (OHF faible)" },
    { "id": "en:sweetener", "kind": "neutre", "justification": "Artificial Sweeteners, Aspartame / Saccharin / Splenda ; Stevia Powder ; Xylitol (OHF faible)" },
    { "id": "en:gelling-agent", "kind": "neutre", "justification": "catégorie d'additif ; Fruit Pectin, Sure-Jell (OHF faible)" },
    { "id": "en:oil-and-fat", "kind": "forme-raffinée", "justification": "Oils, All types nut, vegetable and seed oils ; Butter ; Margarine, All types ; Shortening, all vegatable" },
    { "id": "en:added-sugar", "kind": "forme-raffinée", "justification": "Sugar, Cane, White ; Sugar, Brown ; Corn Syrup, Dark or Light ; Maple Syrup, pure, ; Agave Nectar, light, Madhava ; Syrup, Brown Rice" },
    { "id": "en:glucose", "kind": "forme-raffinée", "justification": "Corn Syrup, Dark or Light" },
    { "id": "en:fructose", "kind": "forme-raffinée", "justification": "Corn Syrup, Dark or Light" },
    { "id": "en:dextrose", "kind": "forme-raffinée", "justification": "Corn Syrup, Dark or Light" },
    { "id": "en:lactose", "kind": "forme-raffinée", "justification": "sucre purifié du lait ; Milk, Cows or Goats, All types" },
    { "id": "en:maltodextrin", "kind": "forme-raffinée", "justification": "hydrolysat d'amidon purifié ; Corn, Cornstarch ; Corn Syrup, Dark or Light" },
    { "id": "en:starch", "kind": "forme-raffinée", "justification": "Corn, Cornstarch ; Flour, Potato Starch, Bob's Red Mill" },
    { "id": "en:flavouring", "kind": "forme-raffinée", "justification": "Herbs and Spices, Vanilla Extract, pure, McCormick ; Herbs and Spices, Lemon Extract, pure ; Herbs and Spices, Almond Extract, McCormick" }
  ],
  "forceLow": [
    { "id": "en:orange-juice", "justification": "Juice, Orange, (OHF faible) — l'orange entière (en:orange) est élevé" },
    { "id": "en:cocoa-butter", "justification": "Candy, White Chocolate, bar or chips (OHF faible) — graisse extraite du cacao (en:cocoa)" }
  ],
  "exclude": [
    { "id": "en:cocoa-mass-and-cocoa-butter", "justification": "contient de la masse de cacao (très élevé)" },
    { "id": "en:organic-cocoa-mass-and-organic-cocoa-butter", "justification": "contient de la masse de cacao (très élevé)" },
    { "id": "en:raisin", "justification": "raisin sec : absent de la base OHF, ne pas déduire du raisin frais" },
    { "id": "en:sultana", "justification": "raisin sec : absent de la base OHF, ne pas déduire du raisin frais" },
    { "id": "en:grape-seed", "justification": "pépins de raisin : absents de la base OHF, ne pas déduire du raisin frais" },
    { "id": "fr:farine-de-pepins-de-raisin", "justification": "farine de pépins de raisin : absente de la base OHF" },
    { "id": "en:raw-red-and-whitecurrants", "justification": "groseilles rangées sous en:grape — Currants, Red, raw est élevé" },
    { "id": "en:red-grape-juice", "justification": "Juice, Grape, Red est modéré" },
    { "id": "en:concord-grape-juice", "justification": "Juice, Grape, Red est modéré (raisin noir Concord)" },
    { "id": "en:muscadine-grape-juice", "justification": "Juice, Grape, Red est modéré (raisin noir Muscadine)" },
    { "id": "en:sugar-snap-peas", "justification": "Legumes, Peas, Sugar Snap est très élevé" },
    { "id": "en:snow-pea", "justification": "pois mange-tout, apparenté à Legumes, Peas, Sugar Snap (très élevé)" },
    { "id": "en:edible-podded-pea", "justification": "pois mange-tout, apparenté à Legumes, Peas, Sugar Snap (très élevé)" },
    { "id": "en:grass-pea", "justification": "gesse (Lathyrus), absente de la base OHF" },
    { "id": "en:cinnamon-apple", "justification": "pomme à la cannelle : la cannelle est très élevé" },
    { "id": "en:candied-lemon-zest", "justification": "zeste confit : Lemon Peel est élevé" },
    { "id": "en:red-yeast-rice", "justification": "levure de riz rouge : c'est du riz fermenté, pas une levure seule" },
    { "id": "en:chocolate-liqueur", "justification": "liqueur au chocolat : le chocolat est très élevé" },
    { "id": "en:milk-chocolate-with-sweetener", "justification": "chocolat au lait rangé sous en:sweetener : Candy, Milk Chocolate, bar or chips est très élevé" },
    { "id": "en:sugar-beet-syrup", "justification": "sirop de betterave sucrière : jus concentré non raffiné, betterave très élevé" },
    { "id": "en:e162", "justification": "rouge de betterave : extrait d'un aliment très élevé (Beets)" }
  ]
}
```

- [ ] **Step 2 : Écrire le point d'entrée**

Créer `scripts/generate-low-oxalate-ingredients.ts` :

```ts
// Génère src/data/low-oxalate-ingredients.json à partir de la taxonomie
// des ingrédients d'Open Food Facts et de scripts/low-oxalate-roots.json.
// Usage : npm run generate:low-oxalate
// Node 24 exécute ce fichier TypeScript directement (imports en .ts).
import { createHash } from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { KNOWN_INGREDIENTS } from "../src/data/known-ingredients.ts";
import {
  computeLowOxalateIds,
  type RootsFile,
  type Taxonomy,
} from "./low-oxalate-generator.ts";

const TAXONOMY_URL = "https://static.openfoodfacts.org/data/taxonomies/ingredients.json";
const USER_AGENT = "oxalapp/0.1.0 (+https://github.com/scriptor-pro/oxalapp)";
const ROOTS_PATH = fileURLToPath(new URL("./low-oxalate-roots.json", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../src/data/low-oxalate-ingredients.json", import.meta.url));

const response = await fetch(TAXONOMY_URL, { headers: { "User-Agent": USER_AGENT } });
if (!response.ok) {
  throw new Error(`Téléchargement de la taxonomie impossible : HTTP ${response.status}`);
}
const rawTaxonomy = await response.text();
const taxonomy = JSON.parse(rawTaxonomy) as Taxonomy;
const rootsFile = JSON.parse(fs.readFileSync(ROOTS_PATH, "utf8")) as RootsFile;
const riskyOffIds = new Set(KNOWN_INGREDIENTS.flatMap((known) => (known.offId ? [known.offId] : [])));

const { table, report } = computeLowOxalateIds(taxonomy, rootsFile, riskyOffIds);

const output = {
  source: {
    name: "Open Food Facts — taxonomie des ingrédients",
    url: TAXONOMY_URL,
    downloadedAt: new Date().toISOString(),
    sha256: createHash("sha256").update(rawTaxonomy).digest("hex"),
    license: "ODbL 1.0 (base) / DbCL 1.0 (contenu) — © contributeurs Open Food Facts",
    generator: "scripts/generate-low-oxalate-ingredients.ts",
  },
  families: table.families,
  // Clés triées : diff lisible à chaque régénération.
  ids: Object.fromEntries(Object.entries(table.ids).sort(([a], [b]) => a.localeCompare(b))),
};
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

console.log(`Identifiants faibles : ${Object.keys(table.ids).length}`);
console.log("\nRetenus par famille :");
for (const [family, count] of Object.entries(report.descendantsByFamily)) {
  console.log(`  ${family} : ${count}`);
}
console.log(`\nÉcartés par un ancêtre à risque (${report.riskyConflicts.length}) :`);
console.log(`  ${report.riskyConflicts.join(" ")}`);
console.log(`\nÉcartés par exclude (${report.excluded.length}) :`);
console.log(`  ${report.excluded.join(" ")}`);
console.log(`\nRendus faibles par forceLow (${report.forcedLow.length}) :`);
console.log(`  ${report.forcedLow.join(" ")}`);
```

- [ ] **Step 3 : Ajouter le script npm**

Dans `package.json`, section `scripts`, ajouter après la ligne `"test": "vitest run"` (en ajoutant la virgule manquante) :

```json
    "test": "vitest run",
    "generate:low-oxalate": "node scripts/generate-low-oxalate-ingredients.ts"
```

- [ ] **Step 4 : Générer la table**

Run : `npm run generate:low-oxalate`
Expected (taxonomie du 2026-09-30 ; quelques unités d'écart possibles si
OFF l'a modifiée depuis) :
- `Identifiants faibles : ~3050` ;
- environ 21 conflits avec un ancêtre à risque, dont
  `en:caramelised-peanut`, `en:lemon-zest`, `en:prune` et
  `en:brussels-sprouts` ;
- les rendus faibles par `forceLow` comprennent `en:cocoa-butter` et
  `en:orange-juice`.

Si le générateur échoue sur `Identifiant absent de la taxonomie : X`,
c'est que OFF a renommé X. Chercher le nouvel identifiant avec
`node -e 'const t=require("/tmp/t.json")…'` après
`curl -s -o /tmp/t.json https://static.openfoodfacts.org/data/taxonomies/ingredients.json`,
puis corriger `scripts/low-oxalate-roots.json`.

- [ ] **Step 5 : Relire les identifiants faibles suspects**

Run :

```bash
node -e '
const { ids } = JSON.parse(require("fs").readFileSync("src/data/low-oxalate-ingredients.json", "utf8"));
const suspect = /choc|cocoa|caca|kakao|almond|hazel|spinach|beet|carrot|tomat|sesame|wheat(?!.*(starch|syrup|glucose|dextrose|oil))|peanut(?!-oil)|cashew(?!-nut-oil)|pistach(?!io-seed-oil)|cinnamon|currant|berry|rhubarb|kiwi|celery|leek|zest|peel|raisin|chestnut|rice(?!-(vinegar|wine|syrup|starch|bran-oil|glucose))/;
console.log(Object.keys(ids).filter((id) => suspect.test(id) && !/flavour|aroma|oil|butter|fat|-extract$/.test(id)).join("\n"));
'
```

Expected : uniquement des identifiants déjà relus et acceptés pendant la
préparation, comme `en:chestnut-mushroom` (un champignon) ou
`en:coffee-beans`.

Pour tout autre identifiant qui désigne un aliment à risque (ou qui en
contient un) rangé à tort sous une famille faible :
1. l'ajouter à `exclude` dans `scripts/low-oxalate-roots.json`, avec une
   justification d'une ligne ;
2. relancer l'étape 4 ;
3. le mentionner dans le message de commit.

- [ ] **Step 6 : Vérifier les identifiants clés utilisés par les tâches suivantes**

Run :

```bash
node -e '
const { ids } = JSON.parse(require("fs").readFileSync("src/data/low-oxalate-ingredients.json", "utf8"));
for (const id of ["en:carbonated-water","en:sugar","en:salt","en:milk","en:milk-powder","en:butter","en:e330","en:e338","en:cocoa-butter","en:orange-juice","en:skimmed-milk-powder","en:sunflower-oil","en:soya-lecithin"]) console.log(id, ids[id] ?? "ABSENT");
for (const id of ["en:e162","en:wheat-flour","en:cocoa-paste","en:caramelised-peanut","en:hazelnut"]) console.log(id, ids[id] ? "PRÉSENT (ANORMAL)" : "absent (attendu)");
'
```

Expected : la première série a toutes une famille ; la seconde est toute
« absent (attendu) ».

- [ ] **Step 7 : Commit**

```bash
git add package.json scripts/low-oxalate-roots.json scripts/generate-low-oxalate-ingredients.ts src/data/low-oxalate-ingredients.json
git commit -m "Generate low-oxalate ingredient table from the OFF ingredients taxonomy

Hand-written families in scripts/low-oxalate-roots.json, each justified
by an OHF faible entry, a neutral nature or a refined form. Risky
ancestors always win; forceLow and exclude handle the reviewed
exceptions. Meat is deliberately absent (OHF rates it modéré).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : Matcher : monde fermé, inconnus négligeables, `unknownIngredients`

**Files :**
- Modify : `src/lib/oxalate-matcher.ts`
- Test : `src/lib/oxalate-matcher.test.ts`

**Interfaces :**
- Consumes : `src/data/low-oxalate-ingredients.json` (tâche 4), champ
  `ids`.
- Produces (utilisé par les tâches 6, 7 et 8) :

```ts
export interface UnknownIngredient {
  text: string;
  offId: string | null;
  percentEstimate: number | null; // nettoyé : null si hors [0, 100] ou non fini
}
export interface MatchResult {
  level: MatchLevel;
  matchedIngredients: MatchedIngredient[];
  unknownIngredients: UnknownIngredient[]; // inconnus significatifs, dans l'ordre de la liste
}
```

- [ ] **Step 1 : Écrire les tests**

Ajouter à la fin de `src/lib/oxalate-matcher.test.ts` :

```ts
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
      { text: "Farine de BLÉ", percentEstimate: 50.15, offId: "en:wheat-flour" },
      { text: "sucre", percentEstimate: 37.47, offId: "en:sugar" },
    ]);

    expect(result.level).toBe("non déterminable");
    expect(result.unknownIngredients).toEqual([
      { text: "Farine de BLÉ", offId: "en:wheat-flour", percentEstimate: 50.15 },
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
      { text: "farine de blé", percentEstimate: 40, offId: "en:wheat-flour" },
      { text: "eau", percentEstimate: 40, offId: "en:water" },
    ]);

    expect(result.level).toBe("élevé");
    expect(result.unknownIngredients.map((u) => u.offId)).toEqual(["en:wheat-flour"]);
  });

  it("ne conclut plus faible quand une trace d'ingrédient à risque masque un inconnu majeur (règle A)", () => {
    const result = matchStructuredIngredients([
      { text: "Farine de blé", percentEstimate: 60, offId: "en:wheat-flour" },
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
    const withBeetrootRed = matchStructuredIngredients([
      { text: "eau", percentEstimate: 97, offId: "en:water" },
      { text: "rouge de betterave", percentEstimate: 3, offId: "en:e162" },
    ]);

    expect(withCitricAcid.level).toBe("faible");
    expect(withBeetrootRed.level).toBe("non déterminable");
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
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run : `npx vitest run src/lib/oxalate-matcher.test.ts`
Expected : FAIL. Les nouveaux tests échouent : `unknownIngredients` est
`undefined`, le niveau vaut « non déterminable » au lieu de « faible »,
etc. Les anciens tests passent.

- [ ] **Step 3 : Implémenter**

Dans `src/lib/oxalate-matcher.ts` :

(a) Ajouter l'import de la table sous les imports existants :

```ts
import lowOxalateTable from "../data/low-oxalate-ingredients.json";
```

(b) Remplacer l'interface `MatchResult` par :

```ts
export interface UnknownIngredient {
  text: string;
  offId: string | null;
  percentEstimate: number | null;
}

export interface MatchResult {
  level: MatchLevel;
  matchedIngredients: MatchedIngredient[];
  // Ingrédients structurés ni à risque ni reconnus faibles, présents à 2 %
  // ou plus (ou de proportion inconnue), dans l'ordre de la liste. Toujours
  // vide pour le texte brut.
  unknownIngredients: UnknownIngredient[];
}
```

(c) Juste après la fonction `degradeByProportion`, ajouter :

```ts
// Étape 5 (spec 2026-10-01) : un ingrédient inconnu présent à moins de ce
// pourcentage est ignoré, de même qu'un ingrédient à risque sous 2 % est
// déjà ramené à « faible » par degradeByProportion.
const NEGLIGIBLE_PERCENT = 2;
// Garde-fou : si les inconnus ignorés totalisent plus que ce pourcentage,
// plus aucun n'est ignoré, pour que plusieurs petits inconnus ne finissent
// pas par peser lourd.
const MAX_IGNORED_PERCENT = 5;

// Open Food Facts renvoie parfois des estimations absurdes (ex. -359 %) :
// on les traite comme une proportion inconnue plutôt que comme une trace.
function sanitizePercent(percent: number | null): number | null {
  if (percent === null || !Number.isFinite(percent)) return null;
  if (percent < 0 || percent > 100) return null;
  return percent;
}

// Ingrédients pauvres en oxalate, générés à partir de la taxonomie OFF par
// scripts/generate-low-oxalate-ingredients.ts (familles et exceptions dans
// scripts/low-oxalate-roots.json).
const LOW_OXALATE_IDS: Record<string, string> = lowOxalateTable.ids;

function isLowOxalateId(offId: string | null | undefined): boolean {
  return !!offId && Object.hasOwn(LOW_OXALATE_IDS, offId);
}
```

(d) Remplacer la fonction `aggregateResult` entière par :

```ts
function highestLevel(matches: MatchedIngredient[]): OxalateLevel | null {
  if (matches.length === 0) return null;
  return matches.reduce((max, m) =>
    LEVEL_RANK[m.level] > LEVEL_RANK[max.level] ? m : max
  ).level;
}

function aggregateResult(deduped: MatchedIngredient[]): MatchResult {
  return {
    level: highestLevel(deduped) ?? "non déterminable",
    matchedIngredients: deduped,
    unknownIngredients: [],
  };
}
```

(e) Dans `matchIngredients`, remplacer
`return { level: "non déterminable", matchedIngredients: [] };` par :

```ts
    return { level: "non déterminable", matchedIngredients: [], unknownIngredients: [] };
```

(f) Remplacer la fonction `matchStructuredIngredients` entière par :

```ts
type StructuredClassification =
  | { kind: "risky"; matches: MatchedIngredient[] }
  | { kind: "low" }
  | { kind: "unknown" };

// Ordre : identifiant à risque, identifiant faible, puis mots-clés du
// texte. L'identifiant OFF fait foi avant le texte : « beurre de cacao »
// (en:cocoa-butter) est faible même si son texte contient « cacao ».
function classifyStructuredIngredient(
  ingredient: StructuredIngredient
): StructuredClassification {
  const idMatch = matchKnownIngredientByOffId(ingredient.offId);
  if (idMatch) return { kind: "risky", matches: [idMatch] };
  if (isLowOxalateId(ingredient.offId)) return { kind: "low" };
  const textMatches = dedupeMatches(
    matchKnownIngredientsInText(normalize(ingredient.text))
  );
  return textMatches.length > 0
    ? { kind: "risky", matches: textMatches }
    : { kind: "unknown" };
}

export function matchStructuredIngredients(
  structuredIngredients: StructuredIngredient[]
): MatchResult {
  const riskyMatches: MatchedIngredient[] = [];
  const unknowns: UnknownIngredient[] = [];
  let recognizedCount = 0;

  for (const ingredient of structuredIngredients) {
    const percent = sanitizePercent(ingredient.percentEstimate);
    const classification = classifyStructuredIngredient(ingredient);
    if (classification.kind === "unknown") {
      unknowns.push({
        text: ingredient.text,
        offId: ingredient.offId ?? null,
        percentEstimate: percent,
      });
      continue;
    }
    recognizedCount++;
    if (classification.kind === "low") continue;
    for (const match of classification.matches) {
      if (percent === null) {
        riskyMatches.push(match);
        continue;
      }
      const adjustedLevel = degradeByProportion(match.level, percent);
      riskyMatches.push({
        ...match,
        level: adjustedLevel,
        percentEstimate: percent,
        ...(adjustedLevel !== match.level ? { levelBeforeAdjustment: match.level } : {}),
      });
    }
  }

  const isNegligible = (unknown: UnknownIngredient) =>
    unknown.percentEstimate !== null && unknown.percentEstimate < NEGLIGIBLE_PERCENT;
  const ignoredPercent = unknowns
    .filter(isNegligible)
    .reduce((sum, unknown) => sum + (unknown.percentEstimate ?? 0), 0);
  const unknownIngredients =
    ignoredPercent > MAX_IGNORED_PERCENT
      ? unknowns
      : unknowns.filter((unknown) => !isNegligible(unknown));

  // Règle stricte (spec 2026-10-01, décision A) : un niveau au-dessus de
  // « faible » est un minimum que les inconnus ne pourraient qu'augmenter ;
  // « faible » exige en revanche qu'aucun inconnu significatif ne reste.
  const highest = highestLevel(riskyMatches);
  let level: MatchLevel;
  if (highest !== null && highest !== "faible") {
    level = highest;
  } else if (recognizedCount > 0 && unknownIngredients.length === 0) {
    level = "faible";
  } else {
    level = "non déterminable";
  }

  return { level, matchedIngredients: riskyMatches, unknownIngredients };
}
```

- [ ] **Step 4 : Vérifier les tests du matcher**

Run : `npx vitest run src/lib/oxalate-matcher.test.ts`
Expected : PASS, anciens et nouveaux tests. Aucun ancien test du matcher ne
change d'attendu : ceux qui touchent la rétrogradation ne vérifient que
l'ingrédient rétrogradé, pas le niveau global.

- [ ] **Step 5 : Corriger les littéraux `MatchResult` des tests de `ResultView`**

Dans `src/components/ResultView.test.tsx`, bloc
`describe("categorizeFailure", …)`, ajouter `unknownIngredients: []` aux
quatre littéraux. Exemple pour le premier :

```ts
    const result = categorizeFailure(
      { level: "non déterminable", matchedIngredients: [], unknownIngredients: [] },
      { ingredientsText: "" }
    );
```

Faire de même pour les trois autres (`"   "`, `"water, coconut oil, salt"`
et le cas `"élevé"`).

- [ ] **Step 6 : Vérifier toute la suite et la compilation**

Run : `npx vitest run && npx tsc -b`
Expected :
- les tests du matcher et du générateur passent ;
- `ResultView.test.tsx` a **exactement un** échec attendu, réglé par la
  tâche 7 : « shows a reduced-contribution note for a low-proportion risky
  ingredient ». Farine et sucre (sans identifiant) y sont maintenant des
  inconnus significatifs, donc « non déterminable » au lieu de
  « faible » ;
- `tsc -b` est propre.

S'il y a un autre échec, s'arrêter et l'analyser avant de continuer.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/oxalate-matcher.ts src/lib/oxalate-matcher.test.ts src/components/ResultView.test.tsx
git commit -m "Conclude faible only when every significant structured ingredient is known

Structured ingredients are now classified as risky, low (generated OFF
taxonomy table) or unknown. Unknowns under 2% are ignored unless they
add up to more than 5%. faible requires no significant unknown, even
when a risky ingredient was degraded by proportion (rule A), so a trace
of hazelnut no longer hides 60% of unrecognized flour. Out-of-range
percent estimates are treated as unknown. MatchResult gains
unknownIngredients (always empty for raw text).

The ResultView reduced-contribution test now fails as intended (wheat
flour is an unknown); it is rewritten in the ResultView task.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : Produits réels comme jeux de référence

**Files :**
- Create : `src/lib/__fixtures__/off-products.json`
- Test : `src/lib/oxalate-matcher.fixtures.test.ts`

**Interfaces :**
- Consumes : `matchStructuredIngredients` et
  `MatchResult.unknownIngredients` (tâche 5).

- [ ] **Step 1 : Extraire les six produits depuis l'API produit d'OFF**

```bash
mkdir -p src/lib/__fixtures__
node --input-type=module -e '
import fs from "node:fs";
const codes = ["5449000267412", "3228021170039", "4056489141877", "4056489406679", "5410126806069", "4056489471264"];
const products = [];
for (const code of codes) {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,ingredients`, { headers: { "User-Agent": "oxalapp/0.1.0 (+https://github.com/scriptor-pro/oxalapp)" } });
  const data = await response.json();
  products.push({
    code,
    productName: data.product.product_name,
    ingredients: data.product.ingredients.map((i) => ({ id: i.id ?? null, text: i.text ?? "", percent_estimate: i.percent_estimate ?? null })),
  });
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
const fixture = {
  _source: "Open Food Facts (https://world.openfoodfacts.org) — ODbL 1.0 / DbCL 1.0, © contributeurs Open Food Facts. Extrait le " + new Date().toISOString().slice(0, 10) + " ; ingrédients de premier niveau uniquement.",
  products,
};
fs.writeFileSync("src/lib/__fixtures__/off-products.json", JSON.stringify(fixture, null, 2) + "\n");
console.log(products.map((p) => `${p.code} ${p.productName} : ${p.ingredients.length} ingrédients`).join("\n"));
'
```

Expected : six lignes (Coca-Cola goût original, PRESIDENT CAMEMBERT 250g,
Huile d'olive vierge extra, Boisson lactée saveur chocolat, LOTUS BISCOFF
Original, Edelbitter Mild 90%), chacune avec au moins un ingrédient.

- [ ] **Step 2 : Écrire le test**

Créer `src/lib/oxalate-matcher.fixtures.test.ts` :

```ts
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
```

- [ ] **Step 3 : Lancer le test**

Run : `npx vitest run src/lib/oxalate-matcher.fixtures.test.ts && npx tsc -b`
Expected : PASS (6 tests), `tsc -b` propre.

Si un produit diverge : afficher ses ingrédients
(`node -e 'console.log(JSON.stringify(require("./src/lib/__fixtures__/off-products.json").products.find(p=>p.code==="CODE"),null,1))'`).
Puis déterminer si la fiche OFF a changé depuis le 2026-09-30 (texte ou
identifiant différent) ou s'il s'agit d'un bug du matcher.
- Fiche modifiée : ajuster l'attendu et le signaler dans le commit.
- Bug : corriger le matcher (tâche 5) d'abord.

- [ ] **Step 4 : Commit**

```bash
git add src/lib/__fixtures__/off-products.json src/lib/oxalate-matcher.fixtures.test.ts
git commit -m "Pin closed-world matching on six real Open Food Facts products

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7 : `ResultView` : justification, inconnus et avertissement

**Files :**
- Modify : `src/components/ResultView.tsx`
- Test : `src/components/ResultView.test.tsx`

**Interfaces :**
- Consumes : `MatchResult.unknownIngredients` et `UnknownIngredient`
  (tâche 5).
- Produces : `ScanFailureReason = "no-ingredients" | "unknown-ingredients" | "no-match"`.

- [ ] **Step 1 : Écrire et adapter les tests**

Dans `src/components/ResultView.test.tsx` :

(a) Dans `describe("categorizeFailure", …)`, ajouter :

```ts
  it("returns 'unknown-ingredients' when non déterminable with significant unknown ingredients", () => {
    const result = categorizeFailure(
      {
        level: "non déterminable",
        matchedIngredients: [],
        unknownIngredients: [{ text: "Farine de blé", offId: "en:wheat-flour", percentEstimate: 50 }],
      },
      { ingredientsText: "Farine de blé, sucre" }
    );
    expect(result).toBe("unknown-ingredients");
  });

  it("keeps 'no-ingredients' first when the ingredients text is empty", () => {
    const result = categorizeFailure(
      {
        level: "non déterminable",
        matchedIngredients: [],
        unknownIngredients: [{ text: "x", offId: null, percentEstimate: null }],
      },
      { ingredientsText: "" }
    );
    expect(result).toBe("no-ingredients");
  });
```

(b) Remplacer, dans le test « shows a methodological caveat for
ingredient-keyword-based results », l'expression régulière par :

```ts
        /déduit de la liste d'ingrédients, pas d'une quantité mesurée dans ce produit précis/
```

(c) Dans `describe("ResultView proportion-aware matching", …)`, remplacer
le test « shows a reduced-contribution note for a low-proportion risky
ingredient » par ces deux tests :

```ts
  it("shows a reduced-contribution note for a low-proportion risky ingredient", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000",
      rawCode: "0000000000000",
      productName: "Beurre sucré aux noisettes",
      ingredientsText: "Sucre, beurre, noisettes 0.8%",
      structuredIngredients: [
        { text: "sucre", percentEstimate: 70, offId: "en:sugar" },
        { text: "beurre", percentEstimate: 29.2, offId: "en:butter" },
        { text: "noisettes", percentEstimate: 0.8 },
      ],
      imageUrl: null,
      lang: "fr",
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/faible/i)).toBeInTheDocument();
    expect(
      screen.getByText(/noisette.*0[.,]8%.*contribution réduite/i)
    ).toBeInTheDocument();
  });

  it("shows both the reduced-contribution note and the unknown ingredients when flour is unrecognized", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000",
      rawCode: "0000000000000",
      productName: "Biscuit noisettes",
      ingredientsText: "Farine de blé, noisettes 0.8%, sucre",
      structuredIngredients: [
        { text: "Farine de blé", percentEstimate: 70, offId: "en:wheat-flour" },
        { text: "noisettes", percentEstimate: 0.8 },
        { text: "sucre", percentEstimate: 29.2, offId: "en:sugar" },
      ],
      imageUrl: null,
      lang: "fr",
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/non déterminable/i)).toBeInTheDocument();
    expect(screen.getByText(/noisette.*0[.,]8%.*contribution réduite/i)).toBeInTheDocument();
    expect(screen.getByText("Ingrédients non reconnus : Farine de blé (70%).")).toBeInTheDocument();
  });
```

(d) Ajouter un nouveau bloc à la fin du fichier :

```ts
describe("ResultView closed-world explanations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockResolvedValue({ id: "scan1" }),
    });
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  function mockStructuredProduct(
    structuredIngredients: { text: string; percentEstimate: number | null; offId?: string | null }[]
  ) {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000",
      rawCode: "0000000000000",
      productName: "Produit test",
      ingredientsText: structuredIngredients.map((i) => i.text).join(", ") || "texte",
      structuredIngredients,
      imageUrl: null,
      lang: "fr",
      sources: ["open_food_facts"],
    });
  }

  it("justifies a faible level when every significant ingredient is recognized", async () => {
    mockStructuredProduct([
      { text: "eau gazéifiée", percentEstimate: 81.4, offId: "en:carbonated-water" },
      { text: "sucre", percentEstimate: 18.6, offId: "en:sugar" },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(
      await screen.findByText(
        "Tous les ingrédients présents à 2 % ou plus sont reconnus comme pauvres en oxalate."
      )
    ).toBeInTheDocument();
  });

  it("lists unknown ingredients with rounded percentages and omits unknown proportions", async () => {
    mockStructuredProduct([
      { text: "Farine de BLÉ", percentEstimate: 50.15, offId: "en:wheat-flour" },
      { text: "sucre", percentEstimate: 37.47, offId: "en:sugar" },
      { text: "arôme de malt", percentEstimate: null, offId: null },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(
      await screen.findByText("Ingrédients non reconnus : Farine de BLÉ (50%), arôme de malt.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/aucun ingrédient à risque connu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tous les ingrédients présents/i)).not.toBeInTheDocument();
  });

  it("names an unknown ingredient that has no text by its OFF id, or a placeholder", async () => {
    mockStructuredProduct([
      { text: "", percentEstimate: 60, offId: "en:mystery-ingredient" },
      { text: " ", percentEstimate: 30, offId: null },
      { text: "sucre", percentEstimate: 10, offId: "en:sugar" },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(
      await screen.findByText(
        "Ingrédients non reconnus : en:mystery-ingredient (60%), ingrédient sans nom (30%)."
      )
    ).toBeInTheDocument();
  });

  it("lists a duplicated unknown ingredient only once, at its first occurrence", async () => {
    mockStructuredProduct([
      { text: "farine de seigle complète", percentEstimate: 70, offId: "en:wholemeal-rye-flour" },
      { text: "sel", percentEstimate: 5, offId: "en:salt" },
      { text: "farine de seigle complète", percentEstimate: 25, offId: "en:wholemeal-rye-flour" },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(
      await screen.findByText("Ingrédients non reconnus : farine de seigle complète (70%).")
    ).toBeInTheDocument();
  });

  it("falls back to the no-match message when only negligible unknowns make up the list", async () => {
    mockStructuredProduct([
      { text: "Calcium 240", percentEstimate: 0.5, offId: "fr:calcium-240" },
      { text: "pH = 7,6", percentEstimate: 0.5, offId: "fr:ph-7-6" },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(
      await screen.findByText(/aucun ingrédient à risque connu détecté/i)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Vérifier qu'ils échouent**

Run : `npx vitest run src/components/ResultView.test.tsx`
Expected : FAIL sur les nouveaux tests (justification, liste des
inconnus, motif `unknown-ingredients`) et sur l'avertissement (ancienne
phrase). Le test réécrit avec sucre et beurre passe déjà.

- [ ] **Step 3 : Implémenter**

Dans `src/components/ResultView.tsx` :

(a) Remplacer l'import du matcher par :

```ts
import {
  matchIngredients,
  matchStructuredIngredients,
  type MatchResult,
  type UnknownIngredient,
} from "../lib/oxalate-matcher";
```

(b) Remplacer le type et la fonction `categorizeFailure` par :

```ts
export type ScanFailureReason = "no-ingredients" | "unknown-ingredients" | "no-match";

export function categorizeFailure(
  result: MatchResult,
  product: { ingredientsText: string }
): ScanFailureReason | null {
  if (result.level !== "non déterminable") return null;
  if (!product.ingredientsText.trim()) return "no-ingredients";
  if (result.unknownIngredients.length > 0) return "unknown-ingredients";
  return "no-match";
}

// « Farine de BLÉ (50%), arôme de malt » : pourcentage arrondi à l'entier
// (une estimation OFF ne justifie pas de décimale), omis s'il est inconnu.
// Un même ingrédient listé deux fois par OFF n'est nommé qu'une fois.
function formatUnknownIngredients(unknowns: UnknownIngredient[]): string {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const unknown of unknowns) {
    const name = unknown.text.trim() || unknown.offId || "ingrédient sans nom";
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (unknown.percentEstimate === null) {
      labels.push(name);
      continue;
    }
    const percent = unknown.percentEstimate < 1 ? "<1" : String(Math.round(unknown.percentEstimate));
    labels.push(`${name} (${percent}%)`);
  }
  return labels.join(", ");
}
```

Attention : avec plusieurs ingrédients sans nom et sans identifiant,
« ingrédient sans nom » n'apparaît qu'une fois (même clé). C'est
acceptable : le message reste lisible et exact.

(c) Dans le JSX, juste après le bloc
`{state.result.matchedIngredients.length > 0 && ( … )}`, ajouter :

```tsx
        {state.result.level === "faible" && (
          <p className="ingredient-line">
            Tous les ingrédients présents à 2 % ou plus sont reconnus comme
            pauvres en oxalate.
          </p>
        )}
```

(d) Dans la fonction anonyme qui traite `failureReason`, avant
`if (failureReason === "no-match") {`, ajouter :

```tsx
          if (failureReason === "unknown-ingredients") {
            return (
              <p className="ingredient-line">
                Ingrédients non reconnus :{" "}
                {formatUnknownIngredients(state.result.unknownIngredients)}.
              </p>
            );
          }
```

(e) Remplacer le paragraphe d'avertissement par :

```tsx
        <p className="disclaimer">
          Estimation indicative — les valeurs d'oxalate varient selon la
          variété, le sol, la cuisson, etc. Ce niveau est déduit de la liste
          d'ingrédients, pas d'une quantité mesurée dans ce produit précis.
        </p>
```

- [ ] **Step 4 : Vérifier les tests et la compilation**

Run : `npx vitest run && npx tsc -b && npm run lint`
Expected : toute la suite passe (y compris le test qui échouait depuis la
tâche 5), `tsc -b` est propre et oxlint ne signale aucune nouvelle erreur.

- [ ] **Step 5 : Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Explain closed-world results in ResultView

faible now states that every ingredient at 2% or more is recognized as
low-oxalate; non déterminable lists the unrecognized ingredients with
rounded percentages (deduplicated, never blank). The disclaimer no
longer claims the level reflects a risky ingredient's presence, which
was false for faible. The reduced-contribution test now uses recognized
low ingredients, and a sibling test covers the unrecognized-flour case.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8 : Mesure finale et rapport des inconnus

**Files :**
- Modify : `scripts/audit-non-determinable.test.ts`

**Interfaces :**
- Consumes : `MatchResult.unknownIngredients` (tâche 5) ; fichiers de
  `.cache/` (tâche 1).

- [ ] **Step 1 : Ajouter le rapport des inconnus les plus fréquents**

Dans `scripts/audit-non-determinable.test.ts`, juste avant
`expect(products.length).toBeGreaterThan(0);`, ajouter :

```ts
    // Ce qui bloque encore : inconnus significatifs des produits non
    // déterminables, par fréquence. Sert à choisir le prochain chantier.
    const unknownCounts = new Map<string, number>();
    for (const result of results.values()) {
      if (result.level !== "non déterminable") continue;
      for (const unknown of result.unknownIngredients) {
        const key = unknown.offId ?? `texte : ${unknown.text}`;
        unknownCounts.set(key, (unknownCounts.get(key) ?? 0) + 1);
      }
    }
    const topUnknowns = [...unknownCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([key, count]) => `  ${key} : ${count}`);
    console.log(`Inconnus les plus fréquents :\n${topUnknowns.join("\n")}`);
```

- [ ] **Step 2 : Lancer la mesure sur l'échantillon de référence**

Run : `OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts`
Expected :
- PASS ;
- `Non déterminable : N/200`, avec **N ≤ 90** (45 % au plus ; le
  prototype mesurait 82/200) ;
- la liste « Produits dont le niveau change » ;
- les inconnus les plus fréquents (attendus en tête : `en:wheat-flour`,
  avoine, chocolat).

Copier ces trois blocs de sortie pour le résumé à l'utilisateur.

- [ ] **Step 3 : Relire chaque baisse de niveau**

Dans la liste « Produits dont le niveau change », chaque transition vers
un niveau plus bas ou vers « non déterminable » doit s'expliquer par l'une
de ces causes :
- un ancien faux « faible » (trace rétrogradée masquant un inconnu) ;
- le beurre de cacao reconnu par son identifiant ;
- un arôme ou une huile issus d'un ingrédient à risque, désormais
  reconnus faibles ;
- un pourcentage OFF hors de [0, 100] désormais ignoré.

Pour tout autre cas, examiner le produit
(`node -e 'const s=require("./.cache/off-audit-sample.json");console.log(JSON.stringify(s.find(p=>p.code==="CODE").ingredients.map(i=>[i.id,i.text,i.percent_estimate])))'`),
corriger la cause (famille, `exclude` ou matcher), puis relancer les
étapes concernées des tâches 4 à 7.

- [ ] **Step 4 : Vérification complète**

Run : `npx vitest run && npx tsc -b && npm run lint`
Expected : tout passe, sans erreur.

- [ ] **Step 5 : Commit**

```bash
git add scripts/audit-non-determinable.test.ts
git commit -m "Report most frequent unknown ingredients in the non déterminable audit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6 : Résumé à l'utilisateur**

Présenter, sans fusionner ni pousser :
- le taux avant/après ;
- la liste des produits qui changent de niveau ;
- le rapport du générateur (conflits, exclusions, `forceLow`) ;
- les inconnus les plus fréquents ;
- le rappel du point de licence ODbL à valider.

Proposer ensuite la fusion dans `main`
(superpowers:finishing-a-development-branch). La reconstruction web/APK
reste à la charge de l'utilisateur.
