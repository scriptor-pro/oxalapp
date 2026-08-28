# USDA Fallback Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Open Food Facts has no record for a scanned barcode, fall back to USDA FoodData Central (via a PocketBase proxy route that keeps the API key server-side) so American-market products still resolve instead of falling straight to "produit non trouvé".

**Architecture:** A new PocketBase JSVM hook (`pocketbase/pb_hooks/usda-proxy.pb.js`) exposes `GET /usda/product/{gtin}`, calls USDA's `/foods/search` endpoint with a server-side API key, filters for an exact `gtinUpc` match, and returns a trimmed JSON shape or 404. A new client module (`src/lib/usda-client.ts`) calls that proxy route (never USDA directly) and exposes `getProductByGtinUpc`. `src/lib/product-resolver.ts` tries Open Food Facts first, then USDA only if OFF returns null, tagging `sources` with whichever answered. No multi-source field merging in this slice — exactly one source answers per scan.

**Tech Stack:** TypeScript (client), PocketBase JSVM hooks (`.pb.js`, ES5-ish syntax as used by PocketBase's embedded goja runtime — no `??`/optional chaining inside `pb_hooks` files, since goja's ES support lags standard V8/Node), Vitest for client-side tests. No new client dependencies.

**Spec:** Design validated in-session via superpowers:brainstorming (classified "architectural", short-form: no separate spec file, design discussed and approved in chat on 2026-08-28). Upstream context: `OxalApp-vibe-coding-implementation.md` sections "Source 2 — USDA FoodData Central / Branded Foods" and "5. Fusion des données produit".

## Global Constraints

- The USDA API key is a server-side secret: it must be read from a PocketBase process environment variable (`USDA_API_KEY`) inside the hook, and must NEVER be sent to, or embedded in, any client-side code, bundle, or `VITE_*` variable.
- Open Food Facts is tried first; USDA is only queried when OFF returns `null` for a validly-formed GTIN. Never query both for the same scan in this slice.
- No multi-field merging across sources: `ResolvedProduct` reflects exactly one source per scan. The existing `sources: string[]` field takes the single matching source's identifier (`"open_food_facts"` or `"usda"`).
- A USDA-resolved product always has `structuredIngredients: []` (USDA's API does not provide per-ingredient percentages) — this must transparently fall back to `matchIngredients` (plain text) in `ResultView.tsx`, which already has that fallback branch from the previous plan; no change to `ResultView.tsx`'s matching-function selection logic is needed or in scope.
- `ResultView.tsx`'s PocketBase `scans` collection save call keeps hardcoding `source: "off"` for every scan resolved via `resolveProduct`, regardless of whether OFF or USDA actually answered — this is the existing, intentional behavior (the `scans` collection's `source` field is a schema-constrained enum of exactly `["off", "saisie_manuelle"]`, unrelated to `ResolvedProduct.sources`) and must NOT be changed as part of this plan.
- Never commit without `npx tsc -b` and `npm test` passing.
- No new client-side dependencies. The PocketBase hook uses only what PocketBase's JSVM runtime provides natively (`$http.send` for outbound requests) — no npm packages inside `pb_hooks/`.

---

### Task 1: USDA proxy hook in PocketBase

**Files:**
- Create: `pocketbase/pb_hooks/usda-proxy.pb.js`

**Interfaces:**
- Consumes: the `USDA_API_KEY` environment variable of the PocketBase process (read via `$os.getenv("USDA_API_KEY")`).
- Produces: an HTTP route `GET /usda/product/{gtin}` on the running PocketBase server. Response shape on success (HTTP 200):
  ```json
  {
    "productName": "string",
    "brand": "string",
    "ingredientsText": "string",
    "category": "string",
    "servingSize": 30.0,
    "servingSizeUnit": "GRM"
  }
  ```
  Response on no match or any upstream error: HTTP 404 with `{"error": "not_found"}`.

