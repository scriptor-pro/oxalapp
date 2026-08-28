# ProductResolver + Pondération par proportions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isoler la résolution produit (GTIN + Open Food Facts) derrière un `ProductResolver` réutilisable, et faire en sorte que la proportion déclarée d'un ingrédient (quand Open Food Facts la fournit) atténue ou confirme sa contribution au niveau d'oxalate affiché — au lieu du "présent ou absent" actuel.

**Architecture:** Nouveau module `src/lib/gtin.ts` (normalisation/validation de code-barres) et `src/lib/product-resolver.ts` (orchestration : GTIN → `OpenFoodFactsSource` → objet produit normalisé). `off-client.ts` s'étend pour exposer les ingrédients structurés d'OFF (`ingredients[]`, avec `percent_estimate`). `oxalate-matcher.ts` gagne une étape de pondération par seuils appliquée après le matching texte existant. `ResultView.tsx` bascule de `getProductByBarcode` vers `resolveProduct` et affiche la proportion/l'atténuation quand elles existent.

**Tech Stack:** TypeScript, React (Vite), Vitest + @testing-library/react. Aucune nouvelle dépendance.

**Spec:** Design validé en session via superpowers:brainstorming (pas de fichier spec séparé — tâche classée "bounded/architectural léger", design discuté et approuvé en chat le 2026-08-28). Contexte amont : `OxalApp-vibe-coding-implementation.md` (sections 3, 4, 11, 12).

## Global Constraints

- Aucune régression : tous les tests existants (`off-client.test.ts`, `oxalate-matcher.test.ts`, `ResultView.test.tsx`) doivent continuer à passer, adaptés si l'API change mais jamais supprimés sans remplacement équivalent.
- Le niveau qualitatif actuel (`faible`/`modéré`/`élevé`/`très élevé`/`non déterminable`) reste le seul niveau affiché — pas de mg, pas d'intervalle dans cette tranche.
- Sans `percentEstimate` connu pour un ingrédient matché, son niveau reste inchangé (comportement actuel) — ne jamais inventer une proportion par défaut.
- Ne jamais committer sans que `npx tsc -b` et `npm test` passent (voir mémoire projet : `tsc --noEmit` seul ne suffit pas, `tsc -b` attrape les imports inutilisés en erreur bloquante).
- Le fallback OCR, USDA, FSANZ et la gestion de la préparation (cru/cuit/surgelé) sont hors périmètre de ce plan.

---

### Task 1: GTIN normalization + checksum validation

**Files:**
- Create: `src/lib/gtin.ts`
- Test: `src/lib/gtin.test.ts`

**Interfaces:**
- Consumes: rien (module autonome).
- Produces:
  - `export interface NormalizedGtin { rawCode: string; normalizedGtin14: string; symbology: "EAN_8" | "EAN_13" | "UPC_A" | "UPC_E" | "GTIN_14"; }`
  - `export function normalizeGtin(rawCode: string): NormalizedGtin | null` — retourne `null` si le code n'est pas un format numérique supporté ou si le checksum GS1 (modulo 10) est invalide.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/gtin.test.ts
import { describe, it, expect } from "vitest";
import { normalizeGtin } from "./gtin";

