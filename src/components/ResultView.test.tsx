import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ResultView } from "./ResultView";
import { getProductByBarcode } from "../lib/off-client";
import { pb } from "../lib/pocketbase";

vi.mock("../lib/off-client");
vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
    authStore: { model: { id: "user123" } },
  },
}));

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

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("cacao");
    expect(items[1]).toHaveTextContent("cocoa");

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
