import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ScannerView } from "./ScannerView";

const mockScanImageData = vi.fn();

vi.mock("../lib/barcode-scanner", () => ({
  scanImageData: (...args: unknown[]) => mockScanImageData(...args),
}));

function fakeStream() {
  const track = {
    getCapabilities: () => ({}),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  };
  return {
    getVideoTracks: () => [track],
    getTracks: () => [track],
  } as unknown as MediaStream;
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;

describe("ScannerView", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
      getImageData: () => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      }),
    })) as unknown as typeof originalGetContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("shows a detected confirmation before calling onScanned", async () => {
    const onScanned = vi.fn();
    mockScanImageData.mockResolvedValue("3017620422003");

    render(<ScannerView onScanned={onScanned} />);

    expect(
      await screen.findByText(/code-barres correctement détecté/i)
    ).toBeInTheDocument();
    expect(onScanned).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(onScanned).toHaveBeenCalledWith("3017620422003")
    );
  });

  it("shows a permission error message when the camera is unavailable", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError")
    );
    render(<ScannerView onScanned={vi.fn()} />);

    expect(
      await screen.findByText(/autorisation.*caméra/i)
    ).toBeInTheDocument();
  });

  it("calls onScanned with a manually entered 13-digit EAN", () => {
    const onScanned = vi.fn();
    mockScanImageData.mockResolvedValue(null);

    render(<ScannerView onScanned={onScanned} />);

    fireEvent.change(screen.getByLabelText(/code-barres/i), {
      target: { value: "3017620422003" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(onScanned).toHaveBeenCalledWith("3017620422003");
  });

  it("rejects a manually entered code that is not exactly 13 digits", () => {
    const onScanned = vi.fn();
    mockScanImageData.mockResolvedValue(null);

    render(<ScannerView onScanned={onScanned} />);

    fireEvent.change(screen.getByLabelText(/code-barres/i), {
      target: { value: "12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(onScanned).not.toHaveBeenCalled();
    expect(screen.getByText(/13 chiffres/i)).toBeInTheDocument();
  });
});
