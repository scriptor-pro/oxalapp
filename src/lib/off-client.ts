export interface StructuredIngredient {
  text: string;
  percentEstimate: number | null;
  // Pourcentage déclaré sur l'étiquette (champ OFF `percent`), quand il
  // existe. Premier niveau seulement, comme percentEstimate. Le matcher
  // retient le plus grand des deux (spec 2026-10-01-pourcentages-declares).
  percentDeclared?: number | null;
  // Open Food Facts ingredient taxonomy id (e.g. "en:hazelnut"). Always
  // "en:"-prefixed, independent of the product's own language — lets the
  // matcher work on non-French/Dutch/English products. Absent when OFF
  // couldn't resolve the ingredient text against its taxonomy.
  offId?: string | null;
}

export interface OffProduct {
  productName: string;
  ingredientsText: string;
  imageUrl: string | null;
  lang: string | null;
  structuredIngredients: StructuredIngredient[];
}

interface OffApiResponse {
  status: number;
  product?: {
    product_name?: string;
    ingredients_text?: string;
    image_url?: string;
    lang?: string;
    ingredients?: { text?: string; percent_estimate?: number; percent?: number; id?: string }[];
  };
}

export async function getProductByBarcode(
  ean: string
): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${ean}.json`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data: OffApiResponse = await response.json();

  if (data.status !== 1 || !data.product) {
    return null;
  }

  const structuredIngredients: StructuredIngredient[] = (
    data.product.ingredients ?? []
  ).map((ingredient) => ({
    text: ingredient.text ?? "",
    percentEstimate: ingredient.percent_estimate ?? null,
    // Seulement s'il existe : la plupart des ingrédients n'ont pas de
    // pourcentage déclaré sur l'étiquette.
    ...(typeof ingredient.percent === "number" ? { percentDeclared: ingredient.percent } : {}),
    offId: ingredient.id ?? null,
  }));

  return {
    productName: data.product.product_name ?? "",
    ingredientsText: data.product.ingredients_text ?? "",
    imageUrl: data.product.image_url ?? null,
    lang: data.product.lang ?? null,
    structuredIngredients,
  };
}
