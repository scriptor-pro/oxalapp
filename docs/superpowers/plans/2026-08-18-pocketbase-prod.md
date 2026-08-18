# PocketBase Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, with the human partner executing every VPS-side step themselves in their own SSH session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre PocketBase accessible en HTTPS public (`https://oxa.bvh.fyi`) depuis n'importe où, pour que l'APK Android scanne des produits sans dépendre du réseau Wi-Fi local du laptop.

**Architecture:** PocketBase tourne en service systemd sur le VPS YunoHost existant, écoutant sur `127.0.0.1:8091` uniquement. L'app YunoHost "Reverse Proxy Oxalapp" (déjà installée, pointant vers ce port) l'expose en HTTPS sur `oxa.bvh.fyi`. Le SMTP pour l'email de reset de mot de passe utilise le Postfix déjà géré par YunoHost sur `127.0.0.1:587`. Côté client, une nouvelle variable d'environnement dédiée au build APK pointe vers l'URL publique, sans toucher au `.env.local` du dev quotidien.

**Tech Stack:** PocketBase `0.39.9` (binaire Go autonome), systemd, Postfix (déjà en place via YunoHost), Capacitor/Gradle (déjà en place depuis le plan APK).

**Spec:** `docs/superpowers/specs/2026-08-18-pocketbase-prod-design.md`

## Global Constraints

