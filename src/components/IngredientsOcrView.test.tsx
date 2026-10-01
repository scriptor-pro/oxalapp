import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { recognizeIngredientsText } from "../lib/ocr-client";
import { pb } from "../lib/pocketbase";
import {
  IngredientsOcrView,
  getFrameCropInVideoSpace,
} from "./IngredientsOcrView";

vi.mock("../lib/ocr-client", () => ({
  recognizeIngredientsText: vi.fn(),
}));
vi.mock("../lib/pocketbase", () => ({
  pb: {
    authStore: { record: { id: "user-1" } },
    collection: vi.fn(),
  },
}));

function fakeStream() {
  const track = { stop: vi.fn() };
  return {
    getVideoTracks: () => [track],
    getTracks: () => [track],
  } as unknown as MediaStream;
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalToBlob = HTMLCanvasElement.prototype.toBlob;

describe("IngredientsOcrView", () => {
  const create = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pb.collection).mockReturnValue({ create } as never);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream()) },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
      configurable: true,
      get: () => 2,
    });
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as unknown as typeof originalGetContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback) {
      callback(new Blob(["x"], { type: "image/jpeg" }));
    }) as unknown as typeof originalToBlob;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
  });

  it("captures a frame from the live camera, fills the ingredients field via OCR, then estimates the level", async () => {
    vi.mocked(recognizeIngredientsText).mockResolvedValue("Sucre, cacao, lait");

    render(<IngredientsOcrView onBack={vi.fn()} />);

    const captureButton = await screen.findByRole("button", {
      name: /photographier les ingrédients/i,
    });
    await waitFor(() => expect(captureButton).not.toBeDisabled());
    fireEvent.click(captureButton);

    await waitFor(() =>
      expect(screen.getByLabelText("Ingrédients")).toHaveValue(
        "Sucre, cacao, lait"
      )
    );
    expect(recognizeIngredientsText).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    // "cacao" is a "très élevé" ingredient in the matcher database.
    expect(await screen.findByText(/très élevé/i)).toBeInTheDocument();
    expect(screen.getByText("cacao")).toBeInTheDocument();
  });

  it("names risky ingredients as typed, accents and plurals included", async () => {
    render(<IngredientsOcrView onBack={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Ingrédients"), {
      target: { value: "Épinards, sucre" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(await screen.findByText("Épinards", { selector: "strong" })).toBeInTheDocument();
  });

  it("saves the estimate to history with an empty EAN and manual source", async () => {
    render(<IngredientsOcrView onBack={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/nom du produit/i), {
      target: { value: "Gâteau maison" },
    });
    fireEvent.change(screen.getByLabelText("Ingrédients"), {
      target: { value: "farine, cacao" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        ean: "",
        productName: "Gâteau maison",
        level: "très élevé",
        source: "saisie_manuelle",
      })
    );
  });

  it("warns when OCR finds no readable text", async () => {
    vi.mocked(recognizeIngredientsText).mockResolvedValue(null);

    render(<IngredientsOcrView onBack={vi.fn()} />);

    const captureButton = await screen.findByRole("button", {
      name: /photographier les ingrédients/i,
    });
    await waitFor(() => expect(captureButton).not.toBeDisabled());
    fireEvent.click(captureButton);

    expect(
      await screen.findByText(/aucun texte lisible/i)
    ).toBeInTheDocument();
  });

  it("shows a permission error message when the camera is unavailable", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError")
    );

    render(<IngredientsOcrView onBack={vi.fn()} />);

    expect(
      await screen.findByText(/autorisation.*caméra/i)
    ).toBeInTheDocument();
  });

  it("disables the capture button until the camera stream is ready", () => {
    render(<IngredientsOcrView onBack={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /photographier les ingrédients/i })
    ).toBeDisabled();
  });
});

describe("getFrameCropInVideoSpace", () => {
  function rect(overrides: Partial<DOMRect>): DOMRect {
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON() {}, ...overrides } as DOMRect;
  }

  function video(videoWidth: number, videoHeight: number, containerRect: DOMRect) {
    const container = {
      getBoundingClientRect: () => containerRect,
    } as unknown as HTMLElement;
    return {
      videoWidth,
      videoHeight,
      parentElement: container,
    } as unknown as HTMLVideoElement;
  }

  it("maps a centered frame to the equivalent crop in native video pixels, accounting for object-fit: cover", () => {
    // 1920x1080 video rendered into a 300x220 container: cover-scale is
    // max(300/1920, 220/1080) ≈ 0.2037 (height-constrained), so the video
    // overflows horizontally and is centered — offsetX > 0, offsetY = 0.
    const containerRect = rect({ left: 0, top: 0, width: 300, height: 220 });
    const v = video(1920, 1080, containerRect);
    const frameEl = {
      getBoundingClientRect: () => rect({ left: 20, top: 10, width: 260, height: 200 }),
    } as unknown as HTMLElement;

    const crop = getFrameCropInVideoSpace(v, frameEl);

    // scale = 220/1080 ≈ 0.20370
    // renderedWidth = 1920*scale ≈ 391.11, offsetX = (391.11-300)/2 ≈ 45.56
    // x = (20 + 45.56) / scale ≈ 321.82
    expect(crop.x).toBeCloseTo(321.82, 1);
    expect(crop.y).toBeCloseTo(49.09, 1);
    expect(crop.width).toBeCloseTo(1276.36, 1);
    expect(crop.height).toBeCloseTo(981.82, 1);
  });

  it("falls back to the full frame when the container has no measured size (e.g. not yet laid out)", () => {
    const containerRect = rect({ width: 0, height: 0 });
    const v = video(1920, 1080, containerRect);
    const frameEl = {
      getBoundingClientRect: () => rect({ width: 260, height: 200 }),
    } as unknown as HTMLElement;

    const crop = getFrameCropInVideoSpace(v, frameEl);

    expect(crop).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });

  it("falls back to the full frame when the frame ref is not yet attached", () => {
    const containerRect = rect({ width: 300, height: 220 });
    const v = video(1920, 1080, containerRect);

    const crop = getFrameCropInVideoSpace(v, null);

    expect(crop).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });
});
