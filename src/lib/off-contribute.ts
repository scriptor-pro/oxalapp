import { pb } from "./pocketbase";

// Passe par le relais PocketBase (pocketbase/pb_hooks/off-upload.pb.js) :
// les identifiants du compte contributeur Open Food Facts restent sur le
// serveur et n'apparaissent jamais dans le bundle.
export async function uploadIngredientsPhoto(
  ean: string,
  image: Blob,
  lang: string
): Promise<boolean> {
  const formData = new FormData();
  formData.append("code", ean);
  formData.append("lang", lang);
  formData.append("image", image);

  const baseUrl = import.meta.env.VITE_POCKETBASE_URL ?? "";
  try {
    const response = await fetch(`${baseUrl}/api/oxalapp/off-upload`, {
      method: "POST",
      headers: { Authorization: pb.authStore.token },
      body: formData,
    });
    return response.ok;
  } catch {
    return false;
  }
}
