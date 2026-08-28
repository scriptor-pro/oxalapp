import { normalizeGtin } from "./gtin";
import { getProductByBarcode, type StructuredIngredient } from "./off-client";

export interface ResolvedProduct {
  gtin: string;
  rawCode: string;
  productName: string;
  ingredientsText: string;
  structuredIngredients: StructuredIngredient[];
  imageUrl: string | null;
  lang: string | null;
  sources: string[];
}

export async function resolveProduct(
  rawCode: string
): Promise<ResolvedProduct | null> {
  const normalized = normalizeGtin(rawCode);
  if (!normalized) {
    return null;
  }

  const offProduct = await getProductByBarcode(normalized.rawCode);
  if (!offProduct) {
    return null;
  }

  return {
    gtin: normalized.normalizedGtin14,
    rawCode: normalized.rawCode,
    productName: offProduct.productName,
    ingredientsText: offProduct.ingredientsText,
    structuredIngredients: offProduct.structuredIngredients,
    imageUrl: offProduct.imageUrl,
    lang: offProduct.lang,
    sources: ["open_food_facts"],
  };
}