- Toutes les commandes destinées au VPS sont fournies par Claude et exécutées par l'utilisateur lui-même dans sa propre session SSH — Claude n'a pas d'accès SSH direct pour ce plan.
- Ne jamais lancer `sudo` directement — s'applique aussi aux commandes VPS. Toute commande nécessitant des privilèges (ex. `systemctl`, écriture dans `/etc/systemd/`) est fournie à l'utilisateur pour exécution manuelle.
- PocketBase doit écouter uniquement sur `127.0.0.1:8091` sur le VPS, jamais sur `0.0.0.0`.
- Architecture du VPS : x86_64 (confirmé par l'utilisateur).
- Version PocketBase : `0.39.9` (identique au dev local, pour cohérence).
- Base de données neuve sur le VPS — pas de migration de `pb_data` local. Le schéma est recréé via `pocketbase/pb_migrations/1735400000_scans_collection.js` et `pocketbase/pb_migrations/1785308077_updated_users.js` (déjà versionnées dans le repo).
- SMTP via Postfix local du VPS : `host: 127.0.0.1`, `port: 587` (jamais `25`, réservé au relais entre serveurs).
- `VITE_POCKETBASE_URL=https://oxa.bvh.fyi` utilisée uniquement au moment du build APK — le `.env.local` existant (dev web quotidien) reste inchangé.
- Domaine cible : `https://oxa.bvh.fyi` (reverse proxy déjà installé et confirmé actif, aucune action requise sur ce point).
- **Déviation par rapport au spec initial** : le spec prévoyait le port `8090` sur le VPS, mais l'exécution de Task 1 a révélé qu'un autre service PocketBase (`pocketbase.service`, actif depuis le 2026-06-17, probablement un autre projet de l'utilisateur, à ne surtout pas toucher) occupait déjà ce port sur le même VPS. Décision pendant l'exécution : PocketBase-oxalapp écoute sur `127.0.0.1:8091` à la place ; le champ "Emplacement de destination" de l'app YunoHost "Reverse Proxy Oxalapp" doit être mis à jour en conséquence (voir Task 2).

---

## File Structure

- **Aucun fichier du repo n'est modifié par les tâches 1 à 3** (mise en place VPS pure — binaire, service systemd, migrations copiées sur le serveur, pas dans le repo).
- **Créer** (repo) : `.env.production` — variable d'environnement dédiée au build APK, distincte de `.env.local`.
- **Modifier** (repo) : `.gitignore` — s'assurer que `.env.production` suit le même sort que `.env.local` (déjà ignoré via le pattern existant `*.local`? à vérifier — sinon ajouter explicitement).
- **Pas de nouveau fichier de migration** — le schéma existant suffit (contrainte du spec).

---

## Task 1: Déployer PocketBase en service systemd sur le VPS

**Files:**
- Aucun fichier du repo local touché — toutes les actions se déroulent sur le VPS, dans le répertoire `/home/<user>/pocketbase-oxalapp/` (ou équivalent choisi par l'utilisateur).

**Interfaces:**
- Produit : PocketBase actif en local sur le VPS, `127.0.0.1:8091`, démarré automatiquement au boot, avec le schéma des migrations déjà appliqué. Consommé par Task 2 (reverse proxy déjà en place, rien à faire dessus) et par Task 3 (config SMTP).

- [ ] **Step 1: Créer le répertoire de travail sur le VPS et télécharger le binaire PocketBase**

Commandes à exécuter dans la session SSH de l'utilisateur, sur le VPS :

```bash
mkdir -p ~/pocketbase-oxalapp
cd ~/pocketbase-oxalapp
curl -L -o pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v0.39.9/pocketbase_0.39.9_linux_amd64.zip
unzip pocketbase.zip
rm pocketbase.zip
chmod +x pocketbase
./pocketbase --version
```

Expected: la dernière commande affiche `pocketbase version 0.39.9`.

- [ ] **Step 2: Copier les migrations depuis le repo local vers le VPS**

Depuis le laptop de l'utilisateur (pas sur le VPS), dans un terminal local :

```bash
scp /home/Baudouin/Documents/Projets/oxalapp/pocketbase/pb_migrations/*.js <user>@<host-vps>:~/pocketbase-oxalapp/pb_migrations/
```

Remplacer `<user>@<host-vps>` par les identifiants SSH réels de l'utilisateur (le répertoire `pb_migrations/` sera créé automatiquement par `scp` s'il n'existe pas, sinon le créer d'abord avec `ssh <user>@<host-vps> mkdir -p ~/pocketbase-oxalapp/pb_migrations`).

Expected: `scp` copie les deux fichiers `1735400000_scans_collection.js` et `1785308077_updated_users.js` sans erreur.

- [ ] **Step 3: Vérifier la présence des migrations sur le VPS**

Sur le VPS, dans la session SSH :

```bash
ls ~/pocketbase-oxalapp/pb_migrations/
```

Expected: les deux fichiers `.js` sont listés.

- [ ] **Step 4: Premier démarrage manuel pour valider les migrations et créer le superuser**

Sur le VPS :

```bash
cd ~/pocketbase-oxalapp
./pocketbase serve --http=127.0.0.1:8091
```

Laisser tourner quelques secondes pour voir les logs de migration s'appliquer (chaque migration doit apparaître dans la sortie), puis interrompre avec `Ctrl+C`.

Expected: la sortie mentionne l'application des deux migrations (collections `users` mise à jour et `scans` créée), sans erreur.

- [ ] **Step 5: Créer le superuser de production**

Toujours sur le VPS, dans `~/pocketbase-oxalapp` :

```bash
./pocketbase superuser upsert admin@oxalapp.prod <mot-de-passe-fort-a-choisir>
```

Remplacer `<mot-de-passe-fort-a-choisir>` par un mot de passe fort et unique, distinct de celui utilisé en dev local. Noter ce mot de passe dans un gestionnaire de mots de passe personnel (ne pas le committer, ne pas le partager dans cette conversation).

Expected: message de confirmation de création/mise à jour du superuser.

- [ ] **Step 6: Créer le fichier de service systemd**

Sur le VPS, créer le fichier `/etc/systemd/system/pocketbase-oxalapp.service` avec ce contenu exact (remplacer `<user>` par le nom d'utilisateur réel sur le VPS) :

```ini
[Unit]
Description=PocketBase (oxalapp)
After=network.target

[Service]
Type=simple
User=<user>
WorkingDirectory=/home/<user>/pocketbase-oxalapp
ExecStart=/home/<user>/pocketbase-oxalapp/pocketbase serve --http=127.0.0.1:8091
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Commande pour créer ce fichier (nécessite les privilèges root — à exécuter par l'utilisateur lui-même, jamais par Claude) :

```bash
sudo nano /etc/systemd/system/pocketbase-oxalapp.service
```

(coller le contenu ci-dessus, ajuster `<user>`, sauvegarder avec `Ctrl+O` puis `Ctrl+X`)

- [ ] **Step 7: Activer et démarrer le service**

```bash
sudo systemctl daemon-reload
sudo systemctl enable pocketbase-oxalapp
sudo systemctl start pocketbase-oxalapp
sudo systemctl status pocketbase-oxalapp
```

Expected: `systemctl status` affiche `active (running)` en vert, sans erreur dans les dernières lignes de log.

- [ ] **Step 8: Vérifier que PocketBase répond en local sur le VPS**

```bash
curl -s http://127.0.0.1:8091/api/health
```

Expected: réponse JSON `{"code":200,"message":"API is healthy.",...}` (le format exact peut varier légèrement selon la version, mais le code doit être 200).

- [ ] **Step 9: Vérifier que PocketBase n'écoute PAS sur une interface publique**

```bash
ss -tlnp | grep 8091
```

Expected: la ligne affiche `127.0.0.1:8091`, jamais `0.0.0.0:8091` ni `[::]:8091`. Si `0.0.0.0` apparaît, corriger immédiatement la commande `ExecStart` du service (Step 6) pour forcer `--http=127.0.0.1:8091` et relancer `sudo systemctl restart pocketbase-oxalapp`.

Pas de commit pour cette tâche (aucun fichier du repo modifié).

---

## Task 2: Vérifier l'accès HTTPS public via le reverse proxy

**Files:**
- Aucun fichier modifié — tâche de vérification uniquement, le reverse proxy YunoHost est déjà installé et configuré en amont de ce plan.

**Interfaces:**
- Consomme : PocketBase actif sur `127.0.0.1:8091` (produit par Task 1).
- Produit : confirmation que `https://oxa.bvh.fyi` sert bien PocketBase — condition requise avant Task 4 (rebuild de l'APK).

- [ ] **Step 1: Mettre à jour le port dans l'app Reverse Proxy YunoHost**

Le champ "Emplacement de destination" de l'app "Reverse Proxy Oxalapp" a été configuré initialement avec `http://127.0.0.1:8090` (avant la découverte du conflit de port en Task 1). Dans l'admin YunoHost (interface web), aller dans `Applications > Reverse Proxy Oxalapp > Configurer`, et changer ce champ pour `http://127.0.0.1:8091`. Sauvegarder.

Expected: la configuration est acceptée sans erreur, l'app reste listée comme active.

- [ ] **Step 2: Tester l'accès public depuis le laptop**

Depuis un terminal du laptop de l'utilisateur (pas le VPS) :

```bash
curl -s https://oxa.bvh.fyi/api/health
```

Expected: même réponse JSON `{"code":200,...}` que le Step 8 de Task 1, cette fois obtenue via l'URL publique en HTTPS.

- [ ] **Step 3: Vérifier le certificat HTTPS**

```bash
curl -vI https://oxa.bvh.fyi/api/health 2>&1 | grep -iE "SSL certificate|subject:|issuer:"
```

Expected: le certificat mentionne `Let's Encrypt` comme émetteur (`issuer:`), et `oxa.bvh.fyi` comme sujet — pas d'avertissement de certificat auto-signé ou expiré.

Si le Step 2 ou 3 échoue : vérifier dans l'admin YunoHost que l'app "Reverse Proxy Oxalapp" est toujours active (`yunohost app list` sur le VPS), et que le champ "Emplacement de destination" pointe bien vers `http://127.0.0.1:8091` (pas un autre port).

Pas de commit pour cette tâche.

---

## Task 3: Configurer le SMTP et l'URL de l'app dans PocketBase

**Files:**
- Aucun fichier du repo modifié — configuration effectuée via l'interface admin web de PocketBase (`https://oxa.bvh.fyi/_/`), pas via fichier.

**Interfaces:**
- Consomme : PocketBase actif et accessible en HTTPS (produit par Task 1 et Task 2), superuser créé (Task 1 Step 5).
- Produit : email de reset de mot de passe fonctionnel en production — condition requise avant la vérification finale (Task 5).

- [ ] **Step 1: Se connecter à l'admin PocketBase**

Ouvrir `https://oxa.bvh.fyi/_/` dans un navigateur, se connecter avec le superuser créé au Step 5 de Task 1 (`admin@oxalapp.prod` et le mot de passe choisi).

Expected: accès au tableau de bord admin PocketBase, les collections `users` et `scans` sont visibles (confirmant que les migrations se sont bien appliquées).

- [ ] **Step 2: Déterminer le compte SMTP à utiliser**

Avant de configurer `settings.smtp`, décider avec l'utilisateur : utiliser un compte mail existant sur `bvh.fyi`, ou en créer un dédié (ex. `oxalapp@bvh.fyi`) via l'admin YunoHost (`Applications > Utilisateurs > Nouvel utilisateur`, ou `Emails` selon la version de l'interface). Cette décision n'est pas tranchée par le spec — à trancher à ce moment précis avec l'utilisateur avant de continuer.

- [ ] **Step 3: Configurer `settings.smtp` dans PocketBase**

Dans l'admin PocketBase (`https://oxa.bvh.fyi/_/`), aller dans `Settings > Mail settings` (ou équivalent selon la version de l'UI PocketBase 0.39.x), et renseigner :
- `SMTP enabled`: activé
- `Host`: `127.0.0.1`
- `Port`: `587`
- `Username`: l'adresse mail décidée au Step 2
- `Password`: le mot de passe du compte mail correspondant
- `Auth method`: laisser sur la valeur par défaut proposée par PocketBase (généralement PLAIN ou LOGIN)
- `TLS/StartTLS`: activer StartTLS si l'option est proposée (port 587 l'utilise typiquement)

Cliquer sur "Send test email" si l'interface le propose, en indiquant une adresse de test.

Expected: l'email de test est reçu (vérifier la boîte de réception de l'adresse de test utilisée).

- [ ] **Step 4: Configurer `settings.meta.appURL`**

Dans le même écran de réglages (`Settings > Application`), renseigner `App URL` avec la valeur `https://oxa.bvh.fyi` (valeur provisoire tant que le frontend n'est pas déployé publiquement, comme indiqué dans le spec — section "Hors scope").

Expected: le champ est sauvegardé sans erreur.

- [ ] **Step 5: Vérifier le lien généré dans l'email de reset**

Test manuel : depuis l'app en dev local ou via l'admin PocketBase, déclencher une demande de reset de mot de passe pour un compte de test, et vérifier que l'email reçu contient un lien de la forme `https://oxa.bvh.fyi/?reset-token=<token>`.

Expected: le lien pointe vers le bon domaine, pas vers `127.0.0.1` ni vers une valeur par défaut PocketBase.

Pas de commit pour cette tâche (configuration effectuée via interface web, aucun fichier versionné modifié).

---

## Task 4: Basculer l'app mobile vers l'URL de production et rebuilder l'APK

**Files:**
- Crée : `.env.production`
- Modifie : `.gitignore` (si `.env.production` n'est pas déjà couvert par un pattern existant)

**Interfaces:**
- Consomme : `https://oxa.bvh.fyi` fonctionnel et vérifié (Task 1, 2, 3).
- Produit : nouvel APK debug (`android/app/build/outputs/apk/debug/app-debug.apk`) pointant vers le backend de production — consommé par Task 5 (vérification finale).

- [ ] **Step 1: Vérifier si `.env.production` est déjà ignoré par git**

```bash
cd /home/Baudouin/Documents/Projets/oxalapp
git check-ignore -v .env.production
```

Si la commande affiche une ligne de correspondance (ex. `.gitignore:XX:*.local`), le fichier est déjà ignoré — passer au Step 3. Si la commande ne produit aucune sortie (code de sortie non nul), le fichier n'est pas ignoré — continuer au Step 2.

- [ ] **Step 2: Ajouter `.env.production` au `.gitignore` si nécessaire**

Si le Step 1 a montré que le fichier n'est pas ignoré, ajouter cette ligne à `.gitignore`, à la suite de la section "Project-specific" (après la ligne `.env.local`) :

```gitignore
.env.production
```

- [ ] **Step 3: Créer `.env.production`**

Créer le fichier `/home/Baudouin/Documents/Projets/oxalapp/.env.production` avec ce contenu exact :

```
VITE_POCKETBASE_URL=https://oxa.bvh.fyi
```

- [ ] **Step 4: Builder le frontend avec cette configuration**

```bash
cd /home/Baudouin/Documents/Projets/oxalapp
npx vite build --mode production
```

Note : Vite charge automatiquement `.env.production` quand `--mode production` est passé (comportement standard Vite, pas de configuration supplémentaire nécessaire dans `vite.config.ts`).

Expected: le build se termine sans erreur, `dist/` est régénéré.

- [ ] **Step 5: Vérifier que l'URL de production est bien intégrée au bundle**

```bash
grep -o "oxa.bvh.fyi" dist/assets/*.js | head -1
```

Expected: la chaîne `oxa.bvh.fyi` est trouvée dans un des fichiers JS générés, confirmant que l'URL a bien été injectée au build (pas `127.0.0.1`).

- [ ] **Step 6: Synchroniser avec le projet Android et rebuilder l'APK**

```bash
npx cap sync android
export ANDROID_HOME=/opt/android-sdk
export GRADLE_USER_HOME=/opt/gradle-cache
export JAVA_HOME=/home/Baudouin/.local/temurin21
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
cd android
./gradlew assembleDebug
cd ..
```

Note : `JAVA_HOME` pointe vers le JDK 21 portable installé lors du plan APK précédent (`/home/Baudouin/.local/temurin21/`), requis par `@capacitor/android`.

Expected: `BUILD SUCCESSFUL`, nouvel APK produit à `android/app/build/outputs/apk/debug/app-debug.apk` avec une date de modification récente.

- [ ] **Step 7: Commit**

```bash
git add .env.production .gitignore
git commit -m "Add production env config pointing the APK build at the public backend"
```

Note : si le Step 1/2 n'a rien changé au `.gitignore` (fichier déjà couvert par un pattern existant), ajuster la commande `git add` pour ne pas inclure `.gitignore`. Le fichier `.env.production` lui-même ne doit **jamais** être commité (il est destiné à être git-ignoré comme `.env.local` — vérifier que `git status` ne le liste pas comme fichier à committer avant de pousser quoi que ce soit).

---

## Task 5: Vérification finale de bout en bout

**Files:**
- Aucun fichier modifié — tâche de vérification manuelle sur l'appareil physique et en dev local.

**Interfaces:**
- Consomme : APK de production (Task 4), backend fonctionnel (Task 1-3).
- Produit : confirmation que l'objectif du plan est atteint — condition de sortie.

- [ ] **Step 1: Installer le nouvel APK sur le Moto G15**

```bash
export ANDROID_HOME=/opt/android-sdk
export PATH="$ANDROID_HOME/platform-tools:$PATH"
adb devices
```

Expected: le Moto G15 apparaît avec le statut `device` (le rebrancher et réautoriser le débogage USB si nécessaire, comme lors du plan APK précédent).

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Expected: `Success` (le flag `-r` réinstalle par-dessus l'APK existant sans désinstallation manuelle préalable).

- [ ] **Step 2: Scanner un produit depuis le téléphone**

Sur le Moto G15, ouvrir l'app oxalapp, scanner un produit (ou saisir un EAN manuellement).

Expected (à constater par l'utilisateur) : le résultat affiche un niveau réel (faible/modéré/élevé/très élevé), plus jamais "indéterminé", confirmant que la requête a bien atteint `https://oxa.bvh.fyi`.

- [ ] **Step 3: Tester le flux mot de passe oublié depuis le téléphone**

Sur le Moto G15 : demander un reset de mot de passe pour un compte de test, vérifier la réception réelle de l'email (pas Mailpit), cliquer sur le lien, changer le mot de passe.

Expected : email reçu dans une vraie boîte mail, changement de mot de passe abouti sans erreur.

- [ ] **Step 4: Vérifier la non-régression du dev local**

Sur le laptop :

```bash
cd /home/Baudouin/Documents/Projets/oxalapp
npm run dev -- --host
```

Ouvrir `https://localhost:5173/` (ou l'IP locale), se connecter, scanner un produit.

Expected : le dev web local continue de fonctionner normalement contre le PocketBase local du laptop (`127.0.0.1:8090`, distinct du VPS), sans interférence avec la config de production utilisée par l'APK.

- [ ] **Step 5: Documenter le résultat**

Si tout fonctionne : le plan est terminé, l'objectif ("scanner des produits depuis le mobile n'importe où") est atteint. Mettre à jour la mémoire du projet si pertinent (URL de prod, service systemd en place, superuser de prod créé).

Si un problème apparaît : revenir en mode debug systématique (`superpowers:systematic-debugging`) plutôt que d'itérer au hasard sur la config réseau ou SMTP.

Pas de commit pour cette tâche (vérification manuelle, aucun fichier modifié).
