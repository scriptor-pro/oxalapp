# oxalapp — Mot de passe oublié : passage en production

Date : 2026-07-29

## Contexte

Le mécanisme "mot de passe oublié" décrit dans
`docs/superpowers/specs/2026-07-29-password-reset-design.md` est conçu et
implémenté pour l'environnement de développement local : Mailpit comme
serveur SMTP factice, certificat HTTPS auto-signé (mkcert), PocketBase et
le frontend servis sur le même laptop. Ce document couvre ce qu'il faut
changer — et vérifier — avant d'exposer ce flux à de vrais utilisateurs,
en cohérence avec l'architecture prod déjà actée dans
`docs/superpowers/specs/2026-07-28-mvp-design.md` (frontend PWA sur
Vercel, PocketBase sur un petit VPS).

Aucun changement de code applicatif n'est nécessaire côté composants React
(`ForgotPasswordView`, `ResetPasswordView`) — le travail de mise en prod
porte sur la configuration d'infrastructure et sur des durcissements
ciblés autour du flux existant.

## 1. Envoi d'email réel (remplace Mailpit)

Mailpit capture les emails sans les envoyer — en prod, PocketBase doit
parler à un vrai service SMTP.

**Choix du service.** Pour le volume attendu d'oxalapp (usage personnel +
quelques proches, pas un SaaS à grande échelle), un service avec un palier
gratuit généreux suffit largement :

| Service | Palier gratuit | Remarque |
|---|---|---|
| **Resend** | 3 000 emails/mois, 100/jour | API moderne, bonne délivrabilité, recommandé si pas de contrainte existante |
| **Mailtrap (Sending)** | 1 000 emails/mois | Écosystème déjà connu si Mailtrap a servi de sandbox de test ailleurs |
| **Gmail SMTP (compte perso/asso)** | ~500/jour (limite Gmail) | À éviter en prod : pensé pour l'envoi humain, pas transactionnel — risque de blocage du compte, pas d'infrastructure de délivrabilité (SPF/DKIM dédiés) |
| **SMTP du VPS lui-même** | illimité mais... | Déconseillé : la plupart des VPS bloquent le port 25 sortant par défaut, et un serveur mail auto-hébergé sans réputation IP finit quasi systématiquement en spam |

Recommandation : **Resend**, configuré comme SMTP standard dans PocketBase
(host/port/identifiants fournis par Resend), pas besoin de leur SDK — le
SMTP générique de PocketBase suffit.

**Configuration PocketBase** (admin UI → Settings → Mail settings, ou via
l'API `PATCH /api/settings` comme fait en dev) :
- `smtp.enabled: true`
- `smtp.host`, `smtp.port`, `smtp.username`, `smtp.password` fournis par le
  service choisi
- `smtp.tls: true` (contrairement au dev où Mailpit tourne sans TLS en
  local)
- `meta.senderAddress` : une adresse sur un domaine que tu contrôles
  (ex. `noreply@oxalapp.<ton-domaine>`), pas une adresse `@example.com` ou
  personnelle — nécessaire pour la délivrabilité (SPF/DKIM, cf. section 2)

**Secrets.** Les identifiants SMTP ne doivent jamais être commités. Comme
PocketBase stocke sa config dans `pb_data/data.db` (SQLite, déjà exclu du
repo via `.gitignore`), la configuration via API/admin UI au moment du
déploiement est suffisante — pas de fichier `.env` supplémentaire à gérer
pour ce point précis, mais consigner les identifiants dans un gestionnaire
de secrets (pas dans un fichier texte sur le VPS).

## 2. Domaine, DNS et délivrabilité

Un email transactionnel (reset de mot de passe) qui atterrit en spam rend
le flux inutilisable. Trois enregistrements DNS sont nécessaires sur le
domaine utilisé pour `senderAddress` :

- **SPF** — autorise le service SMTP choisi à envoyer au nom du domaine.
- **DKIM** — signature cryptographique, fournie par le service SMTP
  (Resend génère les clés à ajouter en DNS).
- **DMARC** — politique de traitement des emails qui échouent SPF/DKIM.

La plupart des services (Resend inclus) affichent un statut de
vérification de domaine dans leur dashboard une fois les enregistrements
DNS propagés — vérifier ce statut "vert" avant de considérer l'envoi prod
opérationnel, pas seulement "le mail est parti sans erreur HTTP".

## 3. URL de reset : domaine réel au lieu de `localhost`

En dev, `settings.meta.appURL` pointe vers `https://localhost:5173` et le
`resetPasswordTemplate` de la collection `users` génère un lien
`{APP_URL}/?reset-token={TOKEN}`. En prod, deux changements :

- `settings.meta.appURL` → l'URL Vercel réelle du frontend (domaine custom
  si configuré, sinon le domaine `*.vercel.app`).
- Le `resetPasswordTemplate.body` n'a pas besoin de changer (il utilise
  déjà `{APP_URL}` dynamiquement) — vérifier simplement qu'il pointe
  toujours vers `/?reset-token={TOKEN}` sur le nouveau domaine et pas resté
  sur le lien admin PocketBase par défaut.

