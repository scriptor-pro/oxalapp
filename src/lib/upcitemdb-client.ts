interface UpcItemDbResponse {
  code: string;
  items?: { title?: string }[];
}

export async function lookupProductName(ean: string): Promise<string | null> {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data: UpcItemDbResponse = await response.json();
  const title = data.items?.[0]?.title;
  return title ?? null;
}
