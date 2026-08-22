# Réduire les échecs de scan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réduire la part de scans "non déterminable" en distinguant les causes d'échec, en proposant une contribution photo à Open Food Facts quand les ingrédients manquent, et en pré-remplissant le nom du produit via UPCitemdb quand OFF ne connaît pas le code-barres.

**Architecture:** Deux nouveaux modules purs sans état (`off-contribute.ts`, `upcitemdb-client.ts`), suivant exactement le pattern déjà en place dans `off-client.ts` (fonction async unique, `fetch` enveloppé dans `try/catch`, dégradation silencieuse vers `null`/`false`). `ResultView` gagne une fonction pure `categorizeFailure` et deux nouveaux embranchements UI câblés sur l'état existant — aucun nouveau champ PocketBase, aucun changement à `matchIngredients`.

**Tech Stack:** React + TypeScript (Vite), Vitest + @testing-library/react, `fetch` natif (pas de client HTTP dédié).

**Spec:** `docs/superpowers/specs/2026-08-21-scan-coverage-design.md`

## Global Constraints

- Pas de compte OFF individuel par utilisateur — un seul compte de contribution partagé pour toute l'app.
- Pas de vérification post-upload du contenu OCR — l'API OFF ne le renvoie pas de façon synchrone, on se contente d'un booléen succès/échec réseau.
- Pas de proxy serveur pour UPCitemdb — appel direct client, best-effort, quota partagé (100/jour) non garanti.
- Tout échec UPCitemdb (quota, timeout, réseau) dégrade silencieusement vers le comportement actuel — jamais de message d'erreur visible, jamais de retry.
- `matchIngredients()` et le flux `not-found` (EAN absent d'OFF) restent inchangés.
- Credentials (`VITE_OFF_CONTRIBUTOR_USER` / `VITE_OFF_CONTRIBUTOR_PASSWORD`) suivent le même traitement que `VITE_POCKETBASE_URL` : déclarées dans `.env.example` avec une valeur vide/placeholder, jamais commitées avec une vraie valeur.

---

## File Structure

- `src/lib/off-contribute.ts` (nouveau) — `uploadIngredientsPhoto(ean, image, lang)`, upload multipart vers OFF.
- `src/lib/off-contribute.test.ts` (nouveau) — mocks `fetch`, vérifie le `FormData` envoyé et la gestion d'échec.
- `src/lib/upcitemdb-client.ts` (nouveau) — `lookupProductName(ean)`, lookup best-effort du nom produit.
- `src/lib/upcitemdb-client.test.ts` (nouveau) — mocks `fetch`, teste réponse avec nom / vide / échec réseau.
- `src/components/ResultView.tsx` (modifié) — ajoute `categorizeFailure`, branche le bouton photo et le pré-remplissage UPCitemdb.
- `src/components/ResultView.test.tsx` (modifié) — nouveaux tests pour chaque embranchement.
- `.env.example` (modifié) — ajoute les deux nouvelles clés en placeholder.

---

### Task 1: Distinguer `no-ingredients` vs `no-match` dans ResultView

**Files:**
- Modify: `src/components/ResultView.tsx`
- Test: `src/components/ResultView.test.tsx`

**Interfaces:**
- Consumes: `MatchResult` (`src/lib/oxalate-matcher.ts`, champ `level: MatchLevel`), `OffProduct` (`src/lib/off-client.ts`, champ `ingredientsText: string`).
- Produces: `type ScanFailureReason = "no-ingredients" | "no-match"` et `function categorizeFailure(result: MatchResult, product: OffProduct): ScanFailureReason | null`, exportées depuis `ResultView.tsx` pour que Task 2 et Task 3 les important.

- [ ] **Step 1: Write the failing tests**

Ajouter dans `src/components/ResultView.test.tsx`, dans un nouveau bloc `describe("categorizeFailure")` juste après les imports (importer aussi `categorizeFailure` depuis `./ResultView`) :

```ts
import { ResultView, categorizeFailure } from "./ResultView";

describe("categorizeFailure", () => {
  it("returns 'no-ingredients' when the level is non déterminable and ingredientsText is empty", () => {
    const result = categorizeFailure(
      { level: "non déterminable", matchedIngredients: [] },
      { productName: "Gnocchi", ingredientsText: "", imageUrl: null }
    );
    expect(result).toBe("no-ingredients");
  });

  it("returns 'no-ingredients' when ingredientsText is only whitespace", () => {
    const result = categorizeFailure(
      { level: "non déterminable", matchedIngredients: [] },
      { productName: "Gnocchi", ingredientsText: "   ", imageUrl: null }
    );
    expect(result).toBe("no-ingredients");
  });

  it("returns 'no-match' when the level is non déterminable but ingredientsText has content", () => {
    const result = categorizeFailure(
      { level: "non déterminable", matchedIngredients: [] },
      { productName: "Boursin Vegan", ingredientsText: "water, coconut oil, salt", imageUrl: null }
    );
    expect(result).toBe("no-match");
  });

  it("returns null when the level is not non déterminable", () => {
    const result = categorizeFailure(
      { level: "élevé", matchedIngredients: [] },
      { productName: "Nutella", ingredientsText: "cacao", imageUrl: null }
    );
    expect(result).toBeNull();
  });
});

describe("ResultView failure messaging", () => {
  it("shows a no-ingredients message with a contribute-photo button when OFF has no ingredients text", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
    });

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    expect(await screen.findByText(/non déterminable/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /photographier les ingrédients/i })
    ).toBeInTheDocument();
  });

  it("shows a no-match message without a contribute-photo button when ingredients text exists but nothing matched", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Boursin Vegan",
      ingredientsText: "water, coconut oil, salt",
      imageUrl: null,
    });

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    expect(
      await screen.findByText(/aucun ingrédient à risque connu détecté/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /photographier les ingrédients/i })
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ResultView.test.tsx`
Expected: FAIL — `categorizeFailure` is not exported from `./ResultView`, and the new UI text/button don't exist yet.

- [ ] **Step 3: Implement `categorizeFailure` and branch the UI**

Dans `src/components/ResultView.tsx`, ajouter après les imports :

```ts
export type ScanFailureReason = "no-ingredients" | "no-match";

export function categorizeFailure(
  result: MatchResult,
  product: OffProduct
): ScanFailureReason | null {
  if (result.level !== "non déterminable") return null;
  if (!product.ingredientsText.trim()) return "no-ingredients";
  return "no-match";
}
```

Dans le bloc de rendu `status === "found"`, juste avant le rendu de `LevelBadge` (ou en complément), insérer la logique de branchement. Remplacer la section du composant qui affiche le résultat par :

```tsx
  return (
    <div className="screen-content">
      <div className="product-card">
        <div className="product-thumb" aria-hidden="true" />
        <h2 className="product-name">{state.product.productName}</h2>
        <LevelBadge level={state.result.level} />
        {state.result.matchedIngredients.length > 0 && (
          <p className="ingredient-line">
            Ingrédients à risque détectés :{" "}
            {state.result.matchedIngredients.map((m, index) => (
              <strong key={index}>
                {m.ingredientText}
                {index < state.result.matchedIngredients.length - 1 ? ", " : ""}
              </strong>
            ))}
            .
          </p>
        )}
        {(() => {
          const failureReason = categorizeFailure(state.result, state.product);
          if (failureReason === "no-match") {
            return (
              <p className="ingredient-line">
                Aucun ingrédient à risque connu détecté dans la liste fournie.
              </p>
            );
          }
          if (failureReason === "no-ingredients") {
            return (
              <p className="ingredient-line">
                Liste d'ingrédients non disponible sur Open Food Facts pour
                ce produit.
              </p>
            );
          }
          return null;
        })()}
        <p className="disclaimer">
          Estimation indicative — les valeurs d'oxalate varient selon la
          variété, le sol, la cuisson, etc. Ce niveau reflète la présence
          d'un ingrédient connu pour sa teneur en oxalate, pas une
          quantité mesurée dans ce produit précis.
        </p>
        {syncError && <p className="sync-error">Échec de synchronisation avec l'historique.</p>}
      </div>
      <button className="text-button" onClick={onBack}>Retour</button>
    </div>
  );
```

Note : le bouton "Photographier les ingrédients" lui-même arrive en Task 2 — pour l'instant cette étape ne fait que poser le texte `no-match`/`no-ingredients`. Le test "no-ingredients message with a contribute-photo button" restera donc rouge jusqu'à la fin de Task 2 ; c'est attendu, ne pas chercher à le faire passer ici. Concentrez-vous à ce stade sur le test "no-match message without a contribute-photo button" qui doit passer dès maintenant (le `queryByRole` doit déjà retourner `null` puisqu'aucun bouton n'existe encore).

- [ ] **Step 4: Run tests to verify the no-match test passes (no-ingredients test stays red until Task 2)**

Run: `npm test -- ResultView.test.tsx`
Expected: `categorizeFailure` describe block passes fully. "shows a no-match message..." passes. "shows a no-ingredients message with a contribute-photo button..." still fails (no button yet) — expected at this point.

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Distinguish no-ingredients from no-match scan failures"
```

---

### Task 2: Module `off-contribute.ts` — upload photo vers Open Food Facts

**Files:**
- Create: `src/lib/off-contribute.ts`
- Test: `src/lib/off-contribute.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: rien du code existant (module autonome), mais lit `import.meta.env.VITE_OFF_CONTRIBUTOR_USER` / `VITE_OFF_CONTRIBUTOR_PASSWORD`.
- Produces: `function uploadIngredientsPhoto(ean: string, image: Blob, lang: string): Promise<boolean>`, consommée par Task 4 dans `ResultView.tsx`.

- [ ] **Step 1: Write the failing tests**

Créer `src/lib/off-contribute.test.ts` :

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { uploadIngredientsPhoto } from "./off-contribute";

describe("uploadIngredientsPhoto", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a multipart form with the expected fields and returns true on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const image = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const result = await uploadIngredientsPhoto("3017620422003", image, "fr");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://world.openfoodfacts.org/cgi/product_image_upload.pl"
    );
    expect(options.method).toBe("POST");

    const body = options.body as FormData;
    expect(body.get("code")).toBe("3017620422003");
    expect(body.get("imagefield")).toBe("ingredients_fr");
    expect(body.get("imgupload_ingredients_fr")).toBe(image);
  });

  it("returns false when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const image = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const result = await uploadIngredientsPhoto("3017620422003", image, "fr");

    expect(result).toBe(false);
  });

  it("returns false when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const image = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const result = await uploadIngredientsPhoto("3017620422003", image, "fr");

    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- off-contribute.test.ts`
Expected: FAIL — Cannot find module `./off-contribute`.

- [ ] **Step 3: Write the implementation**

Créer `src/lib/off-contribute.ts` :

```ts
export async function uploadIngredientsPhoto(
  ean: string,
  image: Blob,
  lang: string
): Promise<boolean> {
  const formData = new FormData();
  formData.append("code", ean);
  formData.append("user_id", import.meta.env.VITE_OFF_CONTRIBUTOR_USER ?? "");
  formData.append(
    "password",
    import.meta.env.VITE_OFF_CONTRIBUTOR_PASSWORD ?? ""
  );
  formData.append("imagefield", `ingredients_${lang}`);
  formData.append(`imgupload_ingredients_${lang}`, image);

  try {
    const response = await fetch(
      "https://world.openfoodfacts.org/cgi/product_image_upload.pl",
      {
        method: "POST",
        body: formData,
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- off-contribute.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the new env vars to `.env.example`**

Lire `.env.example` puis y ajouter, à la suite de la clé existante :

```
VITE_OFF_CONTRIBUTOR_USER=
VITE_OFF_CONTRIBUTOR_PASSWORD=
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/off-contribute.ts src/lib/off-contribute.test.ts .env.example
git commit -m "Add off-contribute module to upload ingredient photos to Open Food Facts"
```

---

### Task 3: Module `upcitemdb-client.ts` — fallback nom produit

**Files:**
- Create: `src/lib/upcitemdb-client.ts`
- Test: `src/lib/upcitemdb-client.test.ts`

**Interfaces:**
- Consumes: rien du code existant (module autonome).
- Produces: `function lookupProductName(ean: string): Promise<string | null>`, consommée par Task 5 dans `ResultView.tsx`.

- [ ] **Step 1: Write the failing tests**

Créer `src/lib/upcitemdb-client.test.ts` :

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { lookupProductName } from "./upcitemdb-client";

describe("lookupProductName", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the product title when UPCitemdb finds the barcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: "OK",
            items: [{ title: "Gnocchi di Patate 500g" }],
          }),
      })
    );

    const result = await lookupProductName("8001234567890");

    expect(result).toBe("Gnocchi di Patate 500g");
  });

  it("returns null when UPCitemdb has no items for the barcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: "OK", items: [] }),
      })
    );

    const result = await lookupProductName("0000000000000");

    expect(result).toBeNull();
  });

  it("returns null when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const result = await lookupProductName("8001234567890");

    expect(result).toBeNull();
  });

  it("returns null when the response is not ok (e.g. quota exceeded)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 })
    );

    const result = await lookupProductName("8001234567890");

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- upcitemdb-client.test.ts`
Expected: FAIL — Cannot find module `./upcitemdb-client`.

- [ ] **Step 3: Write the implementation**

Créer `src/lib/upcitemdb-client.ts` :

```ts
interface UpcItemDbResponse {
  code: string;
  items?: { title?: string }[];
}