describe("normalizeGtin", () => {
  it("normalizes a valid EAN-13 to GTIN-14 with a leading zero", () => {
    const result = normalizeGtin("5449000000996");
    expect(result).toEqual({
      rawCode: "5449000000996",
      normalizedGtin14: "05449000000996",
      symbology: "EAN_13",
    });
  });

  it("normalizes a valid EAN-8 to GTIN-14", () => {
    const result = normalizeGtin("40170725");
    expect(result).toEqual({
      rawCode: "40170725",
      normalizedGtin14: "00000040170725",
      symbology: "EAN_8",
    });
  });

  it("normalizes a valid UPC-A to GTIN-14", () => {
    const result = normalizeGtin("036000291452");
    expect(result).toEqual({
      rawCode: "036000291452",
      normalizedGtin14: "00036000291452",
      symbology: "UPC_A",
    });
  });

  it("normalizes a valid GTIN-14 as-is", () => {
    const result = normalizeGtin("00012345678905");
    expect(result).toEqual({
      rawCode: "00012345678905",
      normalizedGtin14: "00012345678905",
      symbology: "GTIN_14",
    });
  });

  it("returns null for an invalid checksum", () => {
    // last digit changed from 6 to 7, breaking the EAN-13 checksum
    expect(normalizeGtin("5449000000997")).toBeNull();
  });

  it("returns null for a non-numeric code", () => {
    expect(normalizeGtin("ABCDEFGHIJKLM")).toBeNull();
  });

  it("returns null for an unsupported length", () => {
    expect(normalizeGtin("123456")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(normalizeGtin("")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/gtin.test.ts`
Expected: FAIL — `Cannot find module './gtin'` (le fichier n'existe pas encore).

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/gtin.ts
export interface NormalizedGtin {
  rawCode: string;
  normalizedGtin14: string;
  symbology: "EAN_8" | "EAN_13" | "UPC_A" | "UPC_E" | "GTIN_14";
}

const SYMBOLOGY_BY_LENGTH: Record<number, NormalizedGtin["symbology"]> = {
  8: "EAN_8",
  12: "UPC_A",
  13: "EAN_13",
  14: "GTIN_14",
};

function isValidGtinChecksum(digits: string): boolean {
  // GS1 modulo-10: from the rightmost digit (the check digit itself
  // excluded), alternate weights 3 and 1 starting with 3, working right
  // to left across the payload.
  const payload = digits.slice(0, -1);
  const checkDigit = Number(digits[digits.length - 1]);

  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    const digit = Number(payload[payload.length - 1 - i]);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return expectedCheckDigit === checkDigit;
}

export function normalizeGtin(rawCode: string): NormalizedGtin | null {
  if (!/^\d+$/.test(rawCode)) {
    return null;
  }

  const symbology = SYMBOLOGY_BY_LENGTH[rawCode.length];
  if (!symbology) {
    return null;
  }

  if (!isValidGtinChecksum(rawCode)) {
    return null;
  }

  return {
    rawCode,
    normalizedGtin14: rawCode.padStart(14, "0"),
    symbology,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/gtin.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/gtin.ts src/lib/gtin.test.ts
git commit -m "Add GTIN normalization and checksum validation"
```

---

### Task 2: Expose OFF's structured ingredients (with percent_estimate)

**Files:**
- Modify: `src/lib/off-client.ts`
- Modify: `src/lib/off-client.test.ts`

**Interfaces:**
- Consumes: rien de nouveau (même API OFF `v2/product/{ean}.json`, on lit un champ supplémentaire de la réponse existante : `ingredients`).
- Produces:
  - `export interface StructuredIngredient { text: string; percentEstimate: number | null; }` ajouté à `off-client.ts`.
  - `OffProduct` gagne un champ `structuredIngredients: StructuredIngredient[]` (tableau vide si OFF ne renvoie pas le champ `ingredients`).

- [ ] **Step 1: Write the failing tests**

Ajouter dans `src/lib/off-client.test.ts`, à la suite des tests existants dans le `describe("getProductByBarcode", ...)` :

```typescript
  it("exposes structured ingredients with their percent_estimate when present", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Épinards à la crème",
        ingredients_text: "Épinards 55%, crème 20%, sel",
        image_url: null,
        lang: "fr",
        ingredients: [
          { text: "Épinards", percent_estimate: 55 },
          { text: "crème", percent_estimate: 20 },
          { text: "sel", percent_estimate: 5 },
        ],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await getProductByBarcode("3017620422003");

    expect(result?.structuredIngredients).toEqual([
      { text: "Épinards", percentEstimate: 55 },
      { text: "crème", percentEstimate: 20 },
      { text: "sel", percentEstimate: 5 },
    ]);
  });

  it("treats a missing percent_estimate on a structured ingredient as null", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Biscuit noisettes",
        ingredients_text: "Farine, noisettes, sucre",
        image_url: null,
        lang: "fr",
        ingredients: [
          { text: "Farine" },
          { text: "noisettes" },
          { text: "sucre" },
        ],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await getProductByBarcode("1234567890123");

    expect(result?.structuredIngredients).toEqual([
      { text: "Farine", percentEstimate: null },
      { text: "noisettes", percentEstimate: null },
      { text: "sucre", percentEstimate: null },
    ]);
  });

  it("returns an empty structuredIngredients array when OFF has no ingredients field", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Gnocchi",
        ingredients_text: "",
        image_url: null,
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await getProductByBarcode("1234567890123");

    expect(result?.structuredIngredients).toEqual([]);
  });
```

Aussi, mettre à jour les deux premières assertions `toEqual` existantes (lignes 29 et — la seconde n'utilise que `.lang`, donc inchangée) pour inclure le nouveau champ, sinon `toEqual` échouera par excès de propriété :

```typescript
    expect(result).toEqual({
      productName: "Nutella",
      ingredientsText: "Sugar, palm oil, hazelnuts 13%, cocoa",
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
      lang: "en",
      structuredIngredients: [],
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/off-client.test.ts`
Expected: FAIL — le premier test échoue car `structuredIngredients` est absent de l'objet retourné ; les 3 nouveaux tests échouent de même.

- [ ] **Step 3: Write the implementation**

Remplacer le contenu de `src/lib/off-client.ts` :

```typescript
export interface StructuredIngredient {
  text: string;
  percentEstimate: number | null;
}

export interface OffProduct {
  productName: string;
  ingredientsText: string;
  imageUrl: string | null;
  lang: string | null;
  structuredIngredients: StructuredIngredient[];
}

interface OffApiResponse {
  status: number;
  product?: {
    product_name?: string;
    ingredients_text?: string;
    image_url?: string;
    lang?: string;
    ingredients?: { text?: string; percent_estimate?: number }[];
  };
}

export async function getProductByBarcode(
  ean: string
): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${ean}.json`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data: OffApiResponse = await response.json();

  if (data.status !== 1 || !data.product) {
    return null;
  }

  const structuredIngredients: StructuredIngredient[] = (
    data.product.ingredients ?? []
  ).map((ingredient) => ({
    text: ingredient.text ?? "",
    percentEstimate: ingredient.percent_estimate ?? null,
  }));

  return {
    productName: data.product.product_name ?? "",
    ingredientsText: data.product.ingredients_text ?? "",
    imageUrl: data.product.image_url ?? null,
    lang: data.product.lang ?? null,
    structuredIngredients,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/off-client.test.ts`
Expected: PASS (7 tests : 4 existants + 3 nouveaux).

- [ ] **Step 5: Commit**

```bash
git add src/lib/off-client.ts src/lib/off-client.test.ts
git commit -m "Expose Open Food Facts structured ingredients with percent_estimate"
```

---

### Task 3: Proportion-based level degradation in the oxalate matcher

**Files:**
- Modify: `src/lib/oxalate-matcher.ts`
- Modify: `src/lib/oxalate-matcher.test.ts`

**Interfaces:**
- Consumes: `StructuredIngredient` de `src/lib/off-client.ts` (`{ text: string; percentEstimate: number | null }`).
- Produces:
  - `MatchedIngredient` gagne deux champs optionnels : `percentEstimate?: number` et `levelBeforeAdjustment?: OxalateLevel` (présent seulement si une dégradation a eu lieu).
  - `export function matchStructuredIngredients(structuredIngredients: StructuredIngredient[]): MatchResult` — nouvelle fonction publique, qui pour chaque entrée applique le matching mot-clé existant sur `text`, puis dégrade le niveau matché selon `percentEstimate` s'il est connu, avant d'agréger comme `matchIngredients` le fait aujourd'hui (max des niveaux, dédoublonnage).
  - `matchIngredients(text: string)` reste inchangée en signature et en comportement pour tout appelant qui ne fournit que du texte brut (pas de `percentEstimate` disponible → jamais de dégradation).

- [ ] **Step 1: Write the failing tests**

Ajouter à la fin de `src/lib/oxalate-matcher.test.ts` (avant la fermeture du `describe("matchIngredients", ...)`, comme nouveau bloc `describe` séparé) :

```typescript
import { matchStructuredIngredients } from "./oxalate-matcher";

// ... (garder l'import existant de matchIngredients)

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/oxalate-matcher.test.ts`
Expected: FAIL — `matchStructuredIngredients is not a function` (import cassé / export manquant).

- [ ] **Step 3: Write the implementation**

Dans `src/lib/oxalate-matcher.ts` :

1. Étendre `MatchedIngredient` (remplacer l'interface existante, lignes 4-8) :

```typescript
export interface MatchedIngredient {
  ingredientText: string;
  dbItem: string;
  level: OxalateLevel;
  percentEstimate?: number;
  levelBeforeAdjustment?: OxalateLevel;
}
```

2. Ajouter, après la définition de `levelRank`-style logique (mais avant `matchIngredients`, en réutilisant le même `levelRank` qui existe déjà en bas de fichier — le déplacer au niveau module pour le réutiliser dans les deux fonctions) : extraire `LEVEL_RANK` en constante de module juste après `KNOWN_INGREDIENTS` :

```typescript
const LEVEL_RANK: Record<OxalateLevel, number> = {
  "faible": 0,
  "modéré": 1,
  "élevé": 2,
  "très élevé": 3,
};

const LEVELS_BY_RANK: OxalateLevel[] = ["faible", "modéré", "élevé", "très élevé"];

function degradeByProportion(level: OxalateLevel, percent: number): OxalateLevel {
  if (percent >= 10) return level;
  const tiersDown = percent >= 2 ? 1 : 2;
  const currentRank = LEVEL_RANK[level];
  const newRank = Math.max(0, currentRank - tiersDown);
  return LEVELS_BY_RANK[newRank];
}
```

3. Dans `matchIngredients`, remplacer le bloc local `const levelRank: Record<OxalateLevel, number> = {...}` par une référence à `LEVEL_RANK` (supprimer la déclaration locale dupliquée, garder `deduped.reduce((max, m) => LEVEL_RANK[m.level] > LEVEL_RANK[max.level] ? m : max)`).

4. Extraire la logique de matching mot-clé par texte (aujourd'hui inline dans `matchIngredients`) dans une fonction interne réutilisable, puis ajouter `matchStructuredIngredients` :

```typescript
function matchKnownIngredientsInText(normalized: string): MatchedIngredient[] {
  const matched: MatchedIngredient[] = [];

  for (const known of KNOWN_INGREDIENTS) {
    const normalizedKeyword = normalize(known.keyword);
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedKeyword = escapeRegex(normalizedKeyword);
    const pluralAlternative = known.pluralOverride
      ? `|\\b${escapeRegex(normalize(known.pluralOverride))}\\b`
      : "";
    const exclusionLookahead = known.excludeFollowedBy?.length
      ? `(?! (?:${known.excludeFollowedBy.map((w) => escapeRegex(normalize(w))).join("|")})\\b)`
      : "";
    const keywordPattern = new RegExp(`\\b${escapedKeyword}${exclusionLookahead}s?\\b${pluralAlternative}`);
    if (keywordPattern.test(normalized)) {
      matched.push({
        ingredientText: known.keyword,
        dbItem: known.dbItem,
        level: known.level,
      });
    }
  }

  return matched;
}

function dedupeMatches(matched: MatchedIngredient[]): MatchedIngredient[] {
  return matched.filter(
    (m) =>
      !matched.some(
        (other) =>
          other !== m &&
          normalize(other.ingredientText).includes(normalize(m.ingredientText))
      )
  );
}

function aggregateResult(deduped: MatchedIngredient[]): MatchResult {
  if (deduped.length === 0) {
    return { level: "non déterminable", matchedIngredients: [] };
  }

  const highest = deduped.reduce((max, m) =>
    LEVEL_RANK[m.level] > LEVEL_RANK[max.level] ? m : max
  );

  return { level: highest.level, matchedIngredients: deduped };
}

export function matchStructuredIngredients(
  structuredIngredients: StructuredIngredient[]
): MatchResult {
  const allMatches: MatchedIngredient[] = [];

  for (const ingredient of structuredIngredients) {
    const normalized = normalize(ingredient.text);
    const matches = matchKnownIngredientsInText(normalized);
    for (const match of matches) {
      if (ingredient.percentEstimate === null) {
        allMatches.push(match);
        continue;
      }
      const adjustedLevel = degradeByProportion(match.level, ingredient.percentEstimate);
      allMatches.push({
        ...match,
        level: adjustedLevel,
        percentEstimate: ingredient.percentEstimate,
        ...(adjustedLevel !== match.level ? { levelBeforeAdjustment: match.level } : {}),
      });
    }
  }

  return aggregateResult(dedupeMatches(allMatches));
}
```

5. Réécrire `matchIngredients` pour réutiliser `matchKnownIngredientsInText`, `dedupeMatches`, `aggregateResult` :

```typescript
export function matchIngredients(ingredientsText: string): MatchResult {
  const trimmed = ingredientsText.trim();
  if (!trimmed) {
    return { level: "non déterminable", matchedIngredients: [] };
  }

  const normalized = normalize(trimmed);
  const matched = matchKnownIngredientsInText(normalized);
  const deduped = dedupeMatches(matched);

  return aggregateResult(deduped);
}
```

6. Ajouter l'import du type `StructuredIngredient` en haut du fichier :

```typescript
import type { StructuredIngredient } from "./off-client";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/oxalate-matcher.test.ts`
Expected: PASS (tous les tests existants + les 8 nouveaux du bloc `matchStructuredIngredients`). Prêter attention particulière aux tests existants sur le dédoublonnage et les faux positifs (potato starch, etc.) — ils doivent passer sans modification puisque `matchIngredients` garde le même comportement observable.

- [ ] **Step 5: Commit**

```bash
git add src/lib/oxalate-matcher.ts src/lib/oxalate-matcher.test.ts
git commit -m "Degrade matched ingredient level by declared proportion thresholds"
```

---

### Task 4: ProductResolver module

**Files:**
- Create: `src/lib/product-resolver.ts`
- Test: `src/lib/product-resolver.test.ts`

**Interfaces:**
- Consumes:
  - `normalizeGtin` de `src/lib/gtin.ts` (Task 1).
  - `getProductByBarcode`, `OffProduct` de `src/lib/off-client.ts` (Task 2).
- Produces:
  - `export interface ResolvedProduct { gtin: string; rawCode: string; productName: string; ingredientsText: string; structuredIngredients: StructuredIngredient[]; imageUrl: string | null; lang: string | null; sources: string[]; }`
  - `export async function resolveProduct(rawCode: string): Promise<ResolvedProduct | null>` — retourne `null` si le code-barres est invalide (checksum GS1 échoué) OU si aucune source ne connaît le produit. Ne fait pas de requête réseau si le GTIN est invalide.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/product-resolver.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveProduct } from "./product-resolver";
import { getProductByBarcode } from "./off-client";

vi.mock("./off-client");

describe("resolveProduct", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a normalized product when Open Food Facts finds the barcode", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
      lang: "fr",
      structuredIngredients: [],
    });

    const result = await resolveProduct("3017620422003");

    expect(result).toEqual({
      gtin: "03017620422003",
      rawCode: "3017620422003",
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      structuredIngredients: [],
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
      lang: "fr",
      sources: ["open_food_facts"],
    });
    expect(getProductByBarcode).toHaveBeenCalledWith("3017620422003");
  });

  it("returns null without calling Open Food Facts when the barcode checksum is invalid", async () => {
    const result = await resolveProduct("3017620422999");

    expect(result).toBeNull();
    expect(getProductByBarcode).not.toHaveBeenCalled();
  });

  it("returns null when Open Food Facts has no product for a validly-formed barcode", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await resolveProduct("3017620422003");

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/product-resolver.test.ts`
Expected: FAIL — `Cannot find module './product-resolver'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/product-resolver.ts
import { normalizeGtin } from "./gtin";
import { getProductByBarcode, type StructuredIngredient } from "./off-client";

export interface ResolvedProduct {
  gtin: string;
  rawCode: string;
  productName: string;
  ingredientsText: string;
  structuredIngredients: StructuredIngredient[];
  imageUrl: string | null;
  lang: string | null;
  sources: string[];
}

export async function resolveProduct(
  rawCode: string
): Promise<ResolvedProduct | null> {
  const normalized = normalizeGtin(rawCode);
  if (!normalized) {
    return null;
  }

  const offProduct = await getProductByBarcode(normalized.rawCode);
  if (!offProduct) {
    return null;
  }

  return {
    gtin: normalized.normalizedGtin14,
    rawCode: normalized.rawCode,
    productName: offProduct.productName,
    ingredientsText: offProduct.ingredientsText,
    structuredIngredients: offProduct.structuredIngredients,
    imageUrl: offProduct.imageUrl,
    lang: offProduct.lang,
    sources: ["open_food_facts"],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/product-resolver.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/product-resolver.ts src/lib/product-resolver.test.ts
git commit -m "Add ProductResolver orchestrating GTIN validation and Open Food Facts lookup"
```

---

### Task 5: Wire ProductResolver + proportion-aware matching into ResultView

**Files:**
- Modify: `src/components/ResultView.tsx`
- Modify: `src/components/ResultView.test.tsx`

**Interfaces:**
- Consumes:
  - `resolveProduct`, `ResolvedProduct` de `src/lib/product-resolver.ts` (Task 4).
  - `matchStructuredIngredients`, `matchIngredients` de `src/lib/oxalate-matcher.ts` (Task 3).
- Produces: aucun nouvel export — composant terminal de cette chaîne.

**Comportement cible :**
- `ResultView` appelle `resolveProduct(ean)` au lieu de `getProductByBarcode(ean)`.
- Si `structuredIngredients` n'est pas vide, le matching passe par `matchStructuredIngredients(product.structuredIngredients)` (proportions prises en compte). Sinon, fallback sur `matchIngredients(product.ingredientsText)` (comportement actuel, texte brut).
- L'affichage de chaque ingrédient matché montre son pourcentage et une mention d'atténuation quand `percentEstimate` et `levelBeforeAdjustment` sont présents, ex. : `noisette (0,8%, contribution réduite)`.
- La saisie manuelle (`handleManualSubmit`) continue d'utiliser `matchIngredients` sur texte libre — aucune proportion disponible dans ce flux.

- [ ] **Step 1: Update existing tests to mock `resolveProduct` instead of `getProductByBarcode`**

Dans `src/components/ResultView.test.tsx` :

1. Remplacer l'import et le mock en tête de fichier :

```typescript
import { ResultView, categorizeFailure } from "./ResultView";
import { resolveProduct } from "../lib/product-resolver";
import { pb } from "../lib/pocketbase";
import { uploadIngredientsPhoto } from "../lib/off-contribute";
import { lookupProductName } from "../lib/upcitemdb-client";

vi.mock("../lib/product-resolver");
vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
    authStore: { record: { id: "user123" } },
  },
}));
vi.mock("../lib/off-contribute");
vi.mock("../lib/upcitemdb-client");
```

2. Remplacer chaque occurrence de `(getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({...})` par `(resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({...})`. Comme le mock est typé `ReturnType<typeof vi.fn>` (donc non contraint par la signature réelle de `resolveProduct` — `vi.mock("../lib/product-resolver")` remplace la fonction par un mock non typé), TypeScript n'exige pas que ces littéraux respectent `ResolvedProduct` au complet ; mais pour que `ResultView` se comporte comme avant (fallback texte), chaque objet mocké doit tout de même recevoir `structuredIngredients: []` explicitement — c'est ce champ, et lui seul, qui pilote le choix entre `matchStructuredIngredients` et `matchIngredients` dans le composant. Les champs `gtin`, `rawCode`, `sources` ne sont lus par aucun code de `ResultView` dans cette tranche et peuvent rester absents des mocks existants sans casser quoi que ce soit.

Les appels à `categorizeFailure(result, { productName: ..., ingredientsText: ..., imageUrl: ..., lang: ... })` dans le bloc `describe("categorizeFailure", ...)` (lignes 20-52 du fichier actuel) restent inchangés tels quels : après le step 3.2 de cette tâche, `categorizeFailure` prend en second paramètre le type structurel `{ ingredientsText: string }`, et TypeScript accepte un objet littéral portant des propriétés supplémentaires (`productName`, `imageUrl`, `lang`) tant qu'il est passé via cette forme directe — aucune modification requise sur ce bloc de tests.

Chaque bloc du fichier suit ce même remplacement mécanique : `getProductByBarcode` → `resolveProduct`, et chaque objet mocké gagne `structuredIngredients: []` sauf le nouveau test ajouté ci-dessous qui teste explicitement les proportions.

3. Ajouter un nouveau bloc de tests à la fin du fichier :

```typescript
describe("ResultView proportion-aware matching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockResolvedValue({ id: "scan1" }),
    });
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("keeps a high level and shows the percentage for a dominant risky ingredient", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000",
      rawCode: "0000000000000",
      productName: "Épinards à la crème",
      ingredientsText: "Épinards 55%, crème 20%, sel",
      structuredIngredients: [
        { text: "Épinards", percentEstimate: 55 },
        { text: "crème", percentEstimate: 20 },
        { text: "sel", percentEstimate: 5 },
      ],
      imageUrl: null,
      lang: "fr",
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(screen.getByText(/epinard.*55%/i)).toBeInTheDocument();
  });

  it("shows a reduced-contribution note for a low-proportion risky ingredient", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000",
      rawCode: "0000000000000",
      productName: "Biscuit noisettes",
      ingredientsText: "Farine de blé, noisettes 0.8%, sucre",
      structuredIngredients: [
        { text: "Farine de blé", percentEstimate: 70 },
        { text: "noisettes", percentEstimate: 0.8 },
        { text: "sucre", percentEstimate: 20 },
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

  it("falls back to plain-text matching when Open Food Facts has no structured ingredients", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000",
      rawCode: "0000000000000",
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      structuredIngredients: [],
      imageUrl: null,
      lang: "fr",
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    // No percentage shown when there was nothing to weight against.
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ResultView.test.tsx`
Expected: FAIL — `resolveProduct` mock non appelé (le composant appelle encore `getProductByBarcode`), et les 3 nouveaux tests échouent aussi (aucun affichage de pourcentage).

- [ ] **Step 3: Write the implementation**

Dans `src/components/ResultView.tsx` :

1. Remplacer les imports en tête de fichier :

```typescript
import { useEffect, useState, type FormEvent } from "react";
import { resolveProduct, type ResolvedProduct } from "../lib/product-resolver";
import { uploadIngredientsPhoto } from "../lib/off-contribute";
import { matchIngredients, matchStructuredIngredients, type MatchResult } from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";
import { lookupProductName } from "../lib/upcitemdb-client";
import { LevelBadge } from "./LevelBadge";
```

2. `categorizeFailure` prenait un `OffProduct` — changer son paramètre pour accepter la forme minimale nécessaire (`{ ingredientsText: string }`), compatible avec `ResolvedProduct` et avec l'objet construit par la saisie manuelle :

```typescript
export function categorizeFailure(
  result: MatchResult,
  product: { ingredientsText: string }
): ScanFailureReason | null {
  if (result.level !== "non déterminable") return null;
  if (!product.ingredientsText.trim()) return "no-ingredients";
  return "no-match";
}
```

3. `LoadState` utilise `ResolvedProduct` au lieu de `OffProduct` :

```typescript
type LoadState =
  | { status: "loading" }
  | { status: "found"; product: ResolvedProduct; result: MatchResult }
  | { status: "not-found" };
```

4. Dans le `useEffect`, remplacer l'appel et le choix de la fonction de matching :

```typescript
  useEffect(() => {
    let cancelled = false;
    resolveProduct(ean).then((product) => {
      if (cancelled) return;
      if (!product) {
        setState({ status: "not-found" });
        lookupProductName(ean).then((name) => {
          if (cancelled || !name) return;
          setManualName(name);
        });
        return;
      }
      const result =
        product.structuredIngredients.length > 0
          ? matchStructuredIngredients(product.structuredIngredients)
          : matchIngredients(product.ingredientsText);
      setState({ status: "found", product, result });
      saveScan({
        ean,
        productName: product.productName,
        level: result.level,
        source: "off",
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ean]);
```

5. `handleManualSubmit` construit aujourd'hui un objet `OffProduct`-shaped littéral pour `setState`. Adapter au type `ResolvedProduct` (les champs absents dans ce flux prennent une valeur neutre) :

```typescript
  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const result = matchIngredients(manualIngredients);
    setState({
      status: "found",
      product: {
        gtin: ean,
        rawCode: ean,
        productName: manualName,
        ingredientsText: manualIngredients,
        structuredIngredients: [],
        imageUrl: null,
        lang: null,
        sources: ["saisie_manuelle"],
      },
      result,
    });
    await saveScan({
      ean,
      productName: manualName,
      level: result.level,
      source: "saisie_manuelle",
    });
  }
```

6. Dans le rendu de la liste d'ingrédients matchés (le bloc `<p className="ingredient-line">Ingrédients à risque détectés : ...</p>`), afficher le pourcentage et la mention d'atténuation :

```tsx
        {state.result.matchedIngredients.length > 0 && (
          <p className="ingredient-line">
            Ingrédients à risque détectés :{" "}
            {state.result.matchedIngredients.map((m, index) => (
              <strong key={index}>
                {m.ingredientText}
                {m.percentEstimate !== undefined &&
                  ` (${m.percentEstimate.toString().replace(".", ",")}%${
                    m.levelBeforeAdjustment ? ", contribution réduite" : ""
                  })`}
                {index < state.result.matchedIngredients.length - 1 ? ", " : ""}
              </strong>
            ))}
            .
          </p>
        )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ResultView.test.tsx`
Expected: PASS (tous les tests existants adaptés + les 3 nouveaux du bloc "proportion-aware matching").

- [ ] **Step 5: Full project verification**

Run: `npx tsc -b`
Expected: aucune erreur (en particulier aucun import inutilisé — `OffProduct` ne doit plus être importé dans `ResultView.tsx`/`ResultView.test.tsx` s'il n'est plus utilisé).

Run: `npm test`
Expected: 100% des suites passent, aucune régression sur les autres composants (`FoodSearchView`, `HistoryView`, etc. ne sont pas touchés par ce plan).

- [ ] **Step 6: Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Wire ProductResolver and proportion-aware matching into ResultView"
```

---

## Post-plan note

Ce plan ne touche pas `scripts/build-apk.sh` ni le déploiement — une fois les 5 tâches mergées, suivre le processus habituel du projet (rebuild web/APK) si une mise en production est souhaitée, en dehors du périmètre de ce plan.
