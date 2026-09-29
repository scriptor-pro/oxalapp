import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import type { ReaderOptions } from "zxing-wasm/reader";
// Bundle the ZXing-C++ `.wasm` locally (Vite emits a hashed asset URL) so the
// scanner works fully offline inside the Capacitor Android WebView instead of
// fetching it from a CDN.
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

// Point the Emscripten module at the locally bundled binary. Lazy: the wasm is
// not fetched/instantiated until the first `readBarcodes` call.
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith(".wasm") ? wasmUrl : prefix + path,
  },
});

// Retail linear symbologies only — restricting the format set makes the C++
// decoder spend its effort on the codes we actually care about and avoids
// spurious matches from other 1D/2D families.
const READER_OPTIONS: ReaderOptions = {
  formats: ["EAN-13", "EAN-8", "UPC-A", "UPC-E"],
  // Curved surfaces (cans, tins) distort bar widths; TRY_HARDER + rotation +
  // downscale give the decoder several passes to lock onto a readable slice.
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  maxNumberOfSymbols: 1,
};

/**
 * Decode a single retail barcode from a camera frame using ZXing-C++ (WASM).
 * Returns the barcode digits, or `null` when no valid code is found.
 */
export async function scanImageData(
  imageData: ImageData
): Promise<string | null> {
  const results = await readBarcodes(imageData, READER_OPTIONS);
  for (const result of results) {
    if (result.isValid && result.text) {
      return result.text;
    }
  }
  return null;
}
