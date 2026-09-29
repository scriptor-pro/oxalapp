import { describe, it, expect, vi, beforeEach } from "vitest";
import { recognizeIngredientsText, extractIngredientsText } from "./ocr-client";
import { Capacitor } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { TextRecognition } from "@capacitor-mlkit/text-recognition";
import type { TextBlock } from "@capacitor-mlkit/text-recognition";

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: vi.fn(), deleteFile: vi.fn() },
  Directory: { Cache: "CACHE" },
}));
vi.mock("@capacitor-mlkit/text-recognition", () => ({
  TextRecognition: { processImage: vi.fn() },
  Script: { Latin: "LATIN" },
}));

function fakePhoto(): Blob {
  return new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/jpeg" });
}

describe("recognizeIngredientsText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (Filesystem.writeFile as ReturnType<typeof vi.fn>).mockResolvedValue({
      uri: "file:///cache/oxalapp-ocr-temp.jpg",
    });
    (Filesystem.deleteFile as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("returns null immediately on a non-native platform, without touching filesystem or ML Kit", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
    expect(TextRecognition.processImage).not.toHaveBeenCalled();
  });

  it("returns the recognized text when everything succeeds", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "Sucre, farine de blé, noisettes",
      blocks: [],
    });

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBe("Sucre, farine de blé, noisettes");
    expect(TextRecognition.processImage).toHaveBeenCalledWith({
      path: "file:///cache/oxalapp-ocr-temp.jpg",
      script: "LATIN",
    });
  });

  it("writes base64-encoded binary data to the filesystem", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "texte",
      blocks: [],
    });

    await recognizeIngredientsText(fakePhoto());

    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: expect.any(String),
      data: "AQIDBA==", // base64 of bytes [1,2,3,4]
      directory: "CACHE",
    });
  });

  it("returns null when writing the temp file fails", async () => {
    (Filesystem.writeFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("disk full")
    );

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
    expect(TextRecognition.processImage).not.toHaveBeenCalled();
  });

  it("returns null when ML Kit rejects", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unreadable image")
    );

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
  });

  it("returns null when the recognized text is empty or whitespace-only", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "   ",
      blocks: [],
    });

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBeNull();
  });

  it("deletes the temp file after a successful recognition", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "texte",
      blocks: [],
    });

    await recognizeIngredientsText(fakePhoto());

    expect(Filesystem.deleteFile).toHaveBeenCalledWith({
      path: expect.any(String),
      directory: "CACHE",
    });
  });

  it("deletes the temp file even when ML Kit rejects", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unreadable image")
    );

    await recognizeIngredientsText(fakePhoto());

    expect(Filesystem.deleteFile).toHaveBeenCalled();
  });

  it("uses a caller-provided temp file path when given", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "texte",
      blocks: [],
    });

    await recognizeIngredientsText(fakePhoto(), {
      tempFilePath: "oxalapp-ocr-capture.jpg",
    });

    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: "oxalapp-ocr-capture.jpg" })
    );
    expect(Filesystem.deleteFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: "oxalapp-ocr-capture.jpg" })
    );
  });

  it("passes only the block after an Ingredients: label to the caller, dropping unrelated blocks", async () => {
    (TextRecognition.processImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "Bouteille Marque X\nIngrédients : eau, sucre, cacao.\nValeurs nutritionnelles pour 100ml...",
      blocks: [
        block("Bouteille Marque X"),
        block("Ingrédients : eau, sucre, cacao."),
        block("Valeurs nutritionnelles pour 100ml..."),
      ],
    });

    const result = await recognizeIngredientsText(fakePhoto());

    expect(result).toBe("eau, sucre, cacao.");
  });
});

function block(text: string): TextBlock {
  return { text, lines: [] };
}

describe("extractIngredientsText", () => {
  it("keeps only the text after the label within the matching block", () => {
    const result = extractIngredientsText("irrelevant full text", [
      block("Nom du produit"),
      block("INGRÉDIENTS: farine, sucre, sel"),
    ]);

    expect(result).toBe("farine, sucre, sel");
  });

  it("matches the label without accents or a colon", () => {
    const result = extractIngredientsText("irrelevant", [
      block("Ingredients eau, sel"),
    ]);

    expect(result).toBe("eau, sel");
  });

  it("falls back to the full recognized text when no block has the label", () => {
    const result = extractIngredientsText("eau, sucre, cacao", [
      block("Marque"),
      block("eau, sucre, cacao"),
    ]);

    expect(result).toBe("eau, sucre, cacao");
  });

  it("falls back to the full text when the label is the last thing in its block", () => {
    const result = extractIngredientsText("Ingrédients :\neau, sel", [
      block("Ingrédients :"),
      block("eau, sel"),
    ]);

    expect(result).toBe("Ingrédients :\neau, sel");
  });
});
