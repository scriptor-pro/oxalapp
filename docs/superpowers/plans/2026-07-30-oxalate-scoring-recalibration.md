# Recalibration du score oxalate — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recalibrer les seuils de niveau d'oxalate (faible/modéré/élevé/très
élevé) sur la classification clinique Mayo Clinic, reclasser la base de
données locale en conséquence, mettre à jour les niveaux du matcher
d'ingrédients, et rendre l'UI transparente sur les limites méthodologiques
du matching par mot-clé.

**Architecture:** Un script Python ponctuel reclasse les 737 entrées de
`src/data/oxalate-database.json` selon les nouveaux seuils et ajoute deux
champs de fourchette d'incertitude par entrée. `src/lib/oxalate-matcher.ts`
est mis à jour avec les nouveaux niveaux pour ses 10 mots-clés connus.
`ResultView.tsx` gagne une mention de limite méthodologique. Aucun nouveau
composant, aucune nouvelle dépendance.

**Tech Stack:** TypeScript, React 19, Vitest. Python 3 (ponctuel, hors
build, pour la transformation de données JSON — déjà utilisé ad hoc dans ce
projet pour inspecter `oxalate-database.json`).

## Global Constraints

- Seuils : faible <5 mg/portion, modéré 5–8 mg/portion, élevé 8–25
  mg/portion, très élevé >25 mg/portion — appliqués sur `oxalatePerServing`
  (spec §1).
- `avgOxalatePer100g`, `servingSize`, `servingGrams`, `oxalatePerServing`
  ne changent pas de valeur — seul `level` est recalculé (spec §2).
- Fourchette d'incertitude : ±35 % autour de `oxalatePerServing`, stockée
  dans deux nouveaux champs `oxalatePerServingMin` /
  `oxalatePerServingMax`, arrondis à 1 décimale — donnée ajoutée mais sans
  consommateur UI dans ce plan (spec §5).
- Le principe de matching par mot-clé de `oxalate-matcher.ts` ne change
  pas, seuls les niveaux associés changent (spec §3).
- La mention de limite méthodologique n'apparaît que pour les résultats
  issus du matching d'ingrédients (`state.status === "found"`), pas pour un
  futur résultat de recherche d'aliment brut (spec §4 — hors périmètre de
  ce plan, mais la condition doit être posée correctement dès maintenant).

---

### Task 1: Reclassement de `oxalate-database.json`

**Files:**
- Modify: `src/data/oxalate-database.json` (regénéré en place)
- Create: `scripts/recalibrate-oxalate-database.py` (script ponctuel,
  conservé dans le repo pour traçabilité/reproductibilité)
- Test: `src/data/oxalate-database.test.ts`

**Interfaces:**
- Consumes: rien (première tâche)
- Produces: chaque entrée de `oxalate-database.json` gagne/maintient les
  champs `item: string`, `avgOxalatePer100g: number`, `servingSize:
  string`, `servingGrams: number`, `oxalatePerServing: number`, `level:
  "faible" | "modéré" | "élevé" | "très élevé"`, et deux nouveaux champs
  `oxalatePerServingMin: number`, `oxalatePerServingMax: number`. Les
  tâches suivantes (2, 3) consomment `level` et les nouveaux champs de
  fourchette par leur nom exact.

- [ ] **Step 1: Écrire le test qui vérifie le contrat de la base reclassée**

Créer `src/data/oxalate-database.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import database from "./oxalate-database.json";

interface OxalateEntry {
  item: string;
  avgOxalatePer100g: number;
  servingSize: string;
  servingGrams: number;
  oxalatePerServing: number;
  oxalatePerServingMin: number;
  oxalatePerServingMax: number;
  level: "faible" | "modéré" | "élevé" | "très élevé";
}

const entries = database as OxalateEntry[];

function expectedLevel(mg: number): OxalateEntry["level"] {
  if (mg < 5) return "faible";
  if (mg < 8) return "modéré";
  if (mg < 25) return "élevé";
  return "très élevé";
}

describe("oxalate-database.json", () => {
  it("has 737 entries", () => {
    expect(entries.length).toBe(737);
  });

  it("classifies every entry per the Mayo Clinic thresholds on oxalatePerServing", () => {
    for (const entry of entries) {
      expect(entry.level).toBe(expectedLevel(entry.oxalatePerServing));
    }
  });

  it("stores a ±35% uncertainty range around oxalatePerServing for every entry", () => {
    for (const entry of entries) {
      const expectedMin = Math.round(entry.oxalatePerServing * 0.65 * 10) / 10;
      const expectedMax = Math.round(entry.oxalatePerServing * 1.35 * 10) / 10;
      expect(entry.oxalatePerServingMin).toBeCloseTo(expectedMin, 1);
      expect(entry.oxalatePerServingMax).toBeCloseTo(expectedMax, 1);
    }
  });

  it("reclassifies spinach as très élevé", () => {
    const spinach = entries.find(
      (e) => e.item === "Spinach, fresh or frozen, boiled or steamed"
    );
    expect(spinach?.level).toBe("très élevé");
  });

  it("reclassifies green tea as élevé (was faible before recalibration)", () => {
    const greenTea = entries.find((e) =>
      e.item.startsWith("Tea, Green, Multiple Brands")
    );
    expect(greenTea?.level).toBe("élevé");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/data/oxalate-database.test.ts`
