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
