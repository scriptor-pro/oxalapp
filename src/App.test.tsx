import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { App } from "./App";
import { pb } from "./lib/pocketbase";

vi.mock("./lib/pocketbase", () => ({
  pb: {
    authStore: { isValid: false, model: null, onChange: vi.fn(() => () => {}) },
    collection: vi.fn(),
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the login screen when the user is not authenticated", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("shows the scanner and history tabs when authenticated", () => {
    (pb.authStore as unknown as { isValid: boolean }).isValid = true;

    render(<App />);

    expect(screen.getByRole("button", { name: /historique/i })).toBeInTheDocument();
  });

  it("switches to the history tab when clicked", () => {
    (pb.authStore as unknown as { isValid: boolean }).isValid = true;
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      getFullList: vi.fn().mockResolvedValue([]),
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /historique/i }));

    expect(screen.getByRole("button", { name: /scanner/i })).toBeInTheDocument();
  });
});
