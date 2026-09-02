# OCR local pour la liste d'ingrédients — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconnaître localement (OCR embarqué, Android natif) le texte d'une photo d'étiquette pour pré-remplir le formulaire manuel d'ingrédients dans `ResultView`, pour les flux `not-found` et `no-ingredients`.

**Architecture:** Un module pur `src/lib/ocr-client.ts` (pattern identique à `off-client.ts`/`upcitemdb-client.ts` : une fonction async, dégradation silencieuse vers une valeur neutre) encapsule le pont Blob → fichier temporaire natif → ML Kit → texte. Le formulaire manuel existant (aujourd'hui dupliqué en JSX inline dans `ResultView`) est extrait en composant réutilisable `ManualIngredientsForm`, utilisé pour `not-found` et ajouté à `no-ingredients`. `ResultView` bascule entre l'ancien flux OFF (upload photo, web) et le nouveau flux OCR (natif) via `Capacitor.isNativePlatform()`.

**Tech Stack:** React + TypeScript (Vite), Vitest + @testing-library/react, Capacitor 8, `@capacitor-mlkit/text-recognition` (ML Kit Text Recognition v2, Android/iOS), `@capacitor/filesystem`.

**Spec:** `docs/superpowers/specs/2026-09-02-ocr-ingredients-design.md`

## Global Constraints

- Dégradation silencieuse à chaque étape (écriture fichier, appel ML Kit, texte vide) → `null`, jamais de message d'erreur bloquant pour l'OCR lui-même.
- Aucune relecture automatique : le texte reconnu pré-remplit un champ éditable, jamais de matching automatique sans validation explicite de l'utilisateur.
- Le fichier temporaire écrit dans le cache Capacitor est supprimé après l'appel ML Kit, succès ou échec.
- Sur web (`Capacitor.isNativePlatform()` = `false`), aucun changement de comportement observable : `no-ingredients` garde l'upload OFF, `not-found` garde la saisie manuelle sans bouton OCR.
- Sur Android natif, `no-ingredients` remplace l'upload OFF par l'OCR local (pas de cumul).
- Pour `no-ingredients`, le champ nom du formulaire est pré-rempli avec `state.product.productName` dès l'affichage.
- Aucune modification du manifeste Android (`CAMERA`/`INTERNET` déjà déclarées) ni de `scripts/build-apk.sh`.
- `npm run build` (`tsc -b && vite build`) et `npm test` doivent passer avant chaque commit — `tsc --noEmit` seul ne suffit pas (n'attrape pas les imports inutilisés en erreur bloquante, cf. mémoire projet).

---

## File Structure

- `src/lib/ocr-client.ts` (nouveau) — `recognizeIngredientsText(photo: Blob): Promise<string | null>`.
- `src/lib/ocr-client.test.ts` (nouveau).
- `src/components/ManualIngredientsForm.tsx` (nouveau) — formulaire nom + ingrédients + bouton OCR optionnel, extrait de `ResultView`.
- `src/components/ManualIngredientsForm.test.tsx` (nouveau).
- `src/components/ResultView.tsx` (modifié) — utilise `ManualIngredientsForm` pour `not-found` et `no-ingredients`, bascule OCR/OFF selon la plateforme, pré-remplit le nom pour `no-ingredients`.
- `src/components/ResultView.test.tsx` (modifié) — mock de `@capacitor/core` et `../lib/ocr-client`, nouveaux tests pour les embranchements OCR.
- `package.json` (modifié) — ajout de `@capacitor-mlkit/text-recognition` (^8.2.0) et `@capacitor/filesystem` (^8.1.3).

---

### Task 1: Module `ocr-client.ts`

**Files:**
- Create: `src/lib/ocr-client.ts`
- Test: `src/lib/ocr-client.test.ts`
- Modify: `package.json` (nouvelles dépendances)

**Interfaces:**
- Consumes: `Capacitor.isNativePlatform(): boolean` de `@capacitor/core` ; `Filesystem.writeFile(options: { path: string; data: string; directory: Directory }): Promise<{ uri: string }>` et `Filesystem.deleteFile(options: { path: string; directory: Directory }): Promise<void>` de `@capacitor/filesystem` ; `TextRecognition.processImage(options: { path: string; script: Script }): Promise<{ text: string; blocks: unknown[] }>` de `@capacitor-mlkit/text-recognition`.
- Produces: `export async function recognizeIngredientsText(photo: Blob): Promise<string | null>` — consommée par Task 3 dans `ResultView.tsx`.

- [ ] **Step 1: Installer les nouvelles dépendances**

```bash
npm install @capacitor-mlkit/text-recognition@^8.2.0 @capacitor/filesystem@^8.1.3
```

Expected: `package.json` et `package-lock.json` mis à jour, aucune erreur de peer dependency (les deux plugins ciblent `@capacitor/core` `^8.x`, déjà en `^8.5.0`).

- [ ] **Step 2: Write the failing tests**

Créer `src/lib/ocr-client.test.ts` :

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recognizeIngredientsText } from "./ocr-client";
import { Capacitor } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { TextRecognition } from "@capacitor-mlkit/text-recognition";

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: vi.fn(), deleteFile: vi.fn() },
  Directory: { Cache: "CACHE" },
}));
vi.mock("@capacitor-mlkit/text-recognition", () => ({
  TextRecognition: { processImage: vi.fn() },
  Script: { Latin: "LATIN" },
}));

