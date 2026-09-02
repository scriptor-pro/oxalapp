import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { FormEvent } from "react";
import { ManualIngredientsForm } from "./ManualIngredientsForm";

function renderForm(overrides: Partial<Parameters<typeof ManualIngredientsForm>[0]> = {}) {
  const props = {
    name: "",
    onNameChange: vi.fn(),
    ingredients: "",
    onIngredientsChange: vi.fn(),
    onSubmit: vi.fn((e: FormEvent) => e.preventDefault()),
    showOcrButton: false,
    onPhotoSelected: vi.fn(),
    ...overrides,
  };
  render(<ManualIngredientsForm {...props} />);
  return props;
}

describe("ManualIngredientsForm", () => {
  it("renders the name and ingredients fields with their current values", () => {
    renderForm({ name: "Nutella", ingredients: "cacao, sucre" });

    expect(screen.getByLabelText(/nom du produit/i)).toHaveValue("Nutella");
    expect(screen.getByLabelText(/ingrédients/i)).toHaveValue("cacao, sucre");
  });

  it("calls onNameChange when the name field changes", () => {
    const props = renderForm();

    fireEvent.change(screen.getByLabelText(/nom du produit/i), {
      target: { value: "Produit maison" },
    });

    expect(props.onNameChange).toHaveBeenCalledWith("Produit maison");
  });

  it("calls onIngredientsChange when the ingredients field changes", () => {
    const props = renderForm();

    fireEvent.change(screen.getByLabelText(/ingrédients/i), {
      target: { value: "épinards, sel" },
    });

    expect(props.onIngredientsChange).toHaveBeenCalledWith("épinards, sel");
  });

  it("calls onSubmit when the form is submitted", () => {
    const props = renderForm();

    fireEvent.click(screen.getByRole("button", { name: /valider/i }));

    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("hides the OCR photo button when showOcrButton is false", () => {
    renderForm({ showOcrButton: false });

    expect(
      screen.queryByText(/photographier pour remplir/i)
    ).not.toBeInTheDocument();
  });

  it("shows the OCR photo button and calls onPhotoSelected with the picked file when showOcrButton is true", () => {
    const props = renderForm({ showOcrButton: true });

    const fileInput = screen.getByLabelText(/photographier pour remplir/i);
    const file = new File(["fake-bytes"], "label.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(props.onPhotoSelected).toHaveBeenCalledWith(file);
  });
});
