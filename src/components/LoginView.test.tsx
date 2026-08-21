import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { LoginView } from "./LoginView";
import { pb } from "../lib/pocketbase";

vi.mock("../lib/pocketbase", () => ({
  pb: {
    collection: vi.fn(),
  },
}));

describe("LoginView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in an existing user and calls onAuthenticated", async () => {
    const authWithPassword = vi.fn().mockResolvedValue({});
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      authWithPassword,
    });
    const onAuthenticated = vi.fn();

    render(<LoginView onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalled());
    expect(authWithPassword).toHaveBeenCalledWith(
      "user@example.com",
      "password123"
    );
  });

  it("shows an error message when login fails", async () => {
    const authWithPassword = vi.fn().mockRejectedValue(new Error("invalid credentials"));
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      authWithPassword,
    });

    render(<LoginView onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(await screen.findByText(/identifiants incorrects/i)).toBeInTheDocument();
  });

  it("creates a new account and calls onAuthenticated", async () => {
    const create = vi.fn().mockResolvedValue({});
    const authWithPassword = vi.fn().mockResolvedValue({});
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create,
      authWithPassword,
    });
    const onAuthenticated = vi.fn();

    render(<LoginView onAuthenticated={onAuthenticated} />);

    fireEvent.click(screen.getByRole("button", { name: /créer un compte/i }));
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^s'inscrire$/i }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        password: "password123",
        passwordConfirm: "password123",
      })
    );
    expect(authWithPassword).toHaveBeenCalledWith("new@example.com", "password123");
  });

  it("shows a name field only in signup mode", () => {
    render(<LoginView onAuthenticated={vi.fn()} />);

    expect(screen.queryByLabelText(/nom/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /créer un compte/i }));

    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
  });

  it("creates a new account with the entered name", async () => {
    const create = vi.fn().mockResolvedValue({});
    const authWithPassword = vi.fn().mockResolvedValue({});
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue({
      create,
      authWithPassword,
    });

    render(<LoginView onAuthenticated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /créer un compte/i }));
    fireEvent.change(screen.getByLabelText(/nom/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^s'inscrire$/i }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Alice" })
      )
    );
  });

  it("shows the forgot-password link on the login screen", () => {
    render(<LoginView onAuthenticated={vi.fn()} />);
    expect(screen.getByRole("button", { name: /mot de passe oublié/i })).toBeInTheDocument();
  });

  it("switches to the forgot-password view and back", () => {
    render(<LoginView onAuthenticated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /mot de passe oublié/i }));
    expect(screen.getByRole("button", { name: /envoyer/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retour à la connexion/i }));
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });
});