function fakePhoto(): Blob {
  return new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/jpeg" });
}

describe("recognizeIngredientsText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (Filesystem.writeFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      uri: "file:///cache/oxalapp-ocr-temp.jpg",
    });
    (Filesystem.deleteFile as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("returns null immediately on a non-native platform, without touching filesystem or ML Kit", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
    expect(TextRecognition.processImage).not.toHaveBeenCalled();
  });

  it("returns the recognized text when everything succeeds", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "Sucre, farine de blé, noisettes",
      blocks: [],
    });

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBe("Sucre, farine de blé, noisettes");
    expect(TextRecognition.processImage).toHaveBeenCalledWith({
      path: "file:///cache/oxalapp-ocr-temp.jpg",
      script: "LATIN",
    });
  });

  it("writes base64-encoded binary data to the filesystem", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "texte",
      blocks: [],
    });

    await recognizeIngredientsText(fakePhoto());

    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: expect.any(String),
      data: "AQIDBA==", // base64 of bytes [1,2,3,4]
      directory: "CACHE",
    });
  });

  it("returns null when writing the temp file fails", async () => {
    (Filesystem.writeFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("disk full")
    );

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
    expect(TextRecognition.processImage).not.toHaveBeenCalled();
  });

  it("returns null when ML Kit rejects", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unreadable image")
    );

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
  });

  it("returns null when the recognized text is empty or whitespace-only", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "   ",
      blocks: [],
    });

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
  });

  it("deletes the temp file after a successful recognition", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "texte",
      blocks: [],
    });

    await recognizeIngredientsText(fakePhoto());

    expect(Filesystem.deleteFile).toHaveBeenCalledWith({
      path: expect.any(String),
      directory: "CACHE",
    });
  });

  it("deletes the temp file even when ML Kit rejects", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unreadable image")
    );

    await recognizeIngredientsText(fakePhoto());

    expect(Filesystem.deleteFile).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/ocr-client.test.ts`
Expected: FAIL — `Cannot find module './ocr-client'`.

- [ ] **Step 4: Write the implementation**

Créer `src/lib/ocr-client.ts` :

```ts
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { TextRecognition, Script } from "@capacitor-mlkit/text-recognition";