Expected: FAIL — la base actuelle n'a ni les bons niveaux ni les champs
`oxalatePerServingMin`/`oxalatePerServingMax`.

- [ ] **Step 3: Écrire le script de reclassement**

Créer `scripts/recalibrate-oxalate-database.py` :

```python
#!/usr/bin/env python3
"""Reclassify oxalate-database.json against the Mayo Clinic thresholds
and add a ±35% uncertainty range per entry. Idempotent: safe to re-run.
"""
import json
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "src" / "data" / "oxalate-database.json"


def classify(mg_per_serving: float) -> str:
    if mg_per_serving < 5:
        return "faible"
    if mg_per_serving < 8:
        return "modéré"
    if mg_per_serving < 25:
        return "élevé"
    return "très élevé"


def main() -> None:
    with DB_PATH.open(encoding="utf-8") as f:
        entries = json.load(f)

    for entry in entries:
        mg = entry["oxalatePerServing"]
        entry["level"] = classify(mg)
        entry["oxalatePerServingMin"] = round(mg * 0.65, 1)
        entry["oxalatePerServingMax"] = round(mg * 1.35, 1)

    with DB_PATH.open("w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Exécuter le script**

Run: `python3 scripts/recalibrate-oxalate-database.py`
Expected: pas de sortie, le fichier `src/data/oxalate-database.json` est
réécrit en place.

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/data/oxalate-database.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/recalibrate-oxalate-database.py src/data/oxalate-database.json src/data/oxalate-database.test.ts
git commit -m "Recalibrate oxalate-database.json on Mayo Clinic thresholds

Reclassify all 737 entries using faible<5/modéré5-8/élevé8-25/très
élevé>25 mg per serving, and add a ±35% uncertainty range per entry
(oxalatePerServingMin/Max)."
```

---

### Task 2: Mise à jour des niveaux dans `oxalate-matcher.ts`

**Files:**
- Modify: `src/lib/oxalate-matcher.ts:25-36`
- Modify: `src/lib/oxalate-matcher.test.ts`

**Interfaces:**
- Consumes: aucune dépendance sur les fichiers de la Task 1 (les niveaux
  ci-dessous sont des littéraux déjà déterminés à partir de la base
  reclassée — pas d'import de `oxalate-database.json` dans ce fichier,
  cohérent avec le principe actuel du matcher qui ne lit pas ce JSON).
- Produces: `KNOWN_INGREDIENTS: KnownIngredient[]` avec les niveaux
  recalibrés. Aucun changement de signature de `matchIngredients` ni des
  types exportés (`OxalateLevel`, `MatchLevel`, `MatchedIngredient`,
  `MatchResult`) — Task 3 n'en dépend pas de toute façon.

- [ ] **Step 1: Mettre à jour les tests pour refléter les niveaux recalibrés**

Remplacer le contenu de `src/lib/oxalate-matcher.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { matchIngredients } from "./oxalate-matcher";

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

  it("reclassifies green tea as élevé after recalibration (was faible)", () => {
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
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npx vitest run src/lib/oxalate-matcher.test.ts`
Expected: FAIL sur les 3 nouveaux tests (thé vert, amande, betterave) —
`KNOWN_INGREDIENTS` a encore les anciens niveaux.

- [ ] **Step 3: Mettre à jour `KNOWN_INGREDIENTS`**

Dans `src/lib/oxalate-matcher.ts`, remplacer les lignes 25-36 :

