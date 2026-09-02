import { describe, it, expect, vi, afterEach } from "vitest";
import { getProductByBarcode } from "./off-client";

describe("getProductByBarcode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns product data when Open Food Facts finds the barcode", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Nutella",
        ingredients_text: "Sugar, palm oil, hazelnuts 13%, cocoa",
        image_url: "https://images.openfoodfacts.org/nutella.jpg",
        lang: "en",
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

    expect(result).toEqual({
      productName: "Nutella",
      ingredientsText: "Sugar, palm oil, hazelnuts 13%, cocoa",
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
      lang: "en",
      structuredIngredients: [],
    });
  });

  it("returns a null lang when Open Food Facts does not provide one", async () => {
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

    expect(result?.lang).toBeNull();
  });

  it("returns null when Open Food Facts has no product for the barcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 0 }),
      })
    );

    const result = await getProductByBarcode("0000000000000");

    expect(result).toBeNull();
  });

  it("returns null when the network request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    const result = await getProductByBarcode("3017620422003");

    expect(result).toBeNull();
  });

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
      { text: "Épinards", percentEstimate: 55, offId: null },
      { text: "crème", percentEstimate: 20, offId: null },
      { text: "sel", percentEstimate: 5, offId: null },
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
      { text: "Farine", percentEstimate: null, offId: null },
      { text: "noisettes", percentEstimate: null, offId: null },
      { text: "sucre", percentEstimate: null, offId: null },
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

  it("exposes the ingredient's OFF taxonomy id (offId) when present", async () => {
    const mockResponse = {
      status: 1,
      product: {
        product_name: "Nutella",
        ingredients_text: "Sucre, noisettes",
        image_url: null,
        lang: "fr",
        ingredients: [
          { text: "Sucre", percent_estimate: 52, id: "en:sugar" },
          { text: "noisettes", percent_estimate: 13 },
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
      { text: "Sucre", percentEstimate: 52, offId: "en:sugar" },
      { text: "noisettes", percentEstimate: 13, offId: null },
    ]);
  });
});
