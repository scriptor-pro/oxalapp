import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { LevelBadge } from "./LevelBadge";

describe("LevelBadge", () => {
  it("renders the level text for each level", () => {
    render(<LevelBadge level="faible" />);
    expect(screen.getByText("Faible")).toBeInTheDocument();
  });

  it("renders one crystal for faible", () => {
    render(<LevelBadge level="faible" />);
    expect(screen.getAllByTestId("crystal")).toHaveLength(1);
  });

  it("renders two crystals for modéré", () => {
    render(<LevelBadge level="modéré" />);
    expect(screen.getAllByTestId("crystal")).toHaveLength(2);
  });

  it("renders three crystals for élevé", () => {
    render(<LevelBadge level="élevé" />);
    expect(screen.getAllByTestId("crystal")).toHaveLength(3);
  });

  it("renders four crystals for très élevé", () => {
    render(<LevelBadge level="très élevé" />);
    expect(screen.getAllByTestId("crystal")).toHaveLength(4);
  });

  it("renders no crystals for non déterminable and still shows text", () => {
    render(<LevelBadge level="non déterminable" />);
    expect(screen.queryAllByTestId("crystal")).toHaveLength(0);
    expect(screen.getByText("Non déterminable")).toBeInTheDocument();
  });

  it("never conveys the level through color alone: text is always present alongside the badge", () => {
    render(<LevelBadge level="très élevé" />);
    const badge = screen.getByTestId("level-badge");
    expect(badge).toHaveTextContent("Très élevé");
  });
});
