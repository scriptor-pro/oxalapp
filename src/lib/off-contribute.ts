export async function uploadIngredientsPhoto(
  ean: string,
  image: Blob,
  lang: string
): Promise<boolean> {
  const formData = new FormData();
  formData.append("code", ean);
  formData.append("user_id", import.meta.env.VITE_OFF_CONTRIBUTOR_USER ?? "");
  formData.append(
    "password",
    import.meta.env.VITE_OFF_CONTRIBUTOR_PASSWORD ?? ""
  );
  formData.append("imagefield", `ingredients_${lang}`);
  formData.append(`imgupload_ingredients_${lang}`, image);

  try {
    const response = await fetch(
      "https://world.openfoodfacts.org/cgi/product_image_upload.pl",
      {
        method: "POST",
        body: formData,
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
