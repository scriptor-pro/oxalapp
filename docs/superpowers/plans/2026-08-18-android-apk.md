# APK Android (Capacitor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produire un fichier `.apk` debug qui se lance et affiche l'UI d'oxalapp sur le Moto G15, en enveloppant le build Vite existant avec Capacitor.

**Architecture:** Installation d'un SDK Android minimal (command-line tools) hors de `/home` (partition saturée), puis ajout de Capacitor au projet Vite/React existant pour générer un projet Gradle natif (`android/`) qui embarque le build web dans une WebView. Build via `./gradlew assembleDebug`, installation via `adb`.

**Tech Stack:** Capacitor 6/7 (dernière version stable), Android SDK command-line tools, Gradle (wrapper fourni par Capacitor), JDK 17 (déjà installé).

**Spec:** `docs/superpowers/specs/2026-08-18-android-apk-design.md`

## Global Constraints

- Le SDK Android va dans `/opt/android-sdk` (pas `~/Android/Sdk`) — la partition `/home` n'a que ~15 Go libres.
- Le cache Gradle va dans `/opt/gradle-cache` via `GRADLE_USER_HOME` — même raison.
- Seuls les command-line tools sont installés, pas Android Studio.
- `platforms;android-34` et le `build-tools` correspondant uniquement — pas d'émulateur, pas de plateformes additionnelles.
- Id de package Capacitor : `com.oxalapp.app`. Nom d'app : `oxalapp`.
- ZXing-js reste tel quel pour ce premier APK — pas de migration vers un plugin caméra natif.
- La connexion réseau app mobile ↔ PocketBase est **hors scope** de ce plan — traitée séparément une fois l'APK de base fonctionnel.
- Ne jamais lancer `sudo` directement — toute commande sudo nécessaire est renvoyée à l'utilisateur pour exécution manuelle.

---

## File Structure

- **Modifier** : `~/.bashrc` (ou fichier de shell équivalent) — ajout de `ANDROID_HOME`, `GRADLE_USER_HOME`, extension de `PATH`.
- **Créer** : `package.json` (modifié — ajout deps Capacitor), `capacitor.config.ts` (généré par `cap init`).
- **Créer** : `android/` (dossier entier généré par `cap add android`, commité dans le repo — convention Capacitor).
- **Modifier** : `.gitignore` — ajout des artefacts de build Android à ignorer (`android/app/build/`, `android/.gradle/`, `android/local.properties`) sans ignorer le reste du dossier `android/`.

---

## Task 1: Installer le SDK Android (command-line tools)

**Files:**
- Modifie : `~/.bashrc`
- Pas de fichier projet touché dans cette tâche.

**Interfaces:**
- Produit : binaires `sdkmanager`, `adb` disponibles dans le `PATH` ; variables d'environnement `ANDROID_HOME=/opt/android-sdk` et `GRADLE_USER_HOME=/opt/gradle-cache` exportées dans tout nouveau shell.

- [ ] **Step 1: Télécharger les command-line tools Android**

```bash
cd /tmp
curl -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q cmdline-tools.zip -d /opt/android-sdk/cmdline-tools-tmp
mkdir -p /opt/android-sdk/cmdline-tools
mv /opt/android-sdk/cmdline-tools-tmp/cmdline-tools /opt/android-sdk/cmdline-tools/latest
rmdir /opt/android-sdk/cmdline-tools-tmp
rm /tmp/cmdline-tools.zip
```

Note : si l'URL a changé (Google met à jour périodiquement le numéro de build), vérifier la version courante sur https://developer.android.com/studio#command-line-tools-only avant de télécharger.

- [ ] **Step 2: Vérifier l'arborescence attendue**

Run: `ls /opt/android-sdk/cmdline-tools/latest/bin`
Expected: contient `sdkmanager`, `avdmanager`, etc.

- [ ] **Step 3: Ajouter les variables d'environnement au shell**

