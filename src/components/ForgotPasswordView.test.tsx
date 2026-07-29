import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ForgotPasswordView } from "./ForgotPasswordView";
import { pb } from "../lib/pocketbase";

vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
  },
}));

describe("ForgotPasswordView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a password reset and shows a generic confirmation message", async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue(true);
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      requestPasswordReset,
    });

    render(<ForgotPasswordView onBackToLogin={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer/i }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("user@example.com"));
    expect(
      await screen.findByText(/si un compte existe avec cet email/i)
    ).toBeInTheDocument();
  });

  it("shows the same generic confirmation message even when the request fails", async () => {
    const requestPasswordReset = vi.fn().mockRejectedValue(new Error("not found"));
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      requestPasswordReset,
    });

    render(<ForgotPasswordView onBackToLogin={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(
      await screen.findByText(/si un compte existe avec cet email/i)
    ).toBeInTheDocument();
  });

  it("calls onBackToLogin when the back link is clicked", () => {
    const onBackToLogin = vi.fn();
    render(<ForgotPasswordView onBackToLogin={onBackToLogin} />);

    fireEvent.click(screen.getByRole("button", { name: /retour à la connexion/i }));

    expect(onBackToLogin).toHaveBeenCalled();
  });
});
