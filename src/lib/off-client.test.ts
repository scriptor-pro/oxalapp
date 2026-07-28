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
    });
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
});
