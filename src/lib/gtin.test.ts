import { describe, it, expect } from "vitest";
import { normalizeGtin } from "./gtin";

describe("normalizeGtin", () => {
  it("normalizes a valid EAN-13 to GTIN-14 with a leading zero", () => {
    const result = normalizeGtin("5449000000996");
    expect(result).toEqual({
      rawCode: "5449000000996",
      normalizedGtin14: "05449000000996",
      symbology: "EAN_13",
    });
  });

  it("normalizes a valid EAN-8 to GTIN-14", () => {
    const result = normalizeGtin("40170725");
    expect(result).toEqual({
      rawCode: "40170725",
      normalizedGtin14: "00000040170725",
      symbology: "EAN_8",
    });
  });

  it("normalizes a valid UPC-A to GTIN-14", () => {
    const result = normalizeGtin("036000291452");
    expect(result).toEqual({
      rawCode: "036000291452",
      normalizedGtin14: "00036000291452",
      symbology: "UPC_A",
    });
  });

  it("normalizes a valid GTIN-14 as-is", () => {
    const result = normalizeGtin("00012345678905");
    expect(result).toEqual({
      rawCode: "00012345678905",
      normalizedGtin14: "00012345678905",
      symbology: "GTIN_14",
    });
  });

  it("returns null for an invalid checksum", () => {
    // last digit changed from 6 to 7, breaking the EAN-13 checksum
    expect(normalizeGtin("5449000000997")).toBeNull();
  });

  it("returns null for a non-numeric code", () => {
    expect(normalizeGtin("ABCDEFGHIJKLM")).toBeNull();
  });

  it("returns null for an unsupported length", () => {
    expect(normalizeGtin("123456")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(normalizeGtin("")).toBeNull();
  });
});
