import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { FoodSearchView } from "./FoodSearchView";
import { pb } from "../lib/pocketbase";

vi.mock("../lib/pocketbase", () => ({
  pb: {
    authStore: { record: { id: "user1" } },
    collection: vi.fn(),
  },
}));

describe("FoodSearchView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create: vi.fn().mockResolvedValue({}),
    });
  });

  it("shows the level badge for a food matched via a single known ingredient", () => {
    render(<FoodSearchView />);

    fireEvent.change(screen.getByLabelText(/nom de l'aliment/i), {
      target: { value: "épinard" },
    });
    fireEvent.click(screen.getByRole("button", { name: /chercher/i }));

    expect(screen.getByText(/très élevé/i)).toBeInTheDocument();
  });

  it("shows every matching preparation when the food has several", () => {
    render(<FoodSearchView />);

    fireEvent.change(screen.getByLabelText(/nom de l'aliment/i), {
      target: { value: "pomme de terre" },
    });
    fireEvent.click(screen.getByRole("button", { name: /chercher/i }));

    expect(screen.getByText("Potato, White, deep fried")).toBeInTheDocument();
    expect(
      screen.getByText("Potato, White/Russet, boiled, with/without skin")
    ).toBeInTheDocument();
  });

  it("shows non déterminable when nothing matches", () => {
    render(<FoodSearchView />);

    fireEvent.change(screen.getByLabelText(/nom de l'aliment/i), {
      target: { value: "zorblax" },
    });
    fireEvent.click(screen.getByRole("button", { name: /chercher/i }));

    expect(screen.getByText(/non déterminable/i)).toBeInTheDocument();
  });

  it("saves the search to history with source saisie_manuelle", async () => {
    const create = vi.fn().mockResolvedValue({});
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({ create });

    render(<FoodSearchView />);

    fireEvent.change(screen.getByLabelText(/nom de l'aliment/i), {
      target: { value: "épinard" },
    });
    fireEvent.click(screen.getByRole("button", { name: /chercher/i }));

    await screen.findByText(/très élevé/i);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "user1",
        productName: "épinard",
        level: "très élevé",
        source: "saisie_manuelle",
      })
    );
  });
});
