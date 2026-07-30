# Après le MVP

Fonctionnalités identifiées comme utiles mais volontairement laissées de
côté du MVP. À reprendre une fois le cœur de l'app (scan, estimation
oxalate, authentification de base) stabilisé.

## Vérification d'email à l'inscription

Actuellement, un compte créé via "S'inscrire" reste `verified: false` de
façon permanente dans PocketBase — rien dans l'app ne fait jamais passer
ce statut à `true`. La seule voie existante est une intervention manuelle
côté admin (édition directe de l'enregistrement dans `/_/`, ou appel API
authentifié en superuser).

Il faudrait implémenter le flux standard PocketBase :

1. Après `create()` (inscription), appeler
   `pb.collection("users").requestVerification(email)` pour déclencher
   l'envoi d'un email de confirmation.
2. Personnaliser le `verificationTemplate` de la collection `users` (comme
   déjà fait pour `resetPasswordTemplate`, cf.
   `pocketbase/pb_migrations/1785308077_updated_users.js`), avec un lien
   du type `{APP_URL}/?verify-token={TOKEN}`.
3. Ajouter une vue dédiée (type `VerifyEmailView`, sur le modèle de
   `ResetPasswordView`) qui lit le token dans l'URL et appelle
   `pb.collection("users").confirmVerification(token)`.
4. Router ce nouveau query param dans `App.tsx`, aux côtés de
   `reset-token`.
5. Décider du comportement produit tant que le compte n'est pas vérifié :
   accès bloqué/limité, bandeau de rappel, renvoi d'email, etc.

Voir `docs/superpowers/specs/2026-07-29-password-reset-design.md` pour le
pattern déjà utilisé sur le reset de mot de passe (architecture très
proche, réutilisable pour la vérification d'email).
