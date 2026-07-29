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
      <div>
        <h1>oxalapp</h1>
        <p>Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.</p>
        <button type="button" onClick={onBackToLogin}>
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>oxalapp</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="forgot-email">Email</label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          Envoyer
        </button>
      </form>
      <button type="button" onClick={onBackToLogin}>
        Retour à la connexion
      </button>
    </div>
  );
}
