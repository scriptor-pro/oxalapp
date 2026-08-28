export interface StructuredIngredient {
  text: string;
  percentEstimate: number | null;
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
    ingredients?: { text?: string; percent_estimate?: number }[];
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
  }));

  return {
    productName: data.product.product_name ?? "",
    ingredientsText: data.product.ingredients_text ?? "",
    imageUrl: data.product.image_url ?? null,
    lang: data.product.lang ?? null,
    structuredIngredients,
  };
}
