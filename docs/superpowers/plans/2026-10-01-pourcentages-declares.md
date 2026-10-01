# Pourcentages déclarés sur l'étiquette — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** quand l'étiquette déclare un pourcentage (champ OFF `percent`), retenir le plus grand du
déclaré et de l'estimé, pour qu'une erreur de découpage d'OFF ne minimise plus un ingrédient à
risque (Petit Écolier : chocolat 48 % déclaré, 1,07 % estimé).

**Architecture :** un champ optionnel `percentDeclared` sur `StructuredIngredient`, rempli par les
trois lecteurs des ingrédients OFF (app, audit, produits réels figés). `matchStructuredIngredients`
calcule une proportion retenue (le plus grand des deux, après `sanitizePercent`) et l'utilise
partout où l'estimation servait. Aucun changement d'interface.

**Tech Stack :** TypeScript, React 19, Vitest, Node 24.

**Spec :** `docs/superpowers/specs/2026-10-01-pourcentages-declares-design.md`

## Global Constraints

- Branche : `feature/pourcentages-declares` (déjà créée à partir de `feature/ble-chocolat`).
- Premier niveau d'ingrédients OFF seulement ; pas de sous-ingrédients, pas de conversion des
  pourcentages relatifs.
- Règle : `sanitizePercent` sur chaque valeur, puis le plus grand des deux ; une seule présente →
  elle ; aucune → `null`.
- Le champ de sortie garde le nom `percentEstimate` (proportion retenue).
- Aucun changement d'interface dans `ResultView`.
- Commentaires et messages en français dans le code, messages de commit en anglais terminés par
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- `percent: 0` déclaré pour un ingrédient (OFF le produit parfois) : la règle prend le plus grand,
  donc l'estimation l'emporte ; un `0` ne doit jamais être traité comme « absent » au point de
  perdre une estimation non nulle, ni l'inverse. Test en tâche 1.
- `percent` déclaré mais `percent_estimate` absent : la proportion retenue est le déclaré (et non
  `null`). Test en tâche 1.
- Un ingrédient inconnu dont le déclaré le rend significatif (≥ 2 %) alors que l'estimé le disait
  négligeable : le produit devient « non déterminable » (prudent). Test en tâche 1.
- Les produits sans aucun `percent` (la majorité des produits figés) : résultat strictement
  inchangé. Couvert par les tests sur produits réels existants (tâche 2).
- `percent` non numérique ou absurde (> 100) venant d'OFF : ignoré, sans exception. Test en tâche 1
  (150) ; `off-client` ne recopie que les nombres (tâche 2).

---

### Task 1 : Règle « le plus grand des deux » dans le matcher

**Files :**
- Modify : `src/lib/off-client.ts` (interface `StructuredIngredient` uniquement)
- Modify : `src/lib/oxalate-matcher.ts` (interfaces de sortie, `matchStructuredIngredients`)
- Test : `src/lib/oxalate-matcher.test.ts`

**Interfaces :**
- Produces : `StructuredIngredient.percentDeclared?: number | null` ; dans le matcher, la fonction
  interne `retainedPercent(ingredient: StructuredIngredient): number | null`.

- [ ] **Step 1 : Ajouter le champ à l'interface** — dans `src/lib/off-client.ts`, dans
  `interface StructuredIngredient`, juste après `percentEstimate: number | null;` :

```ts
  // Pourcentage déclaré sur l'étiquette (champ OFF `percent`), quand il
  // existe. Premier niveau seulement, comme percentEstimate. Le matcher
  // retient le plus grand des deux (spec 2026-10-01-pourcentages-declares).
  percentDeclared?: number | null;
```

- [ ] **Step 2 : Écrire les tests** — à la fin de `src/lib/oxalate-matcher.test.ts` :

