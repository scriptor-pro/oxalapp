import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ResultView, categorizeFailure } from "./ResultView";
import { getProductByBarcode } from "../lib/off-client";
import { pb } from "../lib/pocketbase";
import { uploadIngredientsPhoto } from "../lib/off-contribute";

vi.mock("../lib/off-client");
vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
    authStore: { record: { id: "user123" } },
  },
}));
vi.mock("../lib/off-contribute");

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
      screen.getByLabelText(/photographier les ingrédients/i)
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
      screen.queryByLabelText(/photographier les ingrédients/i)
    ).not.toBeInTheDocument();
  });
});

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

describe("ResultView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockResolvedValue({ id: "scan1" }),
    });
  });

  it("shows the oxalate level when the product is found on Open Food Facts", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      imageUrl: null,
    });

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutella/)).toBeInTheDocument();
  });

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

  it("saves the scan to PocketBase after a successful match", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "cacao",
      imageUrl: null,
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
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(<ResultView ean="0000000000000" onBack={vi.fn()} />);

    expect(await screen.findByText(/produit non trouvé/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ingrédients/i)).toBeInTheDocument();
  });

  it("matches manually entered ingredients and saves with source saisie_manuelle", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);
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
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Chocolat bilingue",
      ingredientsText: "Cacao / Cocoa 70%",
      imageUrl: null,
    });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    await screen.findByText(/très élevé/i);

    expect(screen.getByText(/cacao/)).toBeInTheDocument();
    expect(screen.getByText(/cocoa/)).toBeInTheDocument();

    const keyWarning = consoleError.mock.calls.some((args) =>
      String(args[0]).includes("key")
    );
    expect(keyWarning).toBe(false);

    consoleError.mockRestore();
  });

  it("still displays the result when saving to PocketBase fails", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "cacao",
      imageUrl: null,
    });
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockRejectedValue(new Error("network error")),
    });

    render(<ResultView ean="3017620422003" onBack={vi.fn()} />);

    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(await screen.findByText(/synchronisation/i)).toBeInTheDocument();
  });
});
