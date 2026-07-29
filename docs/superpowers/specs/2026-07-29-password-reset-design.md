# oxalapp — Design mécanisme "mot de passe oublié"

Date : 2026-07-29

## Contexte

Le MVP oxalapp (`docs/superpowers/specs/2026-07-28-mvp-design.md`) a un
flux d'authentification minimal (`LoginView.tsx`) : email/mot de passe via
PocketBase, avec inscription et connexion, mais aucun moyen de récupérer
l'accès à un compte en cas de mot de passe oublié. Le seul utilisateur de
test existant a été créé manuellement depuis l'admin PocketBase, ce qui
n'est pas un flux viable pour de vrais utilisateurs.

## Objectif

Permettre à un utilisateur ayant oublié son mot de passe de le
réinitialiser lui-même, par email, sans intervention manuelle côté admin.

## Architecture

Le SDK PocketBase expose déjà les deux opérations nécessaires côté client
— aucun nouvel endpoint serveur à écrire :

- `pb.collection("users").requestPasswordReset(email)` — déclenche l'envoi
  d'un email contenant un lien avec un token de reset.
- `pb.collection("users").confirmPasswordReset(token, password,
  passwordConfirm)` — valide le token et fixe le nouveau mot de passe.

```
LoginView ("Mot de passe oublié ?")
  → ForgotPasswordView (saisie email)
    → pb.requestPasswordReset(email)
    → PocketBase envoie un email via SMTP → Mailpit (local)
        → lien : https://<host>/?reset-token=XXX

Chargement de l'app (App.tsx)
  → lit ?reset-token= dans l'URL
    → si présent : affiche ResetPasswordView (avant l'écran de login)
      → pb.confirmPasswordReset(token, password, passwordConfirm)
      → succès → redirige vers l'écran de login
```

Le travail porte donc sur : la configuration SMTP locale (Mailpit), la
personnalisation de l'URL de reset dans les settings PocketBase, et deux
nouveaux composants frontend + le routage minimal par query param dans
`App.tsx`.

## Environnement de dev : Mailpit

PocketBase doit pouvoir envoyer un email réel pour que le flux soit
testable de bout en bout. En local, on utilise **Mailpit** — un serveur
SMTP factice qui capture les emails sans les envoyer réellement,
consultables via une UI web.

- Binaire local `mailpit/mailpit` à la racine du projet (téléchargé une
  fois, même approche que le binaire `pocketbase/pocketbase` déjà présent
  dans le repo — non commité, `.gitignore` à compléter avec
  `mailpit/mailpit` par analogie avec l'entrée existante
  `pocketbase/pocketbase`).
- SMTP sur `127.0.0.1:1025`, UI de consultation sur `http://localhost:8025`.
- Config SMTP dans les settings PocketBase (`pb_data`, configurable via
  l'admin UI ou une migration) : host `127.0.0.1`, port `1025`, pas
  d'authentification, pas de TLS.
- Champ "reset password URL" des settings mail PocketBase pointé vers
  l'app plutôt que l'admin PocketBase par défaut :
  `https://<host>:5173/?reset-token={TOKEN}` (le host exact — localhost ou
  IP réseau — dépend de l'environnement de test, cf. section Tests).

Cette config est spécifique à l'environnement de dev. Une vraie config
SMTP (service tiers) sera nécessaire avant tout déploiement en
production — hors scope de ce document.

## Composants frontend

### `ForgotPasswordView.tsx` (nouveau)

Formulaire à un seul champ (email). Au submit :
- appelle `pb.collection("users").requestPasswordReset(email)`
- affiche toujours un message de confirmation générique ("si un compte
  existe avec cet email, un lien de réinitialisation a été envoyé"),
  que l'email corresponde ou non à un compte existant — évite de fuiter
  l'existence d'un compte à un email donné.
- un lien "Retour à la connexion" pour revenir à `LoginView`.

### `ResetPasswordView.tsx` (nouveau)

Formulaire nouveau mot de passe + confirmation (même contrainte minimum 8
caractères que le signup existant dans `LoginView.tsx`). Au submit :
- appelle `pb.collection("users").confirmPasswordReset(token, password,
  passwordConfirm)` avec le token reçu en prop (lu depuis l'URL par
  `App.tsx`).
- succès → message de confirmation puis retour à l'écran de login (sans le
  query param dans l'URL, via `history.replaceState` ou équivalent, pour
  éviter qu'un rechargement retente le même token déjà consommé).
- échec (token invalide/expiré) → message d'erreur explicite avec un lien
  pour redemander un nouveau reset (retour vers `ForgotPasswordView`).

### `LoginView.tsx` (modifié)

Ajoute un troisième mode `forgot-password` à l'état `mode` existant
(`"login" | "signup"` → `"login" | "signup" | "forgot-password"`), avec un
lien "Mot de passe oublié ?" affiché sous le formulaire uniquement en mode
`login`. Le rendu du mode `forgot-password` délègue à
`ForgotPasswordView`.

### `App.tsx` (modifié)

Au montage (une fois, via `useState` initializer ou `useEffect` avec tableau
de dépendances vide) :
```ts
const resetToken = new URLSearchParams(window.location.search).get("reset-token");
```
Si `resetToken` est non-null → affiche `ResetPasswordView` avant même de
vérifier `pb.authStore.isValid`. Ce cas est prioritaire sur l'état de
connexion existant : un utilisateur déjà connecté qui clique un lien de
reset (autre compte, autre onglet) doit quand même pouvoir réinitialiser.

Pas d'introduction de librairie de routing (react-router) — un seul query
param à lire au chargement suffit au besoin, cohérent avec l'absence de
routeur dans le reste de l'app.

## Gestion des erreurs

| Cas | Comportement |
|---|---|
| Email inconnu à la demande de reset | Message générique de succès (pas de fuite d'info) |
| Erreur réseau/serveur à la demande de reset | Message d'erreur explicite, possibilité de réessayer |
| Token invalide ou expiré à la confirmation | Message d'erreur explicite + lien pour redemander un reset |
| Mot de passe / confirmation non conformes (< 8 caractères, ne matchent pas) | Validation côté client avant submit, même pattern que le signup existant |

## Tests

- **Tests unitaires** (vitest + testing-library, cohérent avec
  `LoginView.test.tsx` existant) pour `ForgotPasswordView` et
  `ResetPasswordView` : soumission, affichage du message générique,
  gestion des erreurs (token invalide), validation du mot de passe.
- **Test manuel bout-en-bout** : demander un reset depuis l'app → vérifier
  la réception dans l'UI Mailpit (`localhost:8025`) → cliquer le lien →
  fixer un nouveau mot de passe → se reconnecter avec le nouveau mot de
  passe. À exécuter à la fois depuis le laptop (localhost) et, si
  pertinent, depuis le téléphone sur le réseau local (cf. configuration
  HTTPS/mkcert déjà en place pour les tests mobiles).

## Hors scope

- Configuration SMTP de production (service tiers réel) — à traiter avant
  déploiement.
- Expiration/politique de durée de vie des tokens — comportement par
  défaut de PocketBase conservé tel quel.
- Personnalisation du template d'email PocketBase (texte, mise en forme) —
  le template par défaut suffit pour le MVP.