Ajouter à `~/.bashrc` :

```bash
export ANDROID_HOME=/opt/android-sdk
export GRADLE_USER_HOME=/opt/gradle-cache
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Puis recharger :

```bash
source ~/.bashrc
```

- [ ] **Step 4: Vérifier que sdkmanager est accessible**

Run: `sdkmanager --version`
Expected: affiche un numéro de version (ex. `19.0`), pas d'erreur "command not found".

- [ ] **Step 5: Installer platform-tools, la plateforme et les build-tools**

```bash
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

- [ ] **Step 6: Vérifier l'installation**

Run: `adb --version && ls $ANDROID_HOME/platforms && ls $ANDROID_HOME/build-tools`
Expected: `adb` affiche sa version ; `android-34` listé dans `platforms` ; `34.0.0` listé dans `build-tools`.

Pas de commit pour cette tâche (rien dans le repo n'est modifié — uniquement l'environnement système et `~/.bashrc`, hors repo).

---

## Task 2: Ajouter Capacitor au projet et générer le projet Android

**Files:**
- Modifie : `package.json`
- Crée : `capacitor.config.ts`
- Crée : `android/` (dossier entier, généré)
- Modifie : `.gitignore`

**Interfaces:**
- Consomme : build Vite existant (`npm run build` → `dist/`, déjà fonctionnel avant cette tâche).
- Produit : projet Gradle Android dans `android/`, buildable via `./gradlew assembleDebug` (utilisé par Task 3).

- [ ] **Step 1: Installer les packages Capacitor**

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

- [ ] **Step 2: Construire le build web une première fois**

```bash
npm run build
```

