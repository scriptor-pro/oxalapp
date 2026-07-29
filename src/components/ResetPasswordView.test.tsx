import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ResetPasswordView } from "./ResetPasswordView";
import { pb } from "../lib/pocketbase";

vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
  },
}));

describe("ResetPasswordView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms the password reset and calls onResetComplete", async () => {
    const confirmPasswordReset = vi.fn().mockResolvedValue(true);
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      confirmPasswordReset,
    });
    const onResetComplete = vi.fn();

    render(
      <ResetPasswordView
        token="abc123"
        onResetComplete={onResetComplete}
        onRequestNewReset={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/nouveau mot de passe/i), {
      target: { value: "newpassword1" },
    });
    fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
      target: { value: "newpassword1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));

    await waitFor(() =>
      expect(confirmPasswordReset).toHaveBeenCalledWith(
        "abc123",
        "newpassword1",
        "newpassword1"
      )
    );
    expect(await screen.findByText(/mot de passe réinitialisé/i)).toBeInTheDocument();
  });

  it("shows a client-side error when passwords do not match", () => {
    render(
      <ResetPasswordView
        token="abc123"
        onResetComplete={vi.fn()}
        onRequestNewReset={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/nouveau mot de passe/i), {
      target: { value: "newpassword1" },
    });
    fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
      target: { value: "different1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));

    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
    expect(pb.collection).not.toHaveBeenCalled();
  });

  it("shows an error with a link to request a new reset when the token is invalid", async () => {
    const confirmPasswordReset = vi.fn().mockRejectedValue(new Error("invalid token"));
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      confirmPasswordReset,
    });
    const onRequestNewReset = vi.fn();

    render(
      <ResetPasswordView
        token="expired-token"
        onResetComplete={vi.fn()}
        onRequestNewReset={onRequestNewReset}
      />
    );

    fireEvent.change(screen.getByLabelText(/nouveau mot de passe/i), {
      target: { value: "newpassword1" },
    });
    fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), {
      target: { value: "newpassword1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));

    expect(await screen.findByText(/lien invalide ou expiré/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /redemander/i }));
    expect(onRequestNewReset).toHaveBeenCalled();
  });
});
