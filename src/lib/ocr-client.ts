import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { TextRecognition, Script } from "@capacitor-mlkit/text-recognition";

const TEMP_FILE_PATH = "oxalapp-ocr-temp.jpg";

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function recognizeIngredientsText(
  photo: Blob
): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  let fileUri: string;
  try {
    const data = await blobToBase64(photo);
    const written = await Filesystem.writeFile({
      path: TEMP_FILE_PATH,
      data,
      directory: Directory.Cache,
    });
    fileUri = written.uri;
  } catch {
    return null;
  }

  try {
    const { text } = await TextRecognition.processImage({
      path: fileUri,
      script: Script.Latin,
    });
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  } finally {
    try {
      await Filesystem.deleteFile({
        path: TEMP_FILE_PATH,
        directory: Directory.Cache,
      });
    } catch {
      // Best-effort cleanup — a leftover temp file in the app's own cache
      // isn't worth surfacing an error for.
    }
  }
}
