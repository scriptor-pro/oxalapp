# Connexion PocketBase depuis le mobile (déploiement en production)

Date : 2026-08-18

## Contexte / problème

L'APK Android (Capacitor) produit précédemment (voir
`docs/superpowers/specs/2026-08-18-android-apk-design.md`) se lance et
scanne correctement sur le Moto G15, mais retourne systématiquement
« niveau d'oxalate indéterminé » : `VITE_POCKETBASE_URL` pointe vers
`127.0.0.1:8090` (ou l'IP locale du laptop via le proxy Vite dev), que la
WebView du téléphone ne peut pas atteindre en dehors du réseau Wi-Fi du
laptop — et même sur ce réseau, seulement quand le laptop tourne.

L'utilisateur veut pouvoir scanner des produits avec le téléphone
n'importe où (pas seulement sur son réseau Wi-Fi domestique), ce qui
nécessite d'héberger PocketBase publiquement, en HTTPS.

## Décision : VPS YunoHost existant, app "Reverse Proxy"

L'utilisateur dispose déjà d'un VPS sous YunoHost (domaine `bvh.fyi`,
plusieurs apps déjà hébergées dessus). Plutôt que provisionner une
nouvelle infra (VPS dédié, PaaS géré type Fly.io/Railway/Render — tous
évalués et écartés en amont, coût équivalent à un VPS sans le contrôle,
ou risque de conflit port 80/443 avec le nginx déjà géré par YunoHost si
on installait un serveur web indépendant type Caddy), on réutilise cette
infra.

YunoHost fournit une app officielle du catalogue, **"Reverse Proxy"**
(`reverseproxy_ynh`), conçue exactement pour exposer un service tournant
sur un socket/port local sous un sous-domaine HTTPS géré automatiquement
par le système de certificats YunoHost — sans toucher à la configuration
nginx à la main, sans risque de conflit de port avec l'infra existante.

**Déjà fait, en amont de ce spec** : l'app "Reverse Proxy Oxalapp" est
installée sur le domaine `oxa.bvh.fyi`, chemin `/`, pointant vers
`http://127.0.0.1:8090`. Confirmé actif via `yunohost app list`
(entrée `reverseproxy`, `domain_path: oxa.bvh.fyi/`).

## Ce qu'il reste à faire

PocketBase lui-même ne tourne pas encore sur le VPS — seulement en local
sur le laptop de l'utilisateur. Le reverse proxy pointe vers un port où
rien n'écoute pour l'instant.

## Contraintes

- Accès SSH au VPS déjà fonctionnel côté utilisateur. Commandes fournies
  par Claude, exécutées par l'utilisateur lui-même dans sa session SSH
  (pas d'accès SSH direct donné à Claude pour cette tâche).
- Ne jamais lancer `sudo` directement (règle mémorisée) — s'applique
  aussi bien au laptop qu'aux commandes destinées au VPS : toute commande
  nécessitant des privilèges est fournie à l'utilisateur pour exécution
  manuelle.
- PocketBase doit écouter uniquement sur `127.0.0.1:8090` sur le VPS,
  jamais sur `0.0.0.0` — seul nginx (géré par YunoHost) doit y accéder
  directement, jamais exposé brut sur Internet.
- Base de données neuve sur le VPS (pas de migration de `pb_data` local) :
  la base locale actuelle ne contient qu'un superuser jetable recréé
  après une perte accidentelle (cf. mémoire du projet), aucune donnée
  utilisateur réelle à préserver. Migrer apporterait un risque technique
  (copie d'un fichier SQLite potentiellement incohérent) et une question
  d'hygiène (promouvoir un compte de dev en prod) sans bénéfice.
- Le schéma (collections, règles d'accès, templates d'email) est recréé
  via les migrations déjà versionnées dans `pocketbase/pb_migrations/`
  — aucune nouvelle migration nécessaire pour ce spec.

## Design

### 1. PocketBase sur le VPS

- Téléchargement du binaire PocketBase `0.39.9` (même version qu'en
  local, pour cohérence) directement sur le VPS via SSH.
- Exécution en **service systemd** (démarrage automatique au boot,
  redémarrage automatique en cas de crash) — pas un `./pocketbase serve`
  lancé à la main dans un terminal, qui s'arrêterait à la déconnexion
  SSH.
- Commande d'écoute : `./pocketbase serve --http=127.0.0.1:8090`
  (explicite sur l'interface locale, jamais `0.0.0.0`).
- `pocketbase/pb_migrations/` (déjà dans git) copié sur le VPS dans le
  même répertoire que le binaire ; PocketBase les rejoue automatiquement
  au premier démarrage, recréant tout le schéma sans avoir besoin de
  transférer `pb_data`.
- Nouveau superuser créé directement sur le VPS via
  `./pocketbase superuser upsert <email> <mot-de-passe-fort>` — mot de
  passe dédié à cet environnement, distinct de celui du dev local.

### 2. Reverse proxy (déjà en place)

Aucune action requise — l'app "Reverse Proxy Oxalapp" pointant vers
`http://127.0.0.1:8090` sur `oxa.bvh.fyi/` est déjà installée et
confirmée active. Une fois PocketBase démarré à l'étape 1, il devient
immédiatement joignable en HTTPS sur `https://oxa.bvh.fyi`.

### 3. SMTP pour l'email de reset de mot de passe

- Le VPS fait déjà tourner Postfix (confirmé : `ss -tlnp` montre une
  écoute sur `:25` et `:587`, `0.0.0.0` et `[::]`) — géré nativement par
  YunoHost pour le(s) domaine(s) `bvh.fyi`, aucune app SMTP séparée à
  installer.
- `settings.smtp` de PocketBase configuré avec `host: 127.0.0.1`,
  `port: 587` (port de soumission, pas `25` qui est réservé au relais
  entre serveurs).
- Le port `587` nécessite très probablement une authentification — au
  moment de la configuration, déterminer avec l'utilisateur s'il utilise
  un compte mail existant sur `bvh.fyi` ou s'il faut en créer un dédié
  (ex. `oxalapp@bvh.fyi`) via l'admin YunoHost. Non tranché dans ce
  spec, à décider lors de l'implémentation de cette étape précise.
- `resetPasswordTemplate` de la collection `users` est déjà personnalisé
  et versionné dans une migration existante
  (`pocketbase/pb_migrations/1785308077_updated_users.js`) — se
  réapplique automatiquement avec les autres migrations, aucun travail
  supplémentaire requis sur ce point.
- `settings.meta.appURL` à définir sur l'URL publique du frontend une
  fois celle-ci connue (le frontend web n'est pas encore déployé
  publiquement à ce stade — seul le backend PocketBase l'est par ce
  spec ; si le frontend reste non déployé, cette valeur peut rester
  provisoire, à revisiter quand le frontend sera lui-même hébergé
  publiquement).

### 4. Config réseau côté app (client)

- Nouvelle valeur `VITE_POCKETBASE_URL=https://oxa.bvh.fyi` utilisée
  **uniquement au moment du `npm run build`** qui produit le bundle
  embarqué dans l'APK Capacitor — l'URL est figée au build, pas
  résolue au runtime (`webDir: dist` est un bundle statique).
- Le `.env.local` existant du laptop (pointant vers l'IP locale du
  réseau Wi-Fi domestique, utilisé pour le dev web quotidien avec le
  proxy Vite) reste inchangé et continue de servir au développement
  courant. Une variable d'environnement distincte (ex. fichier
  `.env.production` ou variable passée explicitement à la commande de
  build) est utilisée spécifiquement pour produire l'APK, afin de ne
  jamais confondre les deux contextes.
- **Aucune modification du manifeste Android nécessaire** : la
  permission `INTERNET` est déjà présente
  (`android/app/src/main/AndroidManifest.xml`), et comme le backend est
  servi avec un vrai certificat Let's Encrypt (pas auto-signé), le point
  de vigilance anticipé dans le spec de l'APK initial (config réseau
  Android pour faire confiance à un certificat auto-signé, ou autoriser
  le cleartext HTTP) ne s'applique plus.

### 5. Vérification

- `npm run build` avec `VITE_POCKETBASE_URL=https://oxa.bvh.fyi`, puis
  `npx cap sync android`, puis `./gradlew assembleDebug` → nouvel APK.
- Réinstallation sur le Moto G15 (`adb install`, comme pour le premier
  APK).
- Scan d'un produit depuis le téléphone → vérifier que le résultat
  n'est plus « indéterminé » mais reflète une vraie requête aboutie
  vers `https://oxa.bvh.fyi`.
- Test du flux « mot de passe oublié » de bout en bout depuis le
  téléphone : demande de reset → email réellement reçu (pas capturé par
  Mailpit, qui reste local/dev uniquement) → clic sur le lien → mot de
  passe changé avec succès.
- Vérifier que l'app web en dev local (`npm run dev`, `.env.local`
  inchangé) continue de fonctionner normalement contre le PocketBase
  local — les deux environnements (dev local, APK pointant vers le VPS)
  doivent pouvoir coexister sans interférence.

## Hors scope

- Déploiement public du frontend web lui-même (actuellement seul le
  backend PocketBase est exposé publiquement par ce spec ; le frontend
  reste testé en dev local ou packagé en APK).
- Migration de `pb_data` local vers le VPS (tranché : base neuve, voir
  Contraintes).
- Sauvegardes automatisées de `pb_data` sur le VPS (à considérer dans un
  futur chantier, une fois le service en place).
- Vérification d'email à l'inscription (déjà identifiée séparément dans
  `docs/après-le-MVP.md`, architecture proche du reset de mot de passe
  mais non traitée ici).