This task cannot be covered by Vitest (PocketBase's JSVM hooks run in a goja runtime, not Node) — verification is a manual `curl` test against a locally running PocketBase instance, described in Step 3 below.

- [ ] **Step 1: Write the hook file**

```javascript
// pocketbase/pb_hooks/usda-proxy.pb.js
routerAdd("GET", "/usda/product/{gtin}", (e) => {
  const gtin = e.request.pathValue("gtin");
  const apiKey = $os.getenv("USDA_API_KEY");

  if (!apiKey) {
    return e.json(500, { error: "usda_api_key_not_configured" });
  }

  const searchUrl =
    "https://api.nal.usda.gov/fdc/v1/foods/search" +
    "?api_key=" + encodeURIComponent(apiKey) +
    "&query=" + encodeURIComponent(gtin) +
    "&dataType=Branded";

  let response;
  try {
    response = $http.send({
      url: searchUrl,
      method: "GET",
    });
  } catch (err) {
    return e.json(404, { error: "not_found" });
  }

  if (response.statusCode !== 200) {
    return e.json(404, { error: "not_found" });
  }

  let data;
  try {
    data = response.json;
  } catch (err) {
    return e.json(404, { error: "not_found" });
  }

  const foods = data.foods || [];
  let match = null;
  for (let i = 0; i < foods.length; i++) {
    if (foods[i].gtinUpc === gtin) {
      match = foods[i];
      break;
    }
  }

  if (!match) {
    return e.json(404, { error: "not_found" });
  }

  return e.json(200, {
    productName: match.description || "",
    brand: match.brandName || match.brandOwner || "",
    ingredientsText: match.ingredients || "",
    category: match.foodCategory || "",
    servingSize: typeof match.servingSize === "number" ? match.servingSize : null,
    servingSizeUnit: match.servingSizeUnit || "",
  });
});
```

Notes for the implementer:
- PocketBase's JSVM (goja) hooks use `routerAdd(method, path, handler)` at the top level of a `.pb.js` file under `pb_hooks/` — this is the documented pattern for PocketBase ≥0.23's JavaScript hooks (confirmed against this project's PocketBase version, 0.39.9). Do not wrap this in `onBeforeServe` or any other lifecycle hook — `routerAdd` at file scope is the current, correct API.
- `$os.getenv` and `$http.send` are PocketBase JSVM globals — no `require`/`import` needed or possible inside `pb_hooks/*.pb.js`.
- The `{gtin}` path parameter is read via `e.request.pathValue("gtin")` (PocketBase 0.23+ router API).
- Deliberately avoid `??`/optional chaining/arrow-function edge cases that older goja versions may not support — stick to `||` fallbacks and plain `function`/arrow syntax as shown above (this file already uses arrow functions for the handler itself, which goja does support; the fallback style with `||` is the safer, more portable choice for field access).
- USDA's `/foods/search` does substring/keyword matching, not an exact barcode lookup — hence the manual `gtinUpc === gtin` filter over the returned `foods` array. `gtin` here is compared as a plain string; the caller is responsible for passing whatever GTIN string form USDA's `gtinUpc` field actually stores product barcodes as (typically the raw UPC/EAN digits without extra leading zeros — Task 2 handles the exact value passed).

- [ ] **Step 2: Verify the file has no syntax errors PocketBase's JSVM would reject**

Run: `./pocketbase/pocketbase serve --http=127.0.0.1:8099 &` (background, using a throwaway port to avoid colliding with any already-running instance), then check its startup log for a JSVM parse error mentioning `usda-proxy.pb.js`.

Expected: no error mentioning `usda-proxy.pb.js` in the startup output. Stop the throwaway instance afterward (`kill %1` or find its PID and `kill` it).

- [ ] **Step 3: Manual verification against the real USDA API**

This step requires a real USDA API key. **Do not ask the end user for it yourself** — a real key must already be exported as `USDA_API_KEY` in the shell environment you were dispatched in (the controller is responsible for ensuring this before dispatching this task; if `echo $USDA_API_KEY` is empty in your shell, stop and report BLOCKED/NEEDS_CONTEXT rather than substituting `DEMO_KEY`, fabricating a key, or asking the user directly — `DEMO_KEY` is rate-limited to 30 requests/hour and may be exhausted by other testing, and a fabricated key will silently produce misleading 401/403 errors that look like a hook bug).

```bash
./pocketbase/pocketbase serve --http=127.0.0.1:8099 &
sleep 2
curl -s http://127.0.0.1:8099/usda/product/625691650046
kill %1
```

(`USDA_API_KEY` is inherited from your shell's existing environment — no need to prefix the command with it if it's already exported.)

Expected output: a JSON object with `productName` containing "CHEEZE CAULIFLOWER CRISPS" (this is a real, verified GTIN/product pair confirmed against the live USDA API during this plan's design phase — HIPPIE SNACKS brand, `ingredients` field starting with "CAULIFLOWER, COCONUT MILK..."). If the response is `{"error":"not_found"}` instead, the hook's field-matching logic has a bug — investigate before proceeding (do not skip this check or assume the hook is correct without seeing this real match succeed).

Also verify the 404 path: `curl -s http://127.0.0.1:8099/usda/product/00000000000000` should return `{"error":"not_found"}`.

- [ ] **Step 4: Commit**

```bash
git add pocketbase/pb_hooks/usda-proxy.pb.js
git commit -m "Add PocketBase proxy route for USDA FoodData Central product lookup"
```

---

### Task 2: USDA client module

**Files:**
- Create: `src/lib/usda-client.ts`
- Test: `src/lib/usda-client.test.ts`

**Interfaces:**
- Consumes: the PocketBase proxy route from Task 1 (`GET {VITE_POCKETBASE_URL}/usda/product/{gtin}`), and `import.meta.env.VITE_POCKETBASE_URL` (already used elsewhere in this codebase, e.g. `src/lib/pocketbase.ts`).
- Produces:
  - `export interface UsdaProduct { productName: string; brand: string; ingredientsText: string; category: string; servingSize: number | null; servingSizeUnit: string; }`
  - `export async function getProductByGtinUpc(gtin: string): Promise<UsdaProduct | null>`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/usda-client.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { getProductByGtinUpc } from "./usda-client";

describe("getProductByGtinUpc", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns product data when the USDA proxy finds the barcode", async () => {
    const mockResponse = {
      productName: "CHEEZE CAULIFLOWER CRISPS, CHEEZE",
      brand: "HIPPIE SNACKS",
      ingredientsText:
        "CAULIFLOWER, COCONUT MILK (COCONUT EXTRACT, WATER), PUMPKIN SEEDS",
      category: "Crackers & Biscotti",
      servingSize: 30.0,
      servingSizeUnit: "GRM",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await getProductByGtinUpc("625691650046");

    expect(result).toEqual(mockResponse);
  });

  it("returns null when the USDA proxy has no product for the barcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );

    const result = await getProductByGtinUpc("00000000000000");

    expect(result).toBeNull();
  });

  it("returns null when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const result = await getProductByGtinUpc("625691650046");

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/usda-client.test.ts`
Expected: FAIL — `Cannot find module './usda-client'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/usda-client.ts
export interface UsdaProduct {
  productName: string;
  brand: string;
  ingredientsText: string;
  category: string;
  servingSize: number | null;
  servingSizeUnit: string;
}

export async function getProductByGtinUpc(
  gtin: string
): Promise<UsdaProduct | null> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL ?? "";
  const url = `${baseUrl}/usda/product/${gtin}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data: UsdaProduct = await response.json();
  return data;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/usda-client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/usda-client.ts src/lib/usda-client.test.ts
git commit -m "Add USDA client calling the PocketBase proxy route"
```

---

### Task 3: Wire USDA as a ProductResolver fallback

**Files:**
- Modify: `src/lib/product-resolver.ts`
- Modify: `src/lib/product-resolver.test.ts`

**Interfaces:**
- Consumes: `getProductByGtinUpc`, `UsdaProduct` from `src/lib/usda-client.ts` (Task 2).
- Produces: `resolveProduct`'s existing signature and `ResolvedProduct` shape are unchanged — only its internal behavior gains a fallback branch. `ResolvedProduct.sources` becomes `["usda"]` (instead of `["open_food_facts"]`) when USDA is the one that answered.

**Target behavior:**
- `resolveProduct` still validates the GTIN first (unchanged, Task 1 of the prior plan).
- If Open Food Facts returns a product, behavior is completely unchanged from today (never calls USDA).
- If Open Food Facts returns `null`, `resolveProduct` calls `getProductByGtinUpc(normalized.rawCode)`. If USDA returns a product, map it into `ResolvedProduct` with `structuredIngredients: []`, `imageUrl: null` (USDA has no product image field in this integration), `lang: null` (USDA data is English-only, no language field to report), and `sources: ["usda"]`.
- If both OFF and USDA return `null`, `resolveProduct` returns `null` (unchanged final behavior — falls through to the existing "produit non trouvé" / manual-entry UI, untouched by this plan).

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/product-resolver.test.ts`, alongside the existing `vi.mock("./off-client")`:

```typescript
import { getProductByGtinUpc } from "./usda-client";

vi.mock("./usda-client");
```

Add these tests inside the existing `describe("resolveProduct", ...)` block:

```typescript
  it("does not call USDA when Open Food Facts already found the product", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
      lang: "fr",
      structuredIngredients: [],
    });

    await resolveProduct("3017620422003");

    expect(getProductByGtinUpc).not.toHaveBeenCalled();
  });

  it("falls back to USDA when Open Food Facts has no product for the barcode", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getProductByGtinUpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "CHEEZE CAULIFLOWER CRISPS, CHEEZE",
      brand: "HIPPIE SNACKS",
      ingredientsText: "CAULIFLOWER, COCONUT MILK, PUMPKIN SEEDS",
      category: "Crackers & Biscotti",
      servingSize: 30.0,
      servingSizeUnit: "GRM",
    });

    const result = await resolveProduct("3017620422003");

    expect(result).toEqual({
      gtin: "03017620422003",
      rawCode: "3017620422003",
      productName: "CHEEZE CAULIFLOWER CRISPS, CHEEZE",
      ingredientsText: "CAULIFLOWER, COCONUT MILK, PUMPKIN SEEDS",
      structuredIngredients: [],
      imageUrl: null,
      lang: null,
      sources: ["usda"],
    });
    expect(getProductByGtinUpc).toHaveBeenCalledWith("3017620422003");
  });

  it("returns null when neither Open Food Facts nor USDA has the product", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getProductByGtinUpc as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await resolveProduct("3017620422003");

    expect(result).toBeNull();
  });

  it("does not call USDA when the barcode checksum is invalid", async () => {
    const result = await resolveProduct("3017620422999");

    expect(result).toBeNull();
    expect(getProductByGtinUpc).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/product-resolver.test.ts`
Expected: FAIL — the "falls back to USDA" test fails because `resolveProduct` currently returns `null` as soon as OFF returns `null`, never calling `getProductByGtinUpc`.

- [ ] **Step 3: Write the implementation**

Replace `src/lib/product-resolver.ts`'s body with:

```typescript
import { normalizeGtin } from "./gtin";
import { getProductByBarcode, type StructuredIngredient } from "./off-client";
import { getProductByGtinUpc } from "./usda-client";

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
  if (offProduct) {
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

  const usdaProduct = await getProductByGtinUpc(normalized.rawCode);
  if (usdaProduct) {
    return {
      gtin: normalized.normalizedGtin14,
      rawCode: normalized.rawCode,
      productName: usdaProduct.productName,
      ingredientsText: usdaProduct.ingredientsText,
      structuredIngredients: [],
      imageUrl: null,
      lang: null,
      sources: ["usda"],
    };
  }

  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/product-resolver.test.ts`
Expected: PASS (7 tests: 3 pre-existing + 4 new).

- [ ] **Step 5: Full project verification**

Run: `npx tsc -b`
Expected: no errors.

Run: `npm test`
Expected: all suites pass, no regressions in `ResultView.test.tsx` or any other file (this task does not touch `ResultView.tsx` — the UI already falls back to `matchIngredients` for any `ResolvedProduct` with empty `structuredIngredients`, which a USDA-sourced product always has).

- [ ] **Step 6: Commit**

```bash
git add src/lib/product-resolver.ts src/lib/product-resolver.test.ts
git commit -m "Fall back to USDA FoodData Central when Open Food Facts has no product"
```

---

## Post-plan operational notes (not code — do not act on these as implementation tasks)

- **`USDA_API_KEY` must be set on the production PocketBase service** (`pocketbase-oxalapp` systemd unit on the VPS, per project memory) before this feature works in production — this is an operational step for the user, analogous to `VITE_OFF_CONTRIBUTOR_USER`/`PASSWORD` in `.env.production` from the prior plan. Ask the user to add it themselves (systemd `Environment=` directive or an env file the unit loads) rather than attempting to SSH or modify the VPS directly.
- **Local development** also needs `USDA_API_KEY` exported in the shell that runs `./pocketbase/pocketbase serve`, or the hook returns HTTP 500 for every request (by design, per Task 1 Step 1's `usda_api_key_not_configured` branch).
- This plan does not add a `.env.example` entry, because the key belongs to the PocketBase process environment, not to any `VITE_*` client-side `.env` file — do not add `USDA_API_KEY` to `.env.example`/`.env.production`, since those are Vite build-time files that would leak it into the client bundle, defeating the entire point of the proxy.
