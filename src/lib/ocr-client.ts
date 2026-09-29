import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { TextRecognition, Script, type TextBlock } from "@capacitor-mlkit/text-recognition";

const DEFAULT_TEMP_FILE_PATH = "oxalapp-ocr-temp.jpg";

// Matches the "Ingredients:" / "Ingrédients :" label that starts the
// relevant block on most packaging, so we can drop unrelated text (brand
// name, nutrition table, legal notices) that ML Kit also picks up from the
// same photo.
const INGREDIENTS_LABEL = /ingr[ée]dients?\s*[:\s]/i;

// Extracts just the ingredients list from the recognized blocks, when a
// block clearly starts with an "Ingredients:" label — trims everything
// before the label within that block, and drops unrelated blocks entirely.
// Falls back to the full recognized text when no such label is found, since
// some packaging omits it or ML Kit may split the label from its list.
export function extractIngredientsText(
  fullText: string,
  blocks: TextBlock[]
): string {
  for (const block of blocks) {
    const match = block.text.match(INGREDIENTS_LABEL);
    if (match && match.index !== undefined) {
      const afterLabel = block.text.slice(match.index + match[0].length).trim();
      if (afterLabel.length > 0) return afterLabel;
    }
  }
  return fullText.trim();
}

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
  photo: Blob,
  options?: { tempFilePath?: string }
): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const tempFilePath = options?.tempFilePath ?? DEFAULT_TEMP_FILE_PATH;

  let fileUri: string;
  try {
    const data = await blobToBase64(photo);
    const written = await Filesystem.writeFile({
      path: tempFilePath,
      data,
      directory: Directory.Cache,
    });
    fileUri = written.uri;
  } catch {
    return null;
  }

  try {
    const { text, blocks } = await TextRecognition.processImage({
      path: fileUri,
      script: Script.Latin,
    });
    const extracted = extractIngredientsText(text, blocks);
    return extracted.length > 0 ? extracted : null;
  } catch {
    return null;
  } finally {
    try {
      await Filesystem.deleteFile({
        path: tempFilePath,
        directory: Directory.Cache,
      });
    } catch {
      // Best-effort cleanup — a leftover temp file in the app's own cache
      // isn't worth surfacing an error for.
    }
  }
}
