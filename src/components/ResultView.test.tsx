import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ResultView, categorizeFailure } from "./ResultView";
import { resolveProduct } from "../lib/product-resolver";
import { pb } from "../lib/pocketbase";
import { uploadIngredientsPhoto } from "../lib/off-contribute";
import { lookupProductName } from "../lib/upcitemdb-client";
import { Capacitor } from "@capacitor/core";
import { recognizeIngredientsText } from "../lib/ocr-client";

vi.mock("../lib/product-resolver");
vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
    authStore: { record: { id: "user123" } },
  },
}));
vi.mock("../lib/off-contribute");
vi.mock("../lib/upcitemdb-client");
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));
vi.mock("../lib/ocr-client");

describe("categorizeFailure", () => {
  it("returns 'no-ingredients' when the level is non déterminable and ingredientsText is empty", () => {
    const result = categorizeFailure(
      { level: "non déterminable", matchedIngredients: [], unknownIngredients: [] },
      { ingredientsText: "" }
    );
    expect(result).toBe("no-ingredients");
  });

  it("returns 'no-ingredients' when ingredientsText is only whitespace", () => {
    const result = categorizeFailure(
      { level: "non déterminable", matchedIngredients: [], unknownIngredients: [] },
      { ingredientsText: "   " }
    );
    expect(result).toBe("no-ingredients");
  });

  it("returns 'no-match' when the level is non déterminable but ingredientsText has content", () => {
    const result = categorizeFailure(
      { level: "non déterminable", matchedIngredients: [], unknownIngredients: [] },
      { ingredientsText: "water, coconut oil, salt" }
    );
    expect(result).toBe("no-match");
  });

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

  it("returns null when the level is not non déterminable", () => {
    const result = categorizeFailure(
      { level: "élevé", matchedIngredients: [], unknownIngredients: [] },
      { ingredientsText: "cacao" }
    );
    expect(result).toBeNull();
  });
});

describe("ResultView failure messaging", () => {
  it("shows a no-ingredients message with a contribute-photo button when OFF has no ingredients text", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    expect(await screen.findByText(/non déterminable/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/photographier les ingrédients/i)
    ).toBeInTheDocument();
  });

  it("shows a no-match message without a contribute-photo button when ingredients text exists but nothing matched", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Boursin Vegan",
      ingredientsText: "water, coconut oil, salt",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="1234567890123" onBack={vi.fn()} />);

    expect(
      await screen.findByText(/aucun ingrédient à risque connu détecté/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/photographier les ingrédients/i)
    ).not.toBeInTheDocument();
  });
});

describe("ResultView photo contribution", () => {
  it("uploads the selected photo and shows a confirmation message on success", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
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

  it("uploads the photo with the product's own language when Open Food Facts provides one", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: "nl",
      structuredIngredients: [],
      sources: ["open_food_facts"],
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
        "nl"
      )
    );
  });

  it("shows a failure message when the photo upload fails", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Gnocchi",
      ingredientsText: "",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
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

describe("ResultView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockResolvedValue({ id: "scan1" }),
    });
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("shows the oxalate level when the product is found on Open Food Facts", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutella/)).toBeInTheDocument();
  });

  it("shows a methodological caveat for ingredient-keyword-based results", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
    });

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    expect(
      await screen.findByText(
        /déduit de la liste d'ingrédients, pas d'une quantité mesurée dans ce produit précis/
      )
    ).toBeInTheDocument();
  });

  it("saves the scan to PocketBase after a successful match", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "cacao",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
    });
    const create = vi.fn().mockResolvedValue({ id: "scan1" });
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({ create });

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: "user123",
          ean: "3017620422003",
          productName: "Nutella",
          level: "très élevé",
          source: "off",
        })
      )
    );
  });

  it("shows manual entry form when the product is not found", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/produit non trouvé/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ingrédients/i)).toBeInTheDocument();
  });

  it("matches manually entered ingredients and saves with source saisie_manuelle", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const create = vi.fn().mockResolvedValue({ id: "scan1" });
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({ create });

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    await screen.findByText(/produit non trouvé/i);

    fireEvent.change(screen.getByLabelText(/nom du produit/i), {
      target: { value: "Produit maison" },
    });
    fireEvent.change(screen.getByLabelText(/ingrédients/i), {
      target: { value: "épinards, sucre" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          productName: "Produit maison",
          level: "très élevé",
          source: "saisie_manuelle",
        })
      )
    );
  });

  it("renders matched ingredients that share the same dbItem without a duplicate-key warning", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Chocolat bilingue",
      ingredientsText: "Cacao / Cocoa 70%",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
    });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    await screen.findByText(/très élevé/i);

    // Noms affichés tels qu'écrits sur l'étiquette (majuscule comprise).
    expect(screen.getByText(/Cacao/)).toBeInTheDocument();
    expect(screen.getByText(/Cocoa/)).toBeInTheDocument();

    const keyWarning = consoleError.mock.calls.some((args) =>
      String(args[0]).includes("key")
    );
    expect(keyWarning).toBe(false);

    consoleError.mockRestore();
  });

  it("still displays the result when saving to PocketBase fails", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "cacao",
      imageUrl: null,
      lang: null,
      structuredIngredients: [],
      sources: ["open_food_facts"],
    });
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockRejectedValue(new Error("network error")),
    });

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(await screen.findByText(/synchronisation/i)).toBeInTheDocument();
  });
});

