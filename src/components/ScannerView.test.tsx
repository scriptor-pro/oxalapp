import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ScannerView } from "./ScannerView";

const mockDecodeFromVideoDevice = vi.fn();
const mockReset = vi.fn();

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(function () {
    return {
      decodeFromVideoDevice: mockDecodeFromVideoDevice,
      reset: mockReset,
    };
  }),
}));

describe("ScannerView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onScanned with the detected EAN", async () => {
    const onScanned = vi.fn();
    mockDecodeFromVideoDevice.mockImplementation(
      async (_deviceId, _videoElement, callback) => {
        callback({ getText: () => "3017620422003" }, undefined);
      }
    );

    render(<ScannerView onScanned={onScanned} />);

    await waitFor(() => expect(onScanned).toHaveBeenCalledWith("3017620422003"));
  });

  it("shows a permission error message when the camera is unavailable", async () => {
    mockDecodeFromVideoDevice.mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError")
    );

    render(<ScannerView onScanned={vi.fn()} />);

    expect(
      await screen.findByText(/autorisation.*caméra/i)
    ).toBeInTheDocument();
  });

  it("calls onScanned with a manually entered 13-digit EAN", () => {
    const onScanned = vi.fn();
    mockDecodeFromVideoDevice.mockResolvedValue(undefined);

    render(<ScannerView onScanned={onScanned} />);

    fireEvent.change(screen.getByLabelText(/code-barres/i), {
      target: { value: "3017620422003" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(onScanned).toHaveBeenCalledWith("3017620422003");
  });

  it("rejects a manually entered code that is not exactly 13 digits", () => {
    const onScanned = vi.fn();
    mockDecodeFromVideoDevice.mockResolvedValue(undefined);

    render(<ScannerView onScanned={onScanned} />);

    fireEvent.change(screen.getByLabelText(/code-barres/i), {
      target: { value: "12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(onScanned).not.toHaveBeenCalled();
    expect(screen.getByText(/13 chiffres/i)).toBeInTheDocument();
  });
});
