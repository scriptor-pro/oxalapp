# Génération d'un APK Android testable (Capacitor)

Date : 2026-08-18

## Contexte / problème

oxalapp est actuellement une PWA React/Vite pure, sans wrapper mobile.
L'utilisateur veut produire un fichier `.apk` installable et testable sur
son Moto G15, sans dépendre d'un hébergement web public.

## Décision : Capacitor plutôt que TWA/Bubblewrap

Comparatif fait en amont (voir échange de brainstorming) :

- **TWA/Bubblewrap** empaquette une PWA déjà déployée publiquement en HTTPS
  (vérification des Digital Asset Links contre un domaine public). Le projet
  n'étant testé qu'en HTTPS local avec certificat auto-signé, ce chemin
  imposerait un déploiement public préalable, hors scope immédiat.
- **Capacitor** permet de partir du build Vite local tel quel et de produire
  un APK testable directement sur l'appareil, sans hébergement public. C'est
  le chemin le plus direct vers l'objectif ("produire un .apk et le tester
  sur mon smartphone").

## Contraintes d'environnement

- Le point de montage `/home` (`/dev/sda4`) est presque plein (~15 Go
  disponibles sur 272 Go). Le SDK Android (~3-5 Go) et le cache Gradle
  (~500 Mo-1,5 Go) doivent donc être installés hors de `/home`.
- `/` (`/dev/sda2`) a ~410 Go disponibles : c'est là que va le SDK.
- `/opt/android-sdk` et `/opt/gradle-cache` ont été créés et chownés à
  l'utilisateur (commande sudo lancée manuellement par l'utilisateur, pas
  par Claude — cf. règle mémorisée de ne jamais lancer sudo soi-même).
- Seul le SDK **command-line tools** est installé (pas Android Studio
  complet) pour limiter l'empreinte disque et parce qu'aucun IDE graphique
  n'est nécessaire au workflow de build.

## Périmètre de ce premier incrément

Produire un APK qui **se lance et affiche l'UI de l'app** sur le Moto G15.

Explicitement hors scope pour cet incrément, à traiter séparément une fois
l'APK de base fonctionnel :
- Connexion de l'app mobile au backend PocketBase (actuellement accessible
  seulement via `127.0.0.1:8090` en dev — une WebView sur le téléphone ne
  peut pas atteindre le `127.0.0.1` du laptop ; nécessitera de pointer vers
  l'IP locale du laptop sur le Wi-Fi et de gérer le certificat auto-signé
  ou une config réseau Android dédiée).
- Migration éventuelle du scan caméra (ZXing-js) vers un plugin caméra
  natif Capacitor — on garde ZXing-js tel quel pour ce premier APK.

## Design

### 1. SDK Android (command-line tools)

- Téléchargement des command-line tools officiels Google dans
  `/opt/android-sdk`.
- Installation via `sdkmanager` de : `platform-tools`, `platforms;android-34`,
  `build-tools` correspondants. Pas d'émulateur, pas de plateformes
  additionnelles.
- Variables d'environnement ajoutées au fichier de shell de l'utilisateur
  (`~/.bashrc` ou équivalent) :
  - `ANDROID_HOME=/opt/android-sdk`
  - `PATH` étendu avec `$ANDROID_HOME/cmdline-tools/latest/bin` et
    `$ANDROID_HOME/platform-tools`
  - `GRADLE_USER_HOME=/opt/gradle-cache`

### 2. Intégration Capacitor

- Ajout des dépendances `@capacitor/core`, `@capacitor/cli`,
  `@capacitor/android` au `package.json` existant.
- `npx cap init` : nom d'app "oxalapp", id de package `com.oxalapp.app`.
- `webDir` pointé vers `dist/` (sortie du build Vite existant, `npm run
  build`).
- `npx cap add android` génère le dossier `android/` (projet Gradle
  natif). Ce dossier est commité dans le repo, conformément à la
  convention Capacitor (le projet natif fait partie du code source, pas un
  artefact généré à ignorer).

### 3. Caméra / scan EAN

- ZXing-js conservé tel quel, fonctionne en WebView.
- Vérifier après `cap add android` que la permission `CAMERA` est bien
  présente dans `android/app/src/main/AndroidManifest.xml` (Capacitor
  l'ajoute généralement automatiquement si un plugin caméra est détecté ;
  à vérifier manuellement sinon, ZXing-js utilisant l'API web
  `getUserMedia` plutôt qu'un plugin natif).

### 4. Build de l'APK

- `npm run build` → génère `dist/`.
- `npx cap sync android` → copie `dist/` dans le projet natif Android.
- `cd android && ./gradlew assembleDebug` → produit un APK debug non signé
  dans `android/app/build/outputs/apk/debug/`.
- Installation sur le Moto G15 : via câble USB + `adb install` (mode
  débogage USB à activer sur le téléphone), ou transfert manuel du
  fichier APK.

### 5. Vérification

Pas de tests automatisés spécifiques au wrapper natif pour ce premier
incrément (hors scope raisonnable). Vérification manuelle sur l'appareil :
- L'app se lance sans crash.
- L'UI s'affiche correctement dans la WebView.
- Le scan caméra s'ouvre (sans nécessairement aboutir à une requête
  backend, puisque la connexion PocketBase est hors scope ici).

## Suite (hors scope, à rediscuter)

- Connexion réseau app mobile ↔ PocketBase (IP locale + gestion du
  certificat auto-signé ou config réseau Android dédiée).
- Éventuelle migration vers un plugin caméra natif Capacitor si ZXing-js
  s'avère insuffisant en conditions réelles sur le Moto G15.