Expected: le dossier `dist/` est créé sans erreur (nécessaire car `cap init` / `cap add` s'attendent à trouver un `webDir` cohérent).

- [ ] **Step 3: Initialiser Capacitor**

```bash
npx cap init "oxalapp" "com.oxalapp.app" --web-dir=dist
```

Expected: crée `capacitor.config.ts` à la racine du projet avec `appId: 'com.oxalapp.app'`, `appName: 'oxalapp'`, `webDir: 'dist'`.

- [ ] **Step 4: Ajouter la plateforme Android**

```bash
npx cap add android
```

Expected: crée le dossier `android/` (projet Gradle complet : `android/app`, `android/gradle`, `android/build.gradle`, etc.).

- [ ] **Step 5: Ignorer les artefacts de build Android générés, sans ignorer le projet natif**

Ajouter à `.gitignore` (à la suite de la section "Project-specific") :

```gitignore
# Android (Capacitor) build artifacts
android/app/build/
android/build/
android/.gradle/
android/local.properties
android/captures/
android/.cxx/
```

Ne pas ignorer `android/app/src/`, `android/app/build.gradle`, `android/gradle/wrapper/`, etc. — ces fichiers font partie du projet et doivent être commités.

- [ ] **Step 6: Vérifier que Capacitor voit bien la plateforme**

Run: `npx cap ls`
Expected: liste `android` comme plateforme installée, sans erreur.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json capacitor.config.ts android/ .gitignore
git commit -m "Add Capacitor Android wrapper around the Vite build"
```

---

## Task 3: Builder l'APK debug et vérifier le manifeste

**Files:**
- Lit : `android/app/src/main/AndroidManifest.xml` (généré par Task 2, non modifié sauf si la permission caméra manque)

**Interfaces:**
- Consomme : projet `android/` buildable (produit par Task 2).
- Produit : APK dans `android/app/build/outputs/apk/debug/app-debug.apk` (utilisé par Task 4 pour l'installation).

- [ ] **Step 1: Synchroniser le build web dans le projet natif**

```bash
npm run build
npx cap sync android
```

Expected: pas d'erreur ; message de confirmation "Sync finished".

- [ ] **Step 2: Vérifier la présence de la permission CAMERA dans le manifeste**

Run: `grep -i "android.permission.CAMERA" android/app/src/main/AndroidManifest.xml`

Expected: soit la permission est déjà présente (Capacitor l'ajoute automatiquement si un plugin caméra est détecté), soit rien n'est trouvé.

- [ ] **Step 3: Ajouter la permission manuellement si absente**

Si le grep du Step 2 ne trouve rien, ouvrir `android/app/src/main/AndroidManifest.xml` et ajouter, au niveau de la balise `<manifest>` (avant `<application>`) :

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

Note : ZXing-js utilise `getUserMedia` via la WebView, qui s'appuie sur la permission caméra Android sous-jacente — sans cette ligne, la WebView ne pourra pas demander l'accès à la caméra sur certaines versions d'Android.

- [ ] **Step 4: Builder l'APK debug**

```bash
cd android
./gradlew assembleDebug
cd ..
```

Expected: se termine par `BUILD SUCCESSFUL`. Première exécution plus longue (téléchargement des dépendances Gradle dans `/opt/gradle-cache`).

- [ ] **Step 5: Vérifier que l'APK a été produit**

Run: `ls -la android/app/build/outputs/apk/debug/app-debug.apk`
Expected: le fichier existe, taille de l'ordre de 15-25 Mo.

- [ ] **Step 6: Commit (uniquement si le manifeste a été modifié au Step 3)**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "Add CAMERA permission to Android manifest for barcode scanning"
```

Si le Step 3 n'a rien changé (permission déjà présente), pas de commit pour cette tâche.

---

## Task 4: Installer et vérifier l'APK sur le Moto G15

**Files:**
- Aucun fichier projet modifié — tâche de vérification manuelle sur l'appareil physique.

**Interfaces:**
- Consomme : `android/app/build/outputs/apk/debug/app-debug.apk` (produit par Task 3).
- Produit : confirmation manuelle que l'app se lance sur l'appareil réel — condition de sortie de ce plan.

- [ ] **Step 1: Activer le débogage USB sur le Moto G15**

Sur le téléphone : Paramètres → À propos du téléphone → taper 7 fois sur "Numéro de build" pour activer les options développeur, puis Paramètres → Options pour les développeurs → activer "Débogage USB".

- [ ] **Step 2: Connecter le téléphone en USB et vérifier qu'adb le détecte**

Run: `adb devices`
Expected: le Moto G15 apparaît dans la liste avec le statut `device` (pas `unauthorized` — si `unauthorized`, accepter la popup d'autorisation de débogage USB qui apparaît sur le téléphone, puis relancer la commande).

- [ ] **Step 3: Installer l'APK sur le téléphone**

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Expected: se termine par `Success`.

- [ ] **Step 4: Lancer l'app manuellement sur le téléphone et vérifier visuellement**

Ouvrir l'app "oxalapp" depuis l'écran d'accueil ou le tiroir d'applications du Moto G15.

Expected (à constater par l'utilisateur, pas automatisable) :
- L'app se lance sans crash immédiat.
- L'UI d'oxalapp s'affiche (pas d'écran blanc).
- Le bouton/l'écran de scan caméra s'ouvre et demande la permission caméra sans crash (le scan ne doit pas nécessairement aboutir à un résultat, la connexion backend étant hors scope).

- [ ] **Step 5: Documenter le résultat**

Si tout fonctionne : le plan est terminé, l'objectif ("produire un APK et le tester sur le Moto G15") est atteint. La suite (connexion PocketBase depuis le mobile) sera traitée dans un plan séparé, comme convenu dans le spec.

Si un problème apparaît (crash, écran blanc, permission refusée en boucle) : revenir en mode debug systématique (`superpowers:systematic-debugging`) plutôt que d'itérer au hasard sur le manifeste ou la config Capacitor.

Pas de commit pour cette tâche (vérification manuelle, aucun fichier modifié).
