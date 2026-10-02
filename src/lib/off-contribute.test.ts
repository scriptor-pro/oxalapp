import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { uploadIngredientsPhoto } from "./off-contribute";
import { pb } from "./pocketbase";

describe("uploadIngredientsPhoto", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_POCKETBASE_URL", "https://pb.example");
    pb.authStore.save("user-token", null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    pb.authStore.clear();
  });

  it("posts the photo to the PocketBase relay with the user's token and returns true on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const image = new Blob(["fake-image-bytes"], { type: "image/jpeg" });
    const result = await uploadIngredientsPhoto("3017620422003", image, "fr");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://pb.example/api/oxalapp/off-upload");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Authorization: "user-token" });

    const body = options.body as FormData;
    expect(body.get("code")).toBe("3017620422003");
    expect(body.get("lang")).toBe("fr");
    expect(body.get("image")).toBeInstanceOf(Blob);
  });

  it("never sends Open Food Facts credentials from the client", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await uploadIngredientsPhoto("3017620422003", new Blob(["x"]), "fr");

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.has("user_id")).toBe(false);
    expect(body.has("password")).toBe(false);
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
