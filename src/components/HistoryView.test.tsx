import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { HistoryView } from "./HistoryView";
import { pb } from "../lib/pocketbase";

vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
    authStore: { model: { id: "user123" } },
  },
}));

const sampleScans = [
  {
    id: "scan1",
    productName: "Nutella",
    level: "très élevé",
    favorite: false,
    created: "2026-07-28 10:00:00",
  },
  {
    id: "scan2",
    productName: "Eau minérale",
    level: "faible",
    favorite: true,
    created: "2026-07-27 09:00:00",
  },
];

describe("HistoryView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists past scans with product name and level", async () => {
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      getFullList: vi.fn().mockResolvedValue(sampleScans),
    });

    render(<HistoryView />);

    expect(await screen.findByText("Nutella")).toBeInTheDocument();
    expect(screen.getByText("Eau minérale")).toBeInTheDocument();
    expect(screen.getByText(/très élevé/)).toBeInTheDocument();
  });

  it("shows scan detail when an entry is clicked", async () => {
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      getFullList: vi.fn().mockResolvedValue(sampleScans),
    });

    render(<HistoryView />);

    fireEvent.click(await screen.findByText("Nutella"));

    expect(await screen.findByText(/détail/i)).toBeInTheDocument();
  });

  it("toggles favorite status on a scan", async () => {
    const update = vi.fn().mockResolvedValue({});
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      getFullList: vi.fn().mockResolvedValue(sampleScans),
      update,
    });

    render(<HistoryView />);

    const favoriteButtons = await screen.findAllByRole("button", { name: /favori/i });
    fireEvent.click(favoriteButtons[0]);

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith("scan1", { favorite: true })
    );
  });
});
