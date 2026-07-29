# Mécanisme "mot de passe oublié" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un utilisateur d'oxalapp de réinitialiser son mot de passe lui-même par email, sans intervention admin.

**Architecture:** Deux nouveaux composants React (`ForgotPasswordView`, `ResetPasswordView`) s'appuyant sur `requestPasswordReset`/`confirmPasswordReset` du SDK PocketBase déjà en dépendance ; routage minimal par query param `?reset-token=` lu dans `App.tsx` ; Mailpit comme serveur SMTP local pour capturer les emails de reset en dev.

**Tech Stack:** React 19 + TypeScript, PocketBase SDK (`pocketbase` npm package, déjà en dépendance), Vitest + Testing Library (pattern déjà en place dans le repo), Mailpit (nouveau binaire local).

## Global Constraints

- Mot de passe : minimum 8 caractères, même contrainte que le signup existant (`LoginView.tsx:57`).
- Ne jamais révéler si un email correspond à un compte existant (message générique dans tous les cas pour `requestPasswordReset`).
- Pas de nouvelle dépendance de routing (pas de react-router) — un seul query param lu au chargement.
- Suivre le pattern de test existant : `vi.mock("../lib/pocketbase", ...)` avec `pb.collection` mocké en `vi.fn()`, cf. `src/components/LoginView.test.tsx`.
- Binaires locaux (pocketbase, mailpit) non commités — `.gitignore` déjà configuré pour `pocketbase/pocketbase`, à compléter pour `mailpit/mailpit`.

---

### Task 1: Mettre en place Mailpit en local

