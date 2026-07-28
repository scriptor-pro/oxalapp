import { useState, FormEvent } from "react";
import { pb } from "../lib/pocketbase";

interface LoginViewProps {
  onAuthenticated: () => void;
}

export function LoginView({ onAuthenticated }: LoginViewProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
    } catch {
      setError("Identifiants incorrects ou erreur d'inscription.");
    }
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
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p role="alert">{error}</p>}

        {mode === "login" ? (
          <button type="submit">Se connecter</button>
        ) : (
          <button type="submit">S'inscrire</button>
        )}
      </form>

      {mode === "login" ? (
        <button type="button" onClick={() => setMode("signup")}>
          Créer un compte
        </button>
      ) : (
        <button type="button" onClick={() => setMode("login")}>
          Retour à la connexion
        </button>
      )}
    </div>
  );
}
