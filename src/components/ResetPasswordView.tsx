import { useState, type FormEvent } from "react";
import { pb } from "../lib/pocketbase";

interface ResetPasswordViewProps {
  token: string;
  onResetComplete: () => void;
  onRequestNewReset: () => void;
}

export function ResetPasswordView({
  token,
  onResetComplete,
  onRequestNewReset,
}: ResetPasswordViewProps) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTokenInvalid(false);

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await pb.collection("users").confirmPasswordReset(token, password, passwordConfirm);
      setSuccess(true);
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err);
      setTokenInvalid(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="screen-content login-form">
        <h1>oxalapp</h1>
        <p>Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.</p>
        <button type="button" className="text-button" onClick={onResetComplete}>
          Aller à la connexion
        </button>
      </div>
    );
  }

  if (tokenInvalid) {
    return (
      <div className="screen-content login-form">
        <h1>oxalapp</h1>
        <p>Ce lien invalide ou expiré ne peut plus être utilisé.</p>
        <button type="button" className="text-button" onClick={onRequestNewReset}>
          Redemander un lien
        </button>
      </div>
    );
  }

  return (
    <div className="screen-content login-form">
      <h1>oxalapp</h1>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="new-password" className="field-label">Nouveau mot de passe</label>
          <input
            id="new-password"
            type="password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="field">
          <label htmlFor="confirm-password" className="field-label">Confirmer le mot de passe</label>
          <input
            id="confirm-password"
            type="password"
            className="field-input"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <p className={password.length >= 8 ? "field-hint field-hint-valid" : "field-hint"}>
          {password.length >= 8 ? "✓ " : ""}Minimum 8 caractères.
        </p>

        {error && <p className="sync-error" role="alert">{error}</p>}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          Réinitialiser
        </button>
      </form>
    </div>
  );
}
