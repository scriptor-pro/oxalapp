import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveProduct } from "./product-resolver";
import { getProductByBarcode } from "./off-client";

vi.mock("./off-client");

describe("resolveProduct", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a normalized product when Open Food Facts finds the barcode", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue({
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
      lang: "fr",
      structuredIngredients: [],
    });

    const result = await resolveProduct("3017620422003");

    expect(result).toEqual({
      gtin: "03017620422003",
      rawCode: "3017620422003",
      productName: "Nutella",
      ingredientsText: "Sucre, huile de palme, noisettes, cacao",
      structuredIngredients: [],
      imageUrl: "https://images.openfoodfacts.org/nutella.jpg",
      lang: "fr",
      sources: ["open_food_facts"],
    });
    expect(getProductByBarcode).toHaveBeenCalledWith("3017620422003");
  });

  it("returns null without calling Open Food Facts when the barcode checksum is invalid", async () => {
    const result = await resolveProduct("3017620422999");

    expect(result).toBeNull();
    expect(getProductByBarcode).not.toHaveBeenCalled();
  });

  it("returns null when Open Food Facts has no product for a validly-formed barcode", async () => {
    (getProductByBarcode as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await resolveProduct("3017620422003");

    expect(result).toBeNull();
  });
});