```ts
describe("pourcentages déclarés sur l'étiquette (spec 2026-10-01-pourcentages-declares)", () => {
  it("retient le déclaré quand il dépasse l'estimation (Petit Écolier)", () => {
    const result = matchStructuredIngredients([
      { text: "PETIT BEURRE", percentEstimate: 53.5, percentDeclared: 52, offId: "en:petit-beurre" },
      { text: "sucre", percentEstimate: 16.47, offId: "en:sugar" },
      { text: "Chocolat au LAIT", percentEstimate: 1.07, percentDeclared: 48, offId: "en:milk-chocolate" },
    ]);
    expect(result.level).toBe("très élevé");
    const chocolate = result.matchedIngredients.find((m) => m.labelText === "Chocolat au LAIT");
    expect(chocolate?.percentEstimate).toBe(48);
    expect(chocolate?.level).toBe("très élevé");
  });

  it("garde l'estimation quand le déclaré est plus petit", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 96.5, offId: "en:milk" },
      { text: "amande", percentEstimate: 3.5, percentDeclared: 1.5, offId: "en:almond" },
    ]);
    expect(result.matchedIngredients[0].percentEstimate).toBe(3.5);
    expect(result.level).toBe("élevé");
  });

  it("retient le déclaré quand l'estimation manque", () => {
    const result = matchStructuredIngredients([
      { text: "chocolat", percentEstimate: null, percentDeclared: 48, offId: "en:milk-chocolate" },
      { text: "sucre", percentEstimate: null, offId: "en:sugar" },
    ]);
    expect(result.matchedIngredients[0].percentEstimate).toBe(48);
  });

  it("garde l'estimation quand le déclaré vaut 0", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 70, offId: "en:milk" },
      { text: "chocolat", percentEstimate: 30, percentDeclared: 0, offId: "en:milk-chocolate" },
    ]);
    expect(result.matchedIngredients[0].percentEstimate).toBe(30);
    expect(result.level).toBe("très élevé");
  });

  it("ignore un déclaré absurde", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 70, offId: "en:milk" },
      { text: "chocolat", percentEstimate: 30, percentDeclared: 150, offId: "en:milk-chocolate" },
    ]);
    expect(result.matchedIngredients[0].percentEstimate).toBe(30);
  });

  it("rend significatif un inconnu dont le déclaré dépasse 2 %", () => {
    const result = matchStructuredIngredients([
      { text: "lait", percentEstimate: 89, offId: "en:milk" },
      { text: "ingrédient mystère", percentEstimate: 1, percentDeclared: 10, offId: "en:mystery" },
    ]);
    expect(result.level).toBe("non déterminable");
    expect(result.unknownIngredients).toEqual([
      { text: "ingrédient mystère", offId: "en:mystery", percentEstimate: 10 },
    ]);
  });
});
```

- [ ] **Step 3 : Vérifier l'échec** — Run :
  `npx vitest run src/lib/oxalate-matcher.test.ts -t "pourcentages déclarés"`.
  Expected : FAIL sur « retient le déclaré quand il dépasse l'estimation », « retient le déclaré
  quand l'estimation manque » et « rend significatif un inconnu… » (le déclaré est encore ignoré).
  Les trois autres passent déjà : ils protègent le comportement actuel.

- [ ] **Step 4 : Implémenter** — dans `src/lib/oxalate-matcher.ts` :

(a) juste après la fonction `sanitizePercent`, ajouter :

```ts
// Proportion retenue (spec 2026-10-01-pourcentages-declares) : le plus
// grand du pourcentage déclaré sur l'étiquette et de l'estimation d'OFF.
// OFF découpe parfois mal une liste (« PETIT BEURRE 52 % : farine… ») et
// estime alors le chocolat déclaré à 48 % à 1 % : retenir le plus grand
// ne peut que surestimer un ingrédient, jamais le minimiser.
function retainedPercent(ingredient: StructuredIngredient): number | null {
  const declared = sanitizePercent(ingredient.percentDeclared ?? null);
  const estimated = sanitizePercent(ingredient.percentEstimate);
  if (declared === null) return estimated;
  if (estimated === null) return declared;
  return Math.max(declared, estimated);
}
```

(b) dans `matchStructuredIngredients`, remplacer :

```ts
    const percent = sanitizePercent(ingredient.percentEstimate);
```

par :

```ts
    const percent = retainedPercent(ingredient);
```

(c) dans `interface MatchedIngredient`, remplacer la ligne `percentEstimate?: number;` par :

```ts
  // Proportion retenue : le plus grand du déclaré et de l'estimé.
  percentEstimate?: number;
```

et dans `interface UnknownIngredient`, remplacer `percentEstimate: number | null;` par :

```ts
  // Proportion retenue : le plus grand du déclaré et de l'estimé.
  percentEstimate: number | null;
```

- [ ] **Step 5 : Vérifier** — Run : `npx vitest run src/lib && npx tsc -b`.
  Expected : PASS, `tsc -b` propre.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/off-client.ts src/lib/oxalate-matcher.ts src/lib/oxalate-matcher.test.ts
git commit -m "Retain the larger of declared and estimated ingredient percentages

