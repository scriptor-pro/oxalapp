export interface NormalizedGtin {
  rawCode: string;
  normalizedGtin14: string;
  symbology: "EAN_8" | "EAN_13" | "UPC_A" | "UPC_E" | "GTIN_14";
}

const SYMBOLOGY_BY_LENGTH: Record<number, NormalizedGtin["symbology"]> = {
  8: "EAN_8",
  12: "UPC_A",
  13: "EAN_13",
  14: "GTIN_14",
};

function isValidGtinChecksum(digits: string): boolean {
  // GS1 modulo-10: from the rightmost digit (the check digit itself
  // excluded), alternate weights 3 and 1 starting with 3, working right
  // to left across the payload.
  const payload = digits.slice(0, -1);
  const checkDigit = Number(digits[digits.length - 1]);

  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    const digit = Number(payload[payload.length - 1 - i]);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return expectedCheckDigit === checkDigit;
}

export function normalizeGtin(rawCode: string): NormalizedGtin | null {
  if (!/^\d+$/.test(rawCode)) {
    return null;
  }

  const symbology = SYMBOLOGY_BY_LENGTH[rawCode.length];
  if (!symbology) {
    return null;
  }

  if (!isValidGtinChecksum(rawCode)) {
    return null;
  }

  return {
    rawCode,
    normalizedGtin14: rawCode.padStart(14, "0"),
    symbology,
  };
}