```typescript
// Curated high-signal keywords. Sourced from CLAUDE.md's list of known
// risk ingredients, reclassified per the Mayo Clinic Oxalate Diet
// Handbook thresholds (faible<5/modéré5-8/élevé8-25/très élevé>25
// mg/portion — see docs/superpowers/specs/2026-07-30-oxalate-scoring-recalibration-design.md).
// Deliberately excludes short/generic PDF item names (e.g. "Salt") that
// would false-positive against unrelated ingredient text.
const KNOWN_INGREDIENTS: KnownIngredient[] = [
  { keyword: "cacao", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé" },
  { keyword: "cocoa", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé" },
  { keyword: "epinard", dbItem: "Spinach", level: "très élevé" },
  { keyword: "rhubarbe", dbItem: "Rhubarb, stewed or canned", level: "très élevé" },
  { keyword: "amande", dbItem: "Almonds", level: "très élevé" },
  { keyword: "son de ble", dbItem: "Wheat Bran", level: "très élevé" },
  { keyword: "betterave", dbItem: "Beets, boiled, steamed or pickled", level: "très élevé" },
  { keyword: "patate douce", dbItem: "Sweet Potato, Orange", level: "très élevé" },
  { keyword: "the noir", dbItem: "Tea, Black", level: "très élevé" },
  { keyword: "the vert", dbItem: "Tea, Green", level: "élevé" },
];
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npx vitest run src/lib/oxalate-matcher.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/oxalate-matcher.ts src/lib/oxalate-matcher.test.ts
git commit -m "Recalibrate KNOWN_INGREDIENTS levels on Mayo Clinic thresholds

amande, son de blé, betterave, patate douce, thé noir now map to
très élevé; thé vert now maps to élevé (was faible)."
```

---

### Task 3: Mention de limite méthodologique dans `ResultView`

**Files:**
- Modify: `src/components/ResultView.tsx:106-124`
- Modify: `src/components/ResultView.test.tsx`

**Interfaces:**
- Consumes: rien de Task 1/2 (pas de nouveau champ de données, pas de
  nouvelle prop). S'appuie uniquement sur `state.status === "found"`, déjà
  existant.
- Produces: rien consommé par une tâche suivante (dernière tâche du plan).

- [ ] **Step 1: Écrire le test pour la nouvelle mention**

Ajouter à `src/components/ResultView.test.tsx`, dans le bloc `describe`
existant (après le test `"shows the oxalate level when the product is
found on Open Food Facts"`), en suivant exactement le même pattern de
mock que ce test voisin :

```typescript
  it("shows a methodological caveat for ingredient-keyword-based results", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      imageUrl: null,
    });

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    expect(
      await screen.findByText(
        /reflète la présence d'un ingrédient connu.*pas une quantité mesurée dans ce produit précis/
      )
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/ResultView.test.tsx`
Expected: FAIL — le texte n'existe pas encore dans le composant.

- [ ] **Step 3: Ajouter la mention dans le composant**

Dans `src/components/ResultView.tsx`, modifier le bloc de rendu final
(lignes 106-124) pour ajouter la mention juste après le bloc existant
d'estimation indicative :

```tsx
  return (
    <div>
      <h2>{state.product.productName}</h2>
      <p>Niveau d'oxalate estimé : {state.result.level}</p>
      {state.result.matchedIngredients.length > 0 && (
        <ul>
          {state.result.matchedIngredients.map((m, index) => (
            <li key={index}>{m.ingredientText}</li>
          ))}
        </ul>
      )}
      <p>
        Estimation indicative — les valeurs d'oxalate varient selon la
        variété, le sol, la cuisson, etc.
      </p>
      <p>
        Ce niveau reflète la présence d'un ingrédient connu pour sa teneur
        en oxalate, pas une quantité mesurée dans ce produit précis.
      </p>
      {syncError && <p>Échec de synchronisation avec l'historique.</p>}
      <button onClick={onBack}>Retour</button>
    </div>
  );
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/components/ResultView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Lancer la suite complète pour vérifier l'absence de régression**

Run: `npx vitest run --exclude '**/.claude/**'`
Expected: tous les tests passent (37 tests existants + 5 ajoutés en
Task 1 + 3 ajoutés en Task 2 + 1 ajouté en Task 3 = 46 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Add methodological caveat to ingredient-keyword-based results

Clarifies that the displayed level reflects the presence of a known
risk ingredient, not a measured quantity in this specific product —
no published method models this estimation from an ingredient list
(see 2026-07-30-oxalate-scoring-recalibration-design.md)."
```

---

## Post-plan check

Après la Task 3, lancer une dernière fois la suite complète :

Run: `npx vitest run --exclude '**/.claude/**'`
Expected: PASS, tous fichiers de test confondus.

Ceci clôt le recalibrage. La fonctionnalité "recherche par nom d'aliment"
(mise en pause) et son propre design restent à reprendre séparément — elle
pourra directement consommer `oxalatePerServingMin`/`Max` ajoutés en
Task 1.