OFF sometimes mis-splits an ingredient list and estimates a declared 48%
milk chocolate at 1%. Taking the larger value can only overstate an
ingredient, never minimize it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : Lire le champ `percent` d'OFF (app, audit, produits réels)

**Files :**
- Modify : `src/lib/off-client.ts` (type de réponse et mapping)
- Modify : `scripts/audit-non-determinable.test.ts` (type et mapping)
- Modify : `src/lib/oxalate-matcher.fixtures.test.ts` (mapping, attendu Petit Écolier)
- Modify : `src/lib/__fixtures__/off-products.json` (ajout de Petit Écolier)
- Test : `src/lib/off-client.test.ts`, `src/lib/oxalate-matcher.fixtures.test.ts`

**Interfaces :**
- Consumes : `StructuredIngredient.percentDeclared?: number | null` (tâche 1).
- Produces : `percentDeclared` présent seulement quand OFF fournit un `percent` numérique ; absent
  sinon, pour que les objets existants (et leurs tests `toEqual`) restent inchangés.

- [ ] **Step 1 : Écrire le test d'`off-client`** — dans `src/lib/off-client.test.ts`, juste après
  le test « exposes structured ingredients with their percent_estimate when present », ajouter :

```ts
  it("copies the label-declared percent into percentDeclared, only when it is a number", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Petit Écolier",
        ingredients_text: "PETIT BEURRE 52 %: …, Chocolat au LAIT 48%: …",
        image_url: null,
        lang: "fr",
        ingredients: [
          { text: "PETIT BEURRE", percent_estimate: 53.5, percent: 52, id: "en:petit-beurre" },
          { text: "sucre", percent_estimate: 16.47, id: "en:sugar" },
          { text: "Chocolat au LAIT", percent_estimate: 1.07, percent: 48, id: "en:milk-chocolate" },
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

    const result = await getProductByBarcode("7622210421968");

    expect(result?.structuredIngredients).toEqual([
      { text: "PETIT BEURRE", percentEstimate: 53.5, percentDeclared: 52, offId: "en:petit-beurre" },
      { text: "sucre", percentEstimate: 16.47, offId: "en:sugar" },
      { text: "Chocolat au LAIT", percentEstimate: 1.07, percentDeclared: 48, offId: "en:milk-chocolate" },
    ]);
  });
```

- [ ] **Step 2 : Ajouter Petit Écolier aux produits réels** — il est dans l'échantillon d'audit en
  cache local. Run :

```bash
node -e '
const fs = require("fs");
const path = "src/lib/__fixtures__/off-products.json";
const fixture = JSON.parse(fs.readFileSync(path, "utf8"));
const sample = JSON.parse(fs.readFileSync(".cache/off-audit-sample.json", "utf8"));
const p = sample.find((x) => x.code === "7622210421968");
fixture.products.push({
  code: p.code,
  productName: p.product_name,
  ingredients: p.ingredients.map((i) => ({
    id: i.id,
    text: i.text,
    percent_estimate: i.percent_estimate,
    ...(typeof i.percent === "number" ? { percent: i.percent } : {}),
  })),
});
fs.writeFileSync(path, JSON.stringify(fixture, null, 2) + "\n");
'
git diff --stat src/lib/__fixtures__/off-products.json
grep -c '"percent":' src/lib/__fixtures__/off-products.json
```

Expected : seulement des ajouts dans le fichier ; 3 champs `"percent":` (PETIT BEURRE 52, BEURRE
concentré 14, Chocolat au LAIT 48).

Puis, dans `src/lib/oxalate-matcher.fixtures.test.ts` :

(a) ajouter à `EXPECTED`, après la ligne Edelbitter :

```ts
  "7622210421968": { level: "très élevé", unknownTexts: [] }, // Petit Écolier : chocolat déclaré 48 %, estimé 1 % par OFF
```

(b) ajouter à la fin du commentaire au-dessus de `EXPECTED` la phrase :
`// Petit Écolier vérifie la règle des pourcentages déclarés (spec 2026-10-01-pourcentages-declares).`

(c) dans le mapping des ingrédients, remplacer :

```ts
          percentEstimate: ingredient.percent_estimate,
```

par :

```ts
          percentEstimate: ingredient.percent_estimate,
          percentDeclared: (ingredient as { percent?: number }).percent ?? null,
```

