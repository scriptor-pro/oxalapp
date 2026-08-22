import { describe, it, expect, vi, afterEach } from "vitest";
import { uploadIngredientsPhoto } from "./off-contribute";

describe("uploadIngredientsPhoto", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a multipart form with the expected fields and returns true on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const image = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const result = await uploadIngredientsPhoto("3017620422003", image, "fr");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://world.openfoodfacts.org/cgi/product_image_upload.pl"
    );
    expect(options.method).toBe("POST");

    const body = options.body as FormData;
    expect(body.get("code")).toBe("3017620422003");
    expect(body.get("imagefield")).toBe("ingredients_fr");
    const uploadedFile = body.get("imgupload_ingredients_fr");
    expect(uploadedFile).toBeInstanceOf(Blob);
  });

  it("returns false when the network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const image = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const result = await uploadIngredientsPhoto("3017620422003", image, "fr");

    expect(result).toBe(false);
  });

  it("returns false when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const image = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const result = await uploadIngredientsPhoto("3017620422003", image, "fr");

    expect(result).toBe(false);
  });
});
