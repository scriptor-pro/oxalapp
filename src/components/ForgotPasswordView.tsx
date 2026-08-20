import { useState, type FormEvent } from "react";
import { pb } from "../lib/pocketbase";

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordView({ onBackToLogin }: ForgotPasswordViewProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await pb.collection("users").requestPasswordReset(email);
    } catch (err) {
      console.error("Erreur lors de la demande de réinitialisation:", err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="screen-content login-form">
        <h1>oxalapp</h1>
        <p>Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.</p>
        <button type="button" className="text-button" onClick={onBackToLogin}>
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="screen-content login-form">
      <h1>oxalapp</h1>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="forgot-email" className="field-label">Email</label>
          <input
            id="forgot-email"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          Envoyer
        </button>
      </form>
      <button type="button" className="text-button" onClick={onBackToLogin}>
        Retour à la connexion
      </button>
    </div>
  );
}
