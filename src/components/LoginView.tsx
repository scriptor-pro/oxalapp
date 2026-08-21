import { useState, type FormEvent } from "react";
import { pb } from "../lib/pocketbase";
import { ForgotPasswordView } from "./ForgotPasswordView";

interface LoginViewProps {
  onAuthenticated: () => void;
}

export function LoginView({ onAuthenticated }: LoginViewProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot-password">("login");
  const [name, setName] = useState("");
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
          name,
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
    <div className="screen-content login-form">
      <h1>oxalapp</h1>
      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="name" className="field-label">Nom</label>
            <input
              id="name"
              type="text"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={name.length > 0 ? 4 : undefined}
            />
            {name.length > 0 && (
              <p className={name.length >= 4 ? "field-hint field-hint-valid" : "field-hint"}>
                {name.length >= 4 ? "✓ " : ""}Minimum 4 caractères.
              </p>
            )}
          </div>
        )}

        <div className="field">
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password" className="field-label">Mot de passe</label>
          <input
            id="password"
            type="password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 8 : undefined}
          />
        </div>
        {mode === "signup" && (
          <p className={password.length >= 8 ? "field-hint field-hint-valid" : "field-hint"}>
            {password.length >= 8 ? "✓ " : ""}Minimum 8 caractères.
          </p>
        )}

        {error && <p className="sync-error" role="alert">{error}</p>}

        {mode === "login" ? (
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            Se connecter
          </button>
        ) : (
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            S'inscrire
          </button>
        )}
      </form>

      {mode === "login" ? (
        <button type="button" className="text-button" onClick={() => setMode("signup")} disabled={isSubmitting}>
          Créer un compte
        </button>
      ) : (
        <button type="button" className="text-button" onClick={() => setMode("login")} disabled={isSubmitting}>
          Retour à la connexion
        </button>
      )}

      {mode === "login" && (
        <button type="button" className="text-button" onClick={() => setMode("forgot-password")} disabled={isSubmitting}>
          Mot de passe oublié ?
        </button>
      )}
    </div>
  );
}