- [ ] **Step 3 : Vérifier l'échec** — Run :
  `npx vitest run src/lib/off-client.test.ts src/lib/oxalate-matcher.fixtures.test.ts`.
  Expected : FAIL sur le nouveau test d'`off-client` (`percentDeclared` absent). Le test Petit
  Écolier passe déjà, car la tâche 1 applique la règle et le mapping des produits figés est fait.

- [ ] **Step 4 : Implémenter dans `src/lib/off-client.ts`**

(a) dans `interface OffApiResponse`, remplacer :

```ts
    ingredients?: { text?: string; percent_estimate?: number; id?: string }[];
```

par :

```ts
    ingredients?: { text?: string; percent_estimate?: number; percent?: number; id?: string }[];
```

(b) dans le mapping de `structuredIngredients`, remplacer :

```ts
    percentEstimate: ingredient.percent_estimate ?? null,
    offId: ingredient.id ?? null,
```

par :

```ts
    percentEstimate: ingredient.percent_estimate ?? null,
    // Seulement s'il existe : la plupart des ingrédients n'ont pas de
    // pourcentage déclaré sur l'étiquette.
    ...(typeof ingredient.percent === "number" ? { percentDeclared: ingredient.percent } : {}),
    offId: ingredient.id ?? null,
```

- [ ] **Step 5 : Lire `percent` dans l'audit** — dans `scripts/audit-non-determinable.test.ts` :

(a) dans `interface OffSearchIngredient`, après `percent_estimate?: number;`, ajouter
`percent?: number;` ;

(b) dans `matchProduct`, remplacer :

```ts
    percentEstimate: ingredient.percent_estimate ?? null,
```

par :

```ts
    percentEstimate: ingredient.percent_estimate ?? null,
    percentDeclared: ingredient.percent ?? null,
```

- [ ] **Step 6 : Vérifier** — Run : `npx vitest run && npx tsc -b && npm run lint`.
  Expected : tout passe ; pas de nouvel avertissement de lint.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/off-client.ts src/lib/off-client.test.ts scripts/audit-non-determinable.test.ts src/lib/oxalate-matcher.fixtures.test.ts src/lib/__fixtures__/off-products.json
git commit -m "Read label-declared percentages from Open Food Facts

The app, the audit and the frozen real-product fixtures now pass OFF's
percent field as percentDeclared. Petit Écolier joins the fixtures and
is now très élevé.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : Mesure et vérification finale

**Files :** aucun fichier suivi par git. La référence d'audit `.cache/off-audit-baseline.json` est
locale (ignorée par git) : elle est sauvegardée puis restaurée.

- [ ] **Step 1 : Référence `feature/ble-chocolat`** — Run :

```bash
cp .cache/off-audit-baseline.json /tmp/off-audit-baseline.orig.json
git worktree add -q /tmp/oxa-ble feature/ble-chocolat
ln -s "$PWD/node_modules" /tmp/oxa-ble/node_modules
mkdir -p /tmp/oxa-ble/.cache && cp .cache/off-audit-sample.json /tmp/oxa-ble/.cache/
(cd /tmp/oxa-ble && OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts --reporter=default | grep -E "Non déterminable|Référence")
cp /tmp/oxa-ble/.cache/off-audit-baseline.json .cache/off-audit-baseline.json
git worktree remove --force /tmp/oxa-ble
```

Expected : `Non déterminable : 40/200 (20 %)` et `Référence enregistrée`.

- [ ] **Step 2 : Audit de la branche** — Run :

```bash
OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts --reporter=default | sed -n '/Non déterminable/,/Inconnus/p'
cp /tmp/off-audit-baseline.orig.json .cache/off-audit-baseline.json
```

Expected : `Non déterminable : 40/200 (20 %)` et exactement 4 changements, tous vers le haut :
- `modéré → très élevé | Véritable Petit Écolier Chocolat au Lait` ;
- `modéré → élevé | Moelleux chocolat` ;
- `élevé → très élevé | Cookie cacao pépites Sans Sucre` ;
- `élevé → très élevé | Cracotte Chocolat`.

Tout autre changement, et toute baisse, s'explique avant de continuer.

- [ ] **Step 3 : Vérification complète** — Run : `npx vitest run && npx tsc -b && npm run lint`.
  Expected : tout passe.

- [ ] **Step 4 : Résumé à l'utilisateur**, sans fusionner ni pousser : changements de niveau,
  taux de « non déterminable », décisions prises en cours de route. Proposer ensuite la suite
  (superpowers:finishing-a-development-branch).
