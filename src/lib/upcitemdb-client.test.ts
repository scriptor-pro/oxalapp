import { describe, it, expect, vi, afterEach } from "vitest";
import { lookupProductName } from "./upcitemdb-client";

describe("lookupProductName", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the product title when UPCitemdb finds the barcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: "OK",
            items: [{ title: "Gnocchi di Patate 500g" }],
          }),
      })
    );

    const result = await lookupProductName("8001234567890");

    expect(result).toBe("Gnocchi di Patate 500g");
  });

  it("returns null when UPCitemdb has no items for the barcode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: "OK", items: [] }),
      })
    );

    const result = await lookupProductName("0000000000000");

    expect(result).toBeNull();
  });

  it("returns null when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const result = await lookupProductName("8001234567890");

    expect(result).toBeNull();
  });

  it("returns null when the response is not ok (e.g. quota exceeded)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 })
    );

    const result = await lookupProductName("8001234567890");

    expect(result).toBeNull();
  });
});