describe("ResultView UPCitemdb fallback", () => {
  it("pre-fills the product name field when UPCitemdb finds a name", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);
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
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    await screen.findByText(/produit non trouvé/i);

    expect(screen.getByLabelText(/nom du produit/i)).toHaveValue("");
  });
});

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
    expect(screen.getByText(/Épinards \(55%\)/)).toBeInTheDocument();
  });

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
      sources: ["open_food_facts"],
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
      sources: ["open_food_facts"],
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
      sources: ["open_food_facts"],
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
      sources: ["open_food_facts"],
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
      sources: ["open_food_facts"],
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

describe("ResultView data attribution", () => {
  const ATTRIBUTION = "Données produit : Open Food Facts, licence ODbL.";

  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockResolvedValue({ id: "scan1" }),
    });
    (lookupProductName as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  function mockProductFrom(sources: string[]) {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      gtin: "00000000000000",
      rawCode: "0000000000000",
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      structuredIngredients: [],
      imageUrl: null,
      lang: "fr",
      sources,
    });
  }

  it("credits Open Food Facts under ODbL when the product data comes from Open Food Facts", async () => {
    mockProductFrom(["open_food_facts"]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(ATTRIBUTION)).toBeInTheDocument();
  });

  it("does not credit Open Food Facts for a product found on USDA FoodData Central", async () => {
    mockProductFrom(["usda"]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(screen.queryByText(ATTRIBUTION)).not.toBeInTheDocument();
  });

  it("does not credit Open Food Facts for manually entered ingredients", async () => {
    (resolveProduct as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    await screen.findByText(/produit non trouvé/i);
    fireEvent.change(screen.getByLabelText(/nom du produit/i), {
      target: { value: "Produit maison" },
    });
    fireEvent.change(screen.getByLabelText(/ingrédients/i), {
      target: { value: "épinards, sucre" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(screen.queryByText(ATTRIBUTION)).not.toBeInTheDocument();
  });
});

describe("ResultView risky ingredient display", () => {
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
      ingredientsText: structuredIngredients.map((i) => i.text).join(", "),
      structuredIngredients,
      imageUrl: null,
      lang: "fr",
      sources: ["open_food_facts"],
    });
  }

  it("names a risky ingredient as written on the label, not by the internal English keyword", async () => {
    mockStructuredProduct([
      { text: "noisettes", percentEstimate: 57.1428571428571, offId: "en:hazelnut" },
      { text: "sucre", percentEstimate: 42.8571428571429, offId: "en:sugar" },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText("noisettes (57%)")).toBeInTheDocument();
    expect(screen.queryByText(/hazelnut/i)).not.toBeInTheDocument();
  });

  it("rounds risky ingredient percentages and shows traces as <0,1%", async () => {
    mockStructuredProduct([
      { text: "sucre", percentEstimate: 99.715, offId: "en:sugar" },
      { text: "cacao", percentEstimate: 0.284999999999997, offId: "en:cocoa" },
      { text: "cannelle", percentEstimate: 0, offId: "en:cinnamon" },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/cacao \(0,3%, contribution réduite\)/)).toBeInTheDocument();
    expect(screen.getByText(/cannelle \(<0,1%, contribution réduite\)/)).toBeInTheDocument();
  });

  it("formats unknown ingredient percentages the same way", async () => {
    mockStructuredProduct([
      { text: "sucre", percentEstimate: 90.5, offId: "en:sugar" },
      { text: "préparation spéciale", percentEstimate: 9.5, offId: null },
    ]);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(
      await screen.findByText("Ingrédients non reconnus : préparation spéciale (9,5%).")
    ).toBeInTheDocument();
  });
});
