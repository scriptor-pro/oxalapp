export interface UsdaProduct {
  productName: string;
  brand: string;
  ingredientsText: string;
  category: string;
  servingSize: number | null;
  servingSizeUnit: string;
}

export async function getProductByGtinUpc(
  gtin: string
): Promise<UsdaProduct | null> {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL ?? "";
  const url = `${baseUrl}/usda/product/${gtin}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data: UsdaProduct = await response.json();
  return data;
}
