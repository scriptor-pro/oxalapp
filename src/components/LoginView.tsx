import { useState, type FormEvent } from "react";
import { pb } from "../lib/pocketbase";
import { ForgotPasswordView } from "./ForgotPasswordView";

interface LoginViewProps {
  onAuthenticated: () => void;
}

export function LoginView({ onAuthenticated }: LoginViewProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await pb.collection("users").create({
          email,
          password,
          passwordConfirm: password,
        });
      }
      await pb.collection("users").authWithPassword(email, password);
      onAuthenticated();
    } catch (err) {
      console.error("Erreur d'authentification PocketBase:", err);
      setError("Identifiants incorrects ou erreur d'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "forgot-password") {
    return <ForgotPasswordView onBackToLogin={() => setMode("login")} />;
  }

  return (
    <div>
      <h1>oxalapp</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "signup" ? 8 : undefined}
        />
        {mode === "signup" && (
          <p style={{ color: password.length >= 8 ? "green" : undefined }}>
            {password.length >= 8 ? "✓ " : ""}Minimum 8 caractères.
          </p>
        )}

        {error && <p role="alert">{error}</p>}

        {mode === "login" ? (
          <button type="submit" disabled={isSubmitting}>
            Se connecter
          </button>
        ) : (
          <button type="submit" disabled={isSubmitting}>
            S'inscrire
          </button>
        )}
      </form>

      {mode === "login" ? (
        <button type="button" onClick={() => setMode("signup")} disabled={isSubmitting}>
          Créer un compte
        </button>
      ) : (
        <button type="button" onClick={() => setMode("login")} disabled={isSubmitting}>
          Retour à la connexion
        </button>
      )}

      {mode === "login" && (
        <button type="button" onClick={() => setMode("forgot-password")} disabled={isSubmitting}>
          Mot de passe oublié ?
        </button>
      )}
    </div>
  );
}