const TEMP_FILE_PATH = "oxalapp-ocr-temp.jpg";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function recognizeIngredientsText(
  photo: Blob
): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  let fileUri: string;
  try {
    const data = await blobToBase64(photo);
    const written = await Filesystem.writeFile({
      path: TEMP_FILE_PATH,
      data,
      directory: Directory.Cache,
    });
    fileUri = written.uri;
  } catch {
    return null;
  }

  try {
    const { text } = await TextRecognition.processImage({
      path: fileUri,
      script: Script.Latin,
    });
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  } finally {
    try {
      await Filesystem.deleteFile({
        path: TEMP_FILE_PATH,
        directory: Directory.Cache,
      });
    } catch {
      // Best-effort cleanup — a leftover temp file in the app's own cache
      // isn't worth surfacing an error for.
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/ocr-client.test.ts`
Expected: PASS, all 8 tests green.

- [ ] **Step 6: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/ocr-client.ts src/lib/ocr-client.test.ts
git commit -m "Add local OCR client wrapping ML Kit Text Recognition"
```

---

### Task 2: Composant `ManualIngredientsForm`

**Files:**
- Create: `src/components/ManualIngredientsForm.tsx`
- Test: `src/components/ManualIngredientsForm.test.tsx`

**Interfaces:**
- Consumes: rien du code existant (composant autonome, présentation pure).
- Produces:

```ts
export interface ManualIngredientsFormProps {
  name: string;
  onNameChange: (value: string) => void;
  ingredients: string;
  onIngredientsChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  showOcrButton: boolean;
  onPhotoSelected: (file: File) => void;
}
export function ManualIngredientsForm(props: ManualIngredientsFormProps): JSX.Element
```

consommé par Task 3 dans `ResultView.tsx`. Les ids `manual-name` / `manual-ingredients` et le texte du bouton "Valider" sont repris tels quels de l'implémentation actuelle de `ResultView` (préserve les sélecteurs des tests existants `screen.getByLabelText(/nom du produit/i)`, `screen.getByLabelText(/ingrédients/i)`, `screen.getByRole("button", { name: /valider/i })`).

- [ ] **Step 1: Write the failing tests**

Créer `src/components/ManualIngredientsForm.test.tsx` :

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { FormEvent } from "react";
import { ManualIngredientsForm } from "./ManualIngredientsForm";

function renderForm(overrides: Partial<Parameters<typeof ManualIngredientsForm>[0]> = {}) {
  const props = {
    name: "",
    onNameChange: vi.fn(),
    ingredients: "",
    onIngredientsChange: vi.fn(),
    onSubmit: vi.fn((e: FormEvent) => e.preventDefault()),
    showOcrButton: false,
    onPhotoSelected: vi.fn(),
    ...overrides,
  };
  render(<ManualIngredientsForm {...props} />);
  return props;
}

describe("ManualIngredientsForm", () => {
  it("renders the name and ingredients fields with their current values", () => {
    renderForm({ name: "Nutella", ingredients: "cacao, sucre" });

    expect(screen.getByLabelText(/nom du produit/i)).toHaveValue("Nutella");
    expect(screen.getByLabelText(/ingrédients/i)).toHaveValue("cacao, sucre");
  });

  it("calls onNameChange when the name field changes", () => {
    const props = renderForm();

    fireEvent.change(screen.getByLabelText(/nom du produit/i), {
      target: { value: "Produit maison" },
    });

    expect(props.onNameChange).toHaveBeenCalledWith("Produit maison");
  });

  it("calls onIngredientsChange when the ingredients field changes", () => {
    const props = renderForm();

    fireEvent.change(screen.getByLabelText(/ingrédients/i), {
      target: { value: "épinards, sel" },
    });

    expect(props.onIngredientsChange).toHaveBeenCalledWith("épinards, sel");
  });

  it("calls onSubmit when the form is submitted", () => {
    const props = renderForm();

    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("hides the OCR photo button when showOcrButton is false", () => {
    renderForm({ showOcrButton: false });

    expect(
      screen.queryByText(/photographier pour remplir/i)
    ).not.toBeInTheDocument();
  });

  it("shows the OCR photo button and calls onPhotoSelected with the picked file when showOcrButton is true", () => {
    const props = renderForm({ showOcrButton: true });

    const fileInput = screen.getByLabelText(/photographier pour remplir/i);
    const file = new File(["fake-bytes"], "label.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(props.onPhotoSelected).toHaveBeenCalledWith(file);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ManualIngredientsForm.test.tsx`
Expected: FAIL — `Cannot find module './ManualIngredientsForm'`.

- [ ] **Step 3: Write the implementation**

Créer `src/components/ManualIngredientsForm.tsx` :

```tsx
import type { FormEvent } from "react";

export interface ManualIngredientsFormProps {
  name: string;
  onNameChange: (value: string) => void;
  ingredients: string;
  onIngredientsChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  showOcrButton: boolean;
  onPhotoSelected: (file: File) => void;
}

export function ManualIngredientsForm({
  name,
  onNameChange,
  ingredients,
  onIngredientsChange,
  onSubmit,
  showOcrButton,
  onPhotoSelected,
}: ManualIngredientsFormProps) {
  function handleFileChange(e: FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) {
      onPhotoSelected(file);
    }
  }

  return (
    <form className="manual-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="manual-name" className="field-label">Nom du produit</label>
        <input
          id="manual-name"
          className="field-input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="manual-ingredients" className="field-label">Ingrédients</label>
        <textarea
          id="manual-ingredients"
          className="field-input"
          value={ingredients}
          onChange={(e) => onIngredientsChange(e.target.value)}
        />
        {showOcrButton && (
          <label htmlFor="ocr-photo" className="text-button">
            Photographier pour remplir
            <input
              id="ocr-photo"
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      <button type="submit" className="primary-button">Valider</button>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/ManualIngredientsForm.test.tsx`
Expected: PASS, all 6 tests green.

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ManualIngredientsForm.tsx src/components/ManualIngredientsForm.test.tsx
git commit -m "Extract ManualIngredientsForm with an optional OCR capture button"
```

---

### Task 3: Câbler l'OCR et `ManualIngredientsForm` dans `ResultView`

**Files:**
- Modify: `src/components/ResultView.tsx`
- Modify: `src/components/ResultView.test.tsx`

**Interfaces:**
- Consumes: `recognizeIngredientsText` (Task 1), `ManualIngredientsForm` + `ManualIngredientsFormProps` (Task 2), `Capacitor.isNativePlatform()` de `@capacitor/core`.
- Produces: aucun nouvel export — `categorizeFailure` reste exporté tel quel.

- [ ] **Step 1: Write the failing tests**

Ajouter en tête de `src/components/ResultView.test.tsx`, après les imports existants et avant les `vi.mock` déjà présents :

```ts
import { Capacitor } from "@capacitor/core";
import { recognizeIngredientsText } from "../lib/ocr-client";
```

Ajouter aux `vi.mock` existants (juste après `vi.mock("../lib/upcitemdb-client");`) :

```ts
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));
vi.mock("../lib/ocr-client");
```

Le défaut `isNativePlatform: () => false` préserve le comportement de tous les tests existants sans modification (branche web inchangée).

Ajouter à la fin du fichier, après la dernière `describe` :

```ts
describe("ResultView OCR ingredient recognition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockResolvedValue({ id: "scan1" }),
    });
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("shows the OCR button instead of the OFF upload button for no-ingredients on native platforms", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
    });

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    expect(
      await screen.findByText(/photographier pour remplir/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/photographier les ingrédients/i)
    ).not.toBeInTheDocument();
  });

  it("keeps the OFF upload button for no-ingredients on web", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
    });

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    expect(
      await screen.findByLabelText(/photographier les ingrédients/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/photographier pour remplir/i)
    ).not.toBeInTheDocument();
  });

  it("pre-fills the product name from Open Food Facts for the no-ingredients form", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi di Patate",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
    });

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    expect(await screen.findByLabelText(/nom du produit/i)).toHaveValue(
      "Gnocchi di Patate"
    );
  });

  it("fills the ingredients textarea with the OCR result when a photo is captured", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
    });
    (recognizeIngredientsText as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Farine de pomme de terre, sel"
    );

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    const fileInput = await screen.findByLabelText(/photographier pour remplir/i);
    const file = new File(["fake-bytes"], "label.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByLabelText(/ingrédients/i)).toHaveValue(
        "Farine de pomme de terre, sel"
      )
    );
  });

  it("leaves the ingredients textarea unchanged when OCR returns null", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
    });
    (recognizeIngredientsText as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    const fileInput = await screen.findByLabelText(/photographier pour remplir/i);
    const file = new File(["fake-bytes"], "label.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(recognizeIngredientsText).toHaveBeenCalled());
    expect(screen.getByLabelText(/ingrédients/i)).toHaveValue("");
  });

  it("shows the OCR button in the not-found form on native platforms, hidden on web", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    await screen.findByText(/produit non trouvé/i);
    expect(screen.getByLabelText(/photographier pour remplir/i)).toBeInTheDocument();
  });

  it("hides the OCR button in the not-found form on web", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    await screen.findByText(/produit non trouvé/i);
    expect(
      screen.queryByLabelText(/photographier pour remplir/i)
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ResultView.test.tsx`
Expected: FAIL — `Cannot find module '../lib/ocr-client'`, and once that's stubbed by the mock, failures on missing "photographier pour remplir" text / unchanged pre-fill behavior.

- [ ] **Step 3: Update imports in `ResultView.tsx`**

Dans `src/components/ResultView.tsx`, remplacer les imports (lignes 1-7) :

```ts
import { useEffect, useState, type FormEvent } from "react";
import { Capacitor } from "@capacitor/core";
import { resolveProduct, type ResolvedProduct } from "../lib/product-resolver";
import { uploadIngredientsPhoto } from "../lib/off-contribute";
import { recognizeIngredientsText } from "../lib/ocr-client";
import { matchIngredients, matchStructuredIngredients, type MatchResult } from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";
import { lookupProductName } from "../lib/upcitemdb-client";
import { LevelBadge } from "./LevelBadge";
import { ManualIngredientsForm } from "./ManualIngredientsForm";
```

(`FormEvent` reste utilisé par `handleManualSubmit`, gardé dans l'import `react`.)

- [ ] **Step 4: Compute the platform flag and pre-fill the name in the resolve effect**

Dans le corps de `ResultView`, juste après la ligne `export function ResultView({ ean, onBack }: ResultViewProps) {`, ajouter :

```ts
  const isNativePlatform = Capacitor.isNativePlatform();
```

Dans le `useEffect` de résolution du produit, remplacer :

```ts
      const result =
        product.structuredIngredients.length > 0
          ? matchStructuredIngredients(product.structuredIngredients)
          : matchIngredients(product.ingredientsText);
      setState({ status: "found", product, result });
      saveScan({
```

par :

```ts
      const result =
        product.structuredIngredients.length > 0
          ? matchStructuredIngredients(product.structuredIngredients)
          : matchIngredients(product.ingredientsText);
      setState({ status: "found", product, result });
      if (categorizeFailure(result, product) === "no-ingredients") {
        setManualName(product.productName);
      }
      saveScan({
```

- [ ] **Step 5: Add the OCR photo handler**

Juste après `handlePhotoSelected` (qui reste inchangée pour le flux OFF web), ajouter :

```ts
  async function handleOcrPhotoSelected(file: File) {
    const text = await recognizeIngredientsText(file);
    if (text) {
      setManualIngredients(text);
    }
  }
```

- [ ] **Step 6: Replace the not-found form with `ManualIngredientsForm`**

Remplacer le bloc `if (state.status === "not-found") { ... }` :

```tsx
  if (state.status === "not-found") {
    return (
      <div className="screen-content">
        <p>Produit non trouvé sur Open Food Facts.</p>
        <ManualIngredientsForm
          name={manualName}
          onNameChange={setManualName}
          ingredients={manualIngredients}
          onIngredientsChange={setManualIngredients}
          onSubmit={handleManualSubmit}
          showOcrButton={isNativePlatform}
          onPhotoSelected={handleOcrPhotoSelected}
        />
        <button className="text-button" onClick={onBack}>Retour</button>
      </div>
    );
  }
```

- [ ] **Step 7: Branch the no-ingredients block between OCR and OFF upload**

Dans le rendu `found`, remplacer le bloc `if (failureReason === "no-ingredients") { ... }` :

```tsx
          if (failureReason === "no-ingredients") {
            return (
              <div className="ingredient-line">
                <p>
                  Liste d'ingrédients non disponible sur Open Food Facts
                  pour ce produit.
                </p>
                {isNativePlatform ? (
                  <ManualIngredientsForm
                    name={manualName}
                    onNameChange={setManualName}
                    ingredients={manualIngredients}
                    onIngredientsChange={setManualIngredients}
                    onSubmit={handleManualSubmit}
                    showOcrButton={true}
                    onPhotoSelected={handleOcrPhotoSelected}
                  />
                ) : (
                  <>
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
                  </>
                )}
              </div>
            );
          }
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/components/ResultView.test.tsx`
Expected: PASS — l'ensemble du fichier (tests existants + les 7 nouveaux) passe sans modification des tests préexistants.

- [ ] **Step 9: Run the full suite and typecheck**

Run: `npm test && npx tsc -b`
Expected: tous les fichiers de test passent (18+ fichiers), aucune erreur TypeScript.

- [ ] **Step 10: Commit**

```bash
git add src/components/ResultView.tsx src/components/ResultView.test.tsx
git commit -m "Wire local OCR into ResultView for not-found and no-ingredients flows"
```

---

### Task 4: Synchroniser Capacitor et vérifier le build Android

**Files:**
- Aucun fichier source modifié — tâche de vérification du build natif après l'ajout des deux plugins.

**Interfaces:**
- Consomme : `package.json` mis à jour (Task 1), build web fonctionnel (`npm run build`).
- Produit : confirmation que l'APK debug se build avec les nouveaux modules natifs ML Kit Text Recognition et Filesystem enregistrés.

- [ ] **Step 1: Builder le web et synchroniser le projet Android**

```bash
npm run build
npx cap sync android
```

Expected: `npx cap sync android` se termine par "Sync finished" et liste `@capacitor-mlkit/text-recognition` et `@capacitor/filesystem` parmi les plugins détectés (sortie du type "Found X Capacitor plugins for android").

- [ ] **Step 2: Builder l'APK debug**

```bash
scripts/build-apk.sh
```

Expected: `BUILD SUCCESSFUL`, message `==> APK built: .../android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 3: Vérifier que l'APK a bien été produit**

Run: `ls -la android/app/build/outputs/apk/debug/app-debug.apk`
Expected: le fichier existe, taille supérieure à celle de l'APK précédent (modèles ML Kit embarqués, quelques Mo de plus qu'un build sans OCR).

- [ ] **Step 4: Commit du projet Android synchronisé**

```bash
git add android/
git commit -m "Sync Android project with ML Kit Text Recognition and Filesystem plugins"
```

Note : l'installation sur un appareil physique (`adb install`, comme pour les plans APK précédents) et la vérification manuelle du bouton "Photographier pour remplir" en conditions réelles restent une étape séparée, à faire une fois un appareil Android connecté — hors du périmètre testable de ce plan (pas de device connecté en session de développement).

---

## Cohérence des types

- `recognizeIngredientsText(photo: Blob): Promise<string | null>` (Task 1) — signature identique dans `ocr-client.ts` et son usage dans `ResultView.tsx` (Task 3).
- `ManualIngredientsFormProps` (Task 2) — mêmes noms de champs (`name`, `onNameChange`, `ingredients`, `onIngredientsChange`, `onSubmit`, `showOcrButton`, `onPhotoSelected`) dans la définition du composant et dans les deux usages de `ResultView.tsx` (Task 3).
- `categorizeFailure(result, product)` (déjà existant, inchangé) réutilisé tel quel dans le `useEffect` de résolution (Task 3) pour décider du pré-remplissage du nom.
