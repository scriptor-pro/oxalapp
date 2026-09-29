import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReadBarcodes = vi.fn();

vi.mock("zxing-wasm/reader", () => ({
  prepareZXingModule: vi.fn(),
  readBarcodes: (...args: unknown[]) => mockReadBarcodes(...args),
}));

// The bundled wasm asset URL is irrelevant to the decode logic under test.
vi.mock("zxing-wasm/reader/zxing_reader.wasm?url", () => ({ default: "wasm" }));

import { scanImageData } from "./barcode-scanner";

const frame = { data: new Uint8ClampedArray(4), width: 1, height: 1 } as ImageData;

describe("scanImageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the digits of the first valid barcode", async () => {
    mockReadBarcodes.mockResolvedValue([
      { isValid: true, text: "3017620422003", format: "EAN-13" },
    ]);
    expect(await scanImageData(frame)).toBe("3017620422003");
  });

  it("restricts the decoder to retail formats with tryHarder enabled", async () => {
    mockReadBarcodes.mockResolvedValue([]);
    await scanImageData(frame);
    const options = mockReadBarcodes.mock.calls[0][1];
    expect(options.tryHarder).toBe(true);
    expect(options.formats).toEqual(["EAN-13", "EAN-8", "UPC-A", "UPC-E"]);
  });

  it("skips invalid results and returns null when none are valid", async () => {
    mockReadBarcodes.mockResolvedValue([
      { isValid: false, text: "garbage", format: "EAN-13" },
      { isValid: true, text: "", format: "EAN-13" },
    ]);
    expect(await scanImageData(frame)).toBeNull();
  });

  it("returns null when no barcode is found", async () => {
    mockReadBarcodes.mockResolvedValue([]);
    expect(await scanImageData(frame)).toBeNull();
  });
});