Point de vigilance CORS : PocketBase doit autoriser le domaine Vercel en
origine (`settings.origins`, actuellement `["*"]` par défaut côté
PocketBase — à restreindre au domaine réel du frontend en prod plutôt que
de garder le wildcard, cf. section 5).

## 4. Expiration et durée de vie des tokens

Le MVP dev garde le comportement par défaut de PocketBase sans l'avoir
vérifié explicitement. À valider avant prod :

- PocketBase expire les tokens de reset via la durée de vie du token JWT
  généré (`type: "passwordReset"`, visible en décodant le JWT — cf. test
  manuel déjà fait en dev où le payload contenait un champ `exp`). La
  valeur par défaut PocketBase est de quelques heures ; à vérifier dans la
  version de PocketBase déployée (`_authOrigins`/token duration settings
  dans l'admin UI, section liée à l'auth de la collection `users`) et
  ajuster si nécessaire — une fenêtre de 1 à 24h est un choix standard
  pour ce type de flux.
- Confirmer qu'un token déjà utilisé ne peut pas être rejoué : PocketBase
  invalide normalement le mot de passe précédent (donc toute session
  active ailleurs est déconnectée) — comportement à vérifier une fois en
  environnement prod-like, pas supposé.

## 5. Rate limiting et anti-énumération

Le flux `requestPasswordReset` affiche déjà un message générique côté
frontend (ne révèle pas si l'email existe), mais ça ne protège pas contre
l'abus au niveau serveur :

- **Rate limiting** : PocketBase expose un système de règles de limite de
  débit (`settings.rateLimits`, vu dans la config actuelle — présent mais
  `enabled: false` par défaut). En prod, l'activer avec une règle sur
  `*:auth` (déjà présente par défaut : 2 requêtes / 3 secondes) qui couvre
  aussi l'endpoint de reset — vérifier que la règle englobe bien
  `request-password-reset`, sinon ajouter une règle dédiée du type
  `/api/collections/users/request-password-reset` avec une limite plus
  stricte (ex. 3 requêtes / 10 minutes par IP) pour empêcher le spam
  d'emails vers une victime ou le brute-force d'énumération d'emails par
  timing.
- **CORS `origins`** : restreindre `settings.origins` (actuellement `*`)
  au domaine Vercel de prod, pour empêcher un site tiers d'appeler l'API
  PocketBase depuis le navigateur d'un visiteur.

## 6. HTTPS réel (remplace mkcert)

Le certificat mkcert n'a de sens qu'en dev local (CA de confiance
installée manuellement sur les appareils de test). En prod :

- **Frontend (Vercel)** : HTTPS géré automatiquement par Vercel, rien à
  faire.
- **PocketBase (VPS)** : certificat Let's Encrypt, via le flag natif
  `--https` de PocketBase avec un nom de domaine réel (contrairement au
  dev où seul `--http` était utilisable faute de domaine public), ou via
  un reverse-proxy déjà en place sur le VPS (nginx/Caddy) si l'existant du
  VPS en a un — à vérifier selon la configuration réelle du VPS au moment
  du déploiement, cf. `docs/superpowers/specs/2026-07-28-mvp-design.md`
  qui mentionne le VPS sans détailler sa configuration réseau actuelle.

## 7. Template d'email : personnalisation

Le template FR configuré en dev (sujet + corps HTML basique, cf. Task 2 du
plan d'implémentation) est fonctionnel mais minimal. Avant prod, à
minima :

- Vérifier le rendu sur un vrai client mail (Gmail, Outlook, Apple Mail) —
  le HTML actuel est simple donc peu de risque, mais un test visuel réel
  reste nécessaire (contrairement au dev où seul le rendu Mailpit a été
  vérifié).
- Ajouter une mention de contact/support en bas d'email (adresse à
  laquelle répondre en cas de problème), absente du template actuel.
- Optionnel : remplacer le HTML basique par un template avec le branding
  oxalapp (logo, couleurs) si l'app a atteint ce stade de polish — pas un
  bloqueur pour un premier déploiement prod à usage restreint (proches
  patients), qui peut tolérer un email simple.

## Checklist de bascule dev → prod

- [ ] Compte Resend (ou équivalent) créé, domaine vérifié (SPF/DKIM/DMARC verts)
- [ ] `settings.smtp` PocketBase pointé vers le service choisi, `tls: true`
- [ ] `settings.meta.appURL` et `settings.meta.senderAddress` mis à jour vers le domaine réel
- [ ] `settings.origins` restreint au domaine Vercel de prod (retrait du `*`)
- [ ] `settings.rateLimits.enabled: true`, règle couvrant `request-password-reset` vérifiée
- [ ] Durée de vie des tokens de reset vérifiée et jugée acceptable
- [ ] PocketBase servi en HTTPS réel (Let's Encrypt ou reverse-proxy du VPS)
- [ ] Template d'email relu sur un vrai client mail, mention de contact ajoutée
- [ ] Test manuel bout-en-bout complet en environnement prod (pas seulement dev) avant annonce aux utilisateurs

## Hors scope de ce document

- Authentification multi-facteurs / passkeys — évolution possible du
  système d'auth global, indépendante du flux de reset lui-même.
- Notification de sécurité à l'utilisateur en cas de changement de mot de
  passe (email "votre mot de passe a été modifié") — amélioration future,
  pas un bloqueur pour le lancement.
