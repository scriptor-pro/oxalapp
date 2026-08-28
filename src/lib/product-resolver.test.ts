import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveProduct } from "./product-resolver";
import { getProductByBarcode } from "./off-client";
import { getProductByGtinUpc } from "./usda-client";

vi.mock("./off-client");
vi.mock("./usda-client");

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
});