export async function lookupProductName(ean: string): Promise<string | null> {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data: UpcItemDbResponse = await response.json();
  const title = data.items?.[0]?.title;
  return title ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- upcitemdb-client.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/upcitemdb-client.ts src/lib/upcitemdb-client.test.ts
git commit -m "Add upcitemdb-client module for product-name fallback lookup"
```

---

### Task 4: Brancher le bouton "Photographier les ingrédients" dans ResultView

**Files:**
- Modify: `src/components/ResultView.tsx`
- Test: `src/components/ResultView.test.tsx`

**Interfaces:**
- Consumes: `categorizeFailure` (Task 1, local à `ResultView.tsx`), `uploadIngredientsPhoto(ean, image, lang)` (Task 2, `src/lib/off-contribute.ts`).
- Produces: rien de consommé par une tâche suivante — c'est le dernier maillon du Volet 2.

- [ ] **Step 1: Write the failing test**

Compléter le test "shows a no-ingredients message with a contribute-photo button" de Task 1 (déjà écrit, actuellement rouge) avec un scénario d'upload complet. Ajouter dans `src/components/ResultView.test.tsx` :

```ts
import { uploadIngredientsPhoto } from "../lib/off-contribute";

vi.mock("../lib/off-contribute");

describe("ResultView photo contribution", () => {
  it("uploads the selected photo and shows a confirmation message on success", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
    });
    (uploadIngredientsPhoto as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    const fileInput = await screen.findByLabelText(/photographier les ingrédients/i);
    const file = new File(["fake-bytes"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(uploadIngredientsPhoto).toHaveBeenCalledWith(
        "1234567890123",
        file,
        "fr"
      )
    );
    expect(
      await screen.findByText(/merci, transmis à open food facts/i)
    ).toBeInTheDocument();
  });

  it("shows a failure message when the photo upload fails", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
    });
    (uploadIngredientsPhoto as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    const fileInput = await screen.findByLabelText(/photographier les ingrédients/i);
    const file = new File(["fake-bytes"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText(/échec de l'envoi de la photo/i)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ResultView.test.tsx`
Expected: FAIL — no file input labeled "Photographier les ingrédients" exists yet.

- [ ] **Step 3: Implement the button and upload flow**

Dans `src/components/ResultView.tsx`, ajouter l'import et l'état :

```ts
import { uploadIngredientsPhoto } from "../lib/off-contribute";
```

Ajouter dans le composant, à côté des autres `useState` :

```ts
const [photoUploadState, setPhotoUploadState] = useState<
  "idle" | "uploading" | "success" | "error"
>("idle");
```

Ajouter le handler :

```ts
async function handlePhotoSelected(e: FormEvent<HTMLInputElement>) {
  const file = e.currentTarget.files?.[0];
  if (!file) return;
  setPhotoUploadState("uploading");
  const success = await uploadIngredientsPhoto(ean, file, "fr");
  setPhotoUploadState(success ? "success" : "error");
}
```

Dans le bloc de branchement `no-ingredients` ajouté en Task 1, remplacer :

```tsx
          if (failureReason === "no-ingredients") {
            return (
              <p className="ingredient-line">
                Liste d'ingrédients non disponible sur Open Food Facts pour
                ce produit.
              </p>
            );
          }
```

par :

```tsx
          if (failureReason === "no-ingredients") {
            return (
              <div className="ingredient-line">
                <p>
                  Liste d'ingrédients non disponible sur Open Food Facts
                  pour ce produit.
                </p>
                <label htmlFor="ingredients-photo" className="text-button">
                  Photographier les ingrédients
                  <input
                    id="ingredients-photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handlePhotoSelected}
                  />
                </label>
                {photoUploadState === "success" && (
                  <p className="ingredient-line">
                    Merci, transmis à Open Food Facts — la liste
                    d'ingrédients sera disponible après traitement.
                  </p>
                )}
                {photoUploadState === "error" && (
                  <p className="sync-error">
                    Échec de l'envoi de la photo. Réessayez plus tard.
                  </p>
                )}
              </div>
            );
          }
```

Note d'implémentation : `<label>` associé à un `<input type="file">` masqué est le pattern standard pour rendre un bouton stylé accessible via `getByLabelText` / `findByLabelText` dans les tests — pas de nouvelle dépendance requise.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- ResultView.test.tsx`
Expected: PASS — tous les tests de `ResultView.test.tsx`, y compris ceux laissés rouges en Task 1.

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Wire ingredient photo contribution button into ResultView"
```

---

### Task 5: Pré-remplir le nom produit via UPCitemdb quand OFF ne trouve rien

**Files:**
- Modify: `src/components/ResultView.tsx`
- Test: `src/components/ResultView.test.tsx`

**Interfaces:**
- Consumes: `lookupProductName(ean)` (Task 3, `src/lib/upcitemdb-client.ts`).
- Produces: rien consommé par une tâche suivante — dernier maillon du Volet 3, fin du plan.

- [ ] **Step 1: Write the failing tests**

Ajouter dans `src/components/ResultView.test.tsx` :

```ts
import { lookupProductName } from "../lib/upcitemdb-client";

vi.mock("../lib/upcitemdb-client");

describe("ResultView UPCitemdb fallback", () => {
  it("pre-fills the product name field when UPCitemdb finds a name", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Gnocchi di Patate 500g"
    );

    render(<ResultView ean="8001234567890" onBack={vi.fn()} />);

    await screen.findByText(/produit non trouvé/i);

    expect(screen.getByLabelText(/nom du produit/i)).toHaveValue(
      "Gnocchi di Patate 500g"
    );
  });

  it("leaves the product name field empty when UPCitemdb finds nothing", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    await screen.findByText(/produit non trouvé/i);

    expect(screen.getByLabelText(/nom du produit/i)).toHaveValue("");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ResultView.test.tsx`
Expected: FAIL — le champ "Nom du produit" reste vide même quand `lookupProductName` retourne un nom (pas encore câblé).

- [ ] **Step 3: Implement the fallback lookup**

Dans `src/components/ResultView.tsx`, ajouter l'import :

```ts
import { lookupProductName } from "../lib/upcitemdb-client";
```

Modifier le `useEffect` existant pour appeler `lookupProductName` quand `getProductByBarcode` retourne `null` :

```ts
useEffect(() => {
  let cancelled = false;
  getProductByBarcode(ean).then((product) => {
    if (cancelled) return;
    if (!product) {
      setState({ status: "not-found" });
      lookupProductName(ean).then((name) => {
        if (cancelled || !name) return;
        setManualName(name);
      });
      return;
    }
    const result = matchIngredients(product.ingredientsText);
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- ResultView.test.tsx`
Expected: PASS — tous les tests de `ResultView.test.tsx`.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS — l'ensemble de la suite (tous fichiers `*.test.ts`/`*.test.tsx`), aucune régression.

- [ ] **Step 6: Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Pre-fill product name from UPCitemdb when Open Food Facts finds nothing"
```

---

## Self-Review Notes

- **Spec coverage** : Volet 1 → Task 1. Volet 2 → Task 2 (module) + Task 4 (branchement UI). Volet 3 → Task 3 (module) + Task 5 (branchement UI). Section "Composants touchés" de la spec entièrement couverte (`off-contribute.ts`, `upcitemdb-client.ts`, `ResultView.tsx`, `.env.example` en lieu de `.env.local`/`.env.production` qui ne sont pas versionnés). Section "Tests prévus" de la spec entièrement couverte par les 5 tâches.
- **Placeholders** : aucun — chaque step contient le code réel à écrire.
- **Cohérence des types** : `ScanFailureReason`, `categorizeFailure`, `uploadIngredientsPhoto(ean, image, lang)`, `lookupProductName(ean)` utilisés avec les mêmes signatures dans toutes les tâches qui les consomment.