**Files:**
- Modify: `.gitignore`
- Create (non commité, générés à l'exécution) : `mailpit/mailpit`

**Interfaces:**
- Produces: un serveur SMTP local sur `127.0.0.1:1025`, UI web sur `http://localhost:8025`, utilisé par la config PocketBase de la Task 2.

- [ ] **Step 1: Ajouter `mailpit/mailpit` au `.gitignore`**

Ouvrir `.gitignore` et ajouter une ligne après `pocketbase/pocketbase` :

```gitignore
pocketbase/pocketbase
mailpit/mailpit
```

- [ ] **Step 2: Télécharger le binaire Mailpit**

Depuis la racine du projet (`/home/Baudouin/Documents/Projets/oxalapp/.claude/worktrees/oxalapp-mvp`) :

```bash
mkdir -p mailpit
curl -fsSL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh | sh -s -- --to mailpit
```

Si ce script d'installation échoue ou n'est pas disponible, télécharger manuellement le binaire correspondant à la plateforme (Linux x86_64) depuis la page des releases GitHub `axllent/mailpit`, l'extraire dans `mailpit/mailpit`, et le rendre exécutable :

```bash
chmod +x mailpit/mailpit
```

- [ ] **Step 3: Lancer Mailpit et vérifier qu'il répond**

```bash
./mailpit/mailpit --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025 &
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8025/
```

Expected: `200`

Arrêter le process de vérification (`kill %1` ou équivalent) — il sera relancé durablement par l'utilisateur au besoin, ce n'est pas un service à garder ouvert pendant le reste de l'implémentation.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "Add Mailpit to gitignore for local password reset testing"
```

---

### Task 2: Configurer PocketBase pour envoyer les emails via Mailpit

**Files:**
- Modify: settings PocketBase (via admin UI, persisté dans `pocketbase/pb_data/data.db` — non versionné, pas de fichier à éditer directement)

**Interfaces:**
- Consumes: Mailpit tournant sur `127.0.0.1:1025` (Task 1).
- Produces: PocketBase configuré pour envoyer un email réel (capturé par Mailpit) lors d'un appel à `requestPasswordReset`, avec un lien de reset pointant vers l'app plutôt que l'admin PocketBase.

- [ ] **Step 1: Démarrer PocketBase et Mailpit ensemble**

```bash
./mailpit/mailpit --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025 &
cd pocketbase && ./pocketbase serve &
cd ..
sleep 1
```

- [ ] **Step 2: Configurer le SMTP dans l'admin PocketBase**

Ouvrir `http://127.0.0.1:8090/_/` dans un navigateur, se connecter en admin, aller dans **Settings → Mail settings** :
- Activer "Send emails" / SMTP.
- Host : `127.0.0.1`
- Port : `1025`
- Pas d'authentification (laisser username/password vides)
- Pas de TLS/STARTTLS

- [ ] **Step 3: Configurer l'URL de reset pour pointer vers l'app**

Dans les mêmes Settings, section liée aux templates d'email ("Password reset" template ou équivalent "Confirm password reset URL" selon la version PocketBase), fixer l'URL vers :

```
https://localhost:5173/?reset-token={TOKEN}
```

Note : cette valeur devra être ajustée manuellement à `https://<IP réseau>:5173/?reset-token={TOKEN}` par l'utilisateur au moment de tester depuis le téléphone (cf. Task 6) — cf. spec, section Tests.

- [ ] **Step 4: Vérifier manuellement l'envoi**

Depuis la console du navigateur sur `http://127.0.0.1:8090/_/` ou via `curl`, déclencher une demande de reset pour un utilisateur existant (l'utilisateur de test créé précédemment) :

```bash
curl -sk -X POST https://localhost:5173/pb/api/collections/users/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"<email de test existant>"}'
```

Expected: réponse HTTP 204, et un nouvel email visible dans `http://localhost:8025/` contenant un lien avec `?reset-token=`.

Pas de commit pour cette tâche — c'est une configuration d'instance PocketBase (base SQLite locale non versionnée), pas un changement de code.

---

### Task 3: Composant `ForgotPasswordView`

**Files:**
- Create: `src/components/ForgotPasswordView.tsx`
- Test: `src/components/ForgotPasswordView.test.tsx`

**Interfaces:**
- Consumes: `pb` depuis `../lib/pocketbase` (`pb.collection("users").requestPasswordReset(email: string): Promise<boolean>`).
- Produces: composant `ForgotPasswordView({ onBackToLogin }: { onBackToLogin: () => void })`, utilisé par `LoginView` (Task 5).

- [ ] **Step 1: Écrire les tests (échouants)**

Créer `src/components/ForgotPasswordView.test.tsx` :

```tsx
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
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test -- ForgotPasswordView`
Expected: FAIL — `Cannot find module './ForgotPasswordView'` (ou équivalent, le fichier n'existe pas encore).

- [ ] **Step 3: Implémenter `ForgotPasswordView`**

Créer `src/components/ForgotPasswordView.tsx` :

```tsx
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
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test -- ForgotPasswordView`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ForgotPasswordView.tsx src/components/ForgotPasswordView.test.tsx
git commit -m "Add ForgotPasswordView component"
```

---

### Task 4: Composant `ResetPasswordView`

**Files:**
- Create: `src/components/ResetPasswordView.tsx`
- Test: `src/components/ResetPasswordView.test.tsx`

**Interfaces:**
- Consumes: `pb` depuis `../lib/pocketbase` (`pb.collection("users").confirmPasswordReset(token: string, password: string, passwordConfirm: string): Promise<boolean>`).
- Produces: composant `ResetPasswordView({ token, onResetComplete, onRequestNewReset }: { token: string; onResetComplete: () => void; onRequestNewReset: () => void })`, utilisé par `App.tsx` (Task 6).

- [ ] **Step 1: Écrire les tests (échouants)**

Créer `src/components/ResetPasswordView.test.tsx` :

```tsx
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
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test -- ResetPasswordView`
Expected: FAIL — `Cannot find module './ResetPasswordView'`

- [ ] **Step 3: Implémenter `ResetPasswordView`**

Créer `src/components/ResetPasswordView.tsx` :

```tsx
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
      onResetComplete();
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err);
      setTokenInvalid(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div>
        <h1>oxalapp</h1>
        <p>Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.</p>
      </div>
    );
  }

  if (tokenInvalid) {
    return (
      <div>
        <h1>oxalapp</h1>
        <p>Ce lien invalide ou expiré ne peut plus être utilisé.</p>
        <button type="button" onClick={onRequestNewReset}>
          Redemander un lien
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>oxalapp</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-password">Nouveau mot de passe</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <label htmlFor="confirm-password">Confirmer le mot de passe</label>
        <input
          id="confirm-password"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          minLength={8}
        />
        <p>Minimum 8 caractères.</p>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          Réinitialiser
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test -- ResetPasswordView`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ResetPasswordView.tsx src/components/ResetPasswordView.test.tsx
git commit -m "Add ResetPasswordView component"
```

---

### Task 5: Intégrer le lien "Mot de passe oublié ?" dans `LoginView`

**Files:**
- Modify: `src/components/LoginView.tsx`
- Modify: `src/components/LoginView.test.tsx`

**Interfaces:**
- Consumes: `ForgotPasswordView` depuis `./ForgotPasswordView` (Task 3, props `{ onBackToLogin: () => void }`).
- Produces: `LoginView` avec un troisième mode `"forgot-password"`, aucun changement de props externes (`onAuthenticated` inchangé).

- [ ] **Step 1: Écrire le test (échouant) pour le nouveau mode**

Ajouter à `src/components/LoginView.test.tsx`, à l'intérieur du bloc `describe("LoginView", ...)`, après le dernier test existant :

```tsx
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
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test -- LoginView`
Expected: FAIL — le bouton "mot de passe oublié" n'existe pas encore dans le rendu.

- [ ] **Step 3: Modifier `LoginView.tsx`**

Modifier `src/components/LoginView.tsx` :

```tsx
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
        {mode === "signup" && <p>Minimum 8 caractères.</p>}

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
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test -- LoginView`
Expected: PASS (tous les tests existants + les 2 nouveaux)

- [ ] **Step 5: Commit**

```bash
git add src/components/LoginView.tsx src/components/LoginView.test.tsx
git commit -m "Add forgot-password link to LoginView"
```

---

### Task 6: Router vers `ResetPasswordView` depuis `App.tsx` via query param

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `ResetPasswordView` depuis `./components/ResetPasswordView` (Task 4, props `{ token, onResetComplete, onRequestNewReset }`).
- Produces: comportement de `App` au chargement — priorité à l'écran de reset si `?reset-token=` est présent dans l'URL, quel que soit l'état d'authentification.

- [ ] **Step 1: Écrire les tests (échouants)**

Ajouter à `src/App.test.tsx`, à l'intérieur du bloc `describe("App", ...)`, après le dernier test existant :

```tsx
  it("shows the reset-password screen when a reset-token query param is present", () => {
    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/?reset-token=abc123");

    render(<App />);

    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();

    window.history.pushState({}, "", originalLocation);
  });

  it("shows the reset-password screen even when already authenticated", () => {
    (pb.authStore as unknown as { isValid: boolean }).isValid = true;
    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/?reset-token=abc123");

    render(<App />);

    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();

    window.history.pushState({}, "", originalLocation);
  });
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npm run test -- App.test`
Expected: FAIL — l'écran de reset n'est jamais affiché, `App` ignore encore le query param.

- [ ] **Step 3: Modifier `App.tsx`**

Modifier `src/App.tsx` :

```tsx
import { useEffect, useState } from "react";
import { pb } from "./lib/pocketbase";
import { LoginView } from "./components/LoginView";
import { ScannerView } from "./components/ScannerView";
import { ResultView } from "./components/ResultView";
import { HistoryView } from "./components/HistoryView";
import { ResetPasswordView } from "./components/ResetPasswordView";

type Tab = "scan" | "history";

export function App() {
  const [authed, setAuthed] = useState(pb.authStore.isValid);
  const [tab, setTab] = useState<Tab>("scan");
  const [scannedEan, setScannedEan] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("reset-token")
  );

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setAuthed(pb.authStore.isValid);
    });
  }, []);

  if (resetToken) {
    return (
      <ResetPasswordView
        token={resetToken}
        onResetComplete={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setResetToken(null);
        }}
        onRequestNewReset={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setResetToken(null);
          setAuthed(false);
        }}
      />
    );
  }

  if (!authed) {
    return <LoginView onAuthenticated={() => setAuthed(true)} />;
  }

  return (
    <div>
      <nav>
        <button onClick={() => { setTab("scan"); setScannedEan(null); }}>
          Scanner
        </button>
        <button onClick={() => setTab("history")}>Historique</button>
        <button onClick={() => pb.authStore.clear()}>Se déconnecter</button>
      </nav>

      {tab === "scan" &&
        (scannedEan ? (
          <ResultView ean={scannedEan} onBack={() => setScannedEan(null)} />
        ) : (
          <ScannerView onScanned={setScannedEan} />
        ))}

      {tab === "history" && <HistoryView />}
    </div>
  );
}
```

Note : `onRequestNewReset` force `authed` à `false` pour garantir l'affichage de `LoginView` (donc l'accès au lien "Mot de passe oublié ?") même si l'utilisateur était connecté au moment où il a cliqué sur un lien de reset expiré.

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npm run test -- App.test`
Expected: PASS (tous les tests existants + les 2 nouveaux)

- [ ] **Step 5: Lancer la suite complète de tests**

Run: `npm run test`
Expected: tous les tests passent (suite complète, tous fichiers confondus).

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "Route to ResetPasswordView via reset-token query param"
```

---

### Task 7: Vérification manuelle bout-en-bout

**Files:** aucun changement de code — vérification manuelle uniquement.

**Interfaces:**
- Consumes: l'ensemble des tâches précédentes (Mailpit + PocketBase configurés, `ForgotPasswordView`, `ResetPasswordView`, routage `App.tsx`).

- [ ] **Step 1: Lancer l'environnement complet**

```bash
./mailpit/mailpit --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025 &
cd pocketbase && ./pocketbase serve &
cd ..
npm run dev -- --host &
```

- [ ] **Step 2: Tester le flux depuis le laptop (localhost)**

1. Ouvrir `https://localhost:5173/`, cliquer "Mot de passe oublié ?".
2. Saisir l'email d'un utilisateur existant, cliquer "Envoyer".
3. Vérifier l'affichage du message générique de confirmation.
4. Ouvrir `http://localhost:8025/`, vérifier la réception de l'email et repérer le lien contenant `?reset-token=`.
5. Cliquer le lien (ou copier l'URL dans un nouvel onglet).
6. Vérifier que l'écran "nouveau mot de passe" s'affiche directement, sans passer par l'écran de login.
7. Saisir un nouveau mot de passe (≥ 8 caractères) et sa confirmation, valider.
8. Vérifier le message de succès, puis se reconnecter avec le nouveau mot de passe depuis l'écran de login.

Expected: succès à chaque étape, connexion finale réussie avec le nouveau mot de passe.

- [ ] **Step 3: Vérifier le cas d'erreur (token invalide)**

Réutiliser une URL de reset déjà consommée à l'étape précédente (le même lien, après un reset déjà effectué) et tenter de refaire un reset avec.

Expected: message "lien invalide ou expiré" affiché, avec un bouton "Redemander un lien" qui ramène vers le formulaire "Mot de passe oublié ?".

- [ ] **Step 4: Tester depuis le téléphone (réseau local)**

1. Ajuster temporairement dans l'admin PocketBase l'URL de reset (Task 2, Step 3) pour utiliser l'IP réseau du laptop plutôt que `localhost`, ex. `https://192.168.0.115:5173/?reset-token={TOKEN}`.
2. Répéter les étapes du Step 2 depuis Chrome sur le téléphone (cf. configuration HTTPS/mkcert déjà en place, root CA installé sur le téléphone).

Expected: même comportement que depuis le laptop, aucun avertissement de certificat (le certificat mkcert couvre déjà l'IP réseau utilisée).

Pas de commit pour cette tâche — vérification manuelle uniquement, aucun changement de code.
