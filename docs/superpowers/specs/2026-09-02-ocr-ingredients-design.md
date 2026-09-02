# OCR local pour la liste d'ingrédients — design

## Contexte

Aujourd'hui, quand la liste d'ingrédients n'est pas exploitable — produit
connu d'Open Food Facts mais `ingredients_text` vide (`no-ingredients`), ou
EAN totalement absent d'OFF (`not-found`) — l'utilisateur n'a que deux
options : attendre le traitement OCR asynchrone d'Open Food Facts (minutes
à jours, hors contrôle de l'app, cf.
`docs/superpowers/specs/2026-08-21-scan-coverage-design.md`), ou taper la
liste d'ingrédients à la main dans le formulaire manuel de `ResultView`.

Ce document ajoute une troisième option : une reconnaissance de texte
**locale, embarquée dans l'app**, qui lit l'étiquette photographiée et
pré-remplit le formulaire manuel existant — résultat immédiat, sans
dépendre du traitement communautaire OFF ni de la saisie clavier complète.

## Non-objectifs

- Pas de matching automatique sans relecture humaine. L'OCR sur du petit
  texte d'étiquette n'est jamais parfait ; le texte reconnu pré-remplit un
  champ éditable, l'utilisateur valide explicitement avant que
  `matchIngredients()` s'exécute. Un mode "automatique direct" pourra être
  ajouté plus tard si l'usage sur le terrain montre que c'est fiable —
  hors scope ici (voir Risques et limites assumés).
- Pas de vue caméra dédiée avec cadre de guidage. Réutilisation du
  mécanisme de capture déjà en place
  (`<input type="file" capture="environment">`), une seule prise de vue
  statique, cohérent avec le bouton photo existant.
- Pas de support iOS. Le projet ne cible que le web et l'Android
  (`android/`, pas de dossier `ios/`) ; le plugin retenu supporte iOS mais
  ce volet reste hors scope tant qu'aucun build iOS n'existe.
- Pas de support web pour l'OCR. Le SDK ML Kit Text Recognition sous-jacent
  ne fonctionne que sur Android/iOS natif ; sur web, le comportement actuel
  (upload photo vers OFF pour `no-ingredients`, saisie manuelle pour
  `not-found`) reste inchangé, sans dégradation ni message d'erreur
  supplémentaire.
- Pas d'exclusion des modèles de script non utilisés (chinois, devanagari,
  japonais, coréen) du plugin — voir Risques et limites assumés.

## Volet 1 — Module `ocr-client.ts`

Nouveau module pur, sans état, suivant le pattern déjà en place dans
`off-client.ts` / `upcitemdb-client.ts` (une fonction async, dégradation
silencieuse vers une valeur neutre en cas d'échec) :

```ts
// src/lib/ocr-client.ts
export async function recognizeIngredientsText(photo: Blob): Promise<string | null>
```

Comportement :

1. Si `Capacitor.isNativePlatform()` (de `@capacitor/core`) est `false`,
   retourne `null` immédiatement — aucun appel filesystem ni ML Kit.
2. Écrit `photo` dans le cache de l'app via `@capacitor/filesystem`
   (`Filesystem.writeFile({ path, data: <base64>, directory:
   Directory.Cache })`) pour obtenir un chemin de fichier natif
   (`file://…`), condition requise par l'API de `processImage` (qui
   n'accepte pas un `Blob`/`File` navigateur directement).
3. Appelle `TextRecognition.processImage({ path, script: Script.Latin })`
   de `@capacitor-mlkit/text-recognition` (couvre français/néerlandais/
   anglais, cohérent avec `KNOWN_INGREDIENTS`).
4. Supprime le fichier temporaire (`Filesystem.deleteFile`) dans tous les
   cas — succès ou échec — pour ne pas accumuler des photos dans le
   stockage de l'app.
5. Retourne `result.text` (texte brut concaténé) si tout a réussi, sinon
   `null` (écriture fichier échouée, `processImage` a rejeté, ou texte vide
   après trim).

Ce module ne connaît ni `ResultView`, ni le matching — il transforme une
photo en texte, ou en absence de texte. Toute autre logique (pré-remplir
un formulaire, décider quand afficher le bouton) vit dans `ResultView`.

**Nouvelles dépendances** : `@capacitor-mlkit/text-recognition` (^8.2.0,
compatible avec `@capacitor/*` ^8.5.0 déjà en place), `@capacitor/filesystem`
(plugin officiel Capacitor).

## Volet 2 — Câblage dans `ResultView`

Le formulaire manuel existant (nom du produit + `textarea` ingrédients +
bouton "Valider", actuellement affiché uniquement pour l'état
`not-found`) est réutilisé tel quel pour les deux flux, avec une
précision : pour `not-found`, `manualName` démarre vide (aucun nom connu,
sauf pré-remplissage best-effort déjà existant via UPCitemdb) ; pour
`no-ingredients`, `manualName` est initialisé avec `state.product.productName`
dès l'affichage du formulaire — OFF a déjà donné le vrai nom, inutile de le
refaire taper.

- **`not-found`** (EAN absent d'OFF et d'USDA) : un nouveau bouton
  "Photographier pour remplir" apparaît à côté de la `textarea`, visible
  uniquement si `Capacitor.isNativePlatform()`. Il déclenche la capture
  photo existante, passe le résultat à `recognizeIngredientsText`, et
  pré-remplit `manualIngredients` avec le texte reconnu (l'utilisateur
  reste libre de corriger avant de valider). Rien ne change sur web : la
  `textarea` reste à remplir à la main.
- **`no-ingredients`** (produit connu d'OFF sans ingrédients) : le
  formulaire manuel (aujourd'hui absent de cet état) est affiché en plus
  du message existant, avec le même bouton photo conditionnel. Sur
  Android natif, ce bouton **remplace** le bouton "Photographier les
  ingrédients" actuel (celui qui appelle `uploadIngredientsPhoto` vers
  OFF) — une seule action photo, qui alimente l'OCR local plutôt que la
  contribution communautaire différée. Sur web, où l'OCR n'existe pas, le
  bouton actuel d'upload OFF reste seul présent, comportement inchangé.
- Validation du formulaire (`handleManualSubmit`, inchangé) exécute
  `matchIngredients()` sur le texte de la `textarea` (reconnu par OCR ou
  tapé) et affiche un résultat immédiat, sans attendre de traitement
  externe.

## Volet 3 — Gestion des erreurs et dégradation

Chaque étape dégrade silencieusement, sans bloquer l'utilisateur ni
afficher de message d'erreur intrusif (même philosophie que
`upcitemdb-client.ts`) :

- Plateforme non native → bouton photo absent, comportement actuel
  inchangé.
- Écriture du fichier temporaire échoue → `null`, `textarea` reste dans
  son état courant (vide ou déjà tapée), l'utilisateur peut retenter la
  photo ou taper à la main.
- `processImage` rejette (image illisible, modèle ML Kit non disponible,
  format non supporté) → `null`, même dégradation.
- Texte reconnu vide après trim (photo floue, mal cadrée, pas de texte
  visible) → `null`, même dégradation.
- Le fichier temporaire est systématiquement supprimé, y compris sur les
  chemins d'échec après écriture réussie.

## Composants touchés

- `src/lib/ocr-client.ts` (nouveau) — `recognizeIngredientsText`.
- `src/lib/ocr-client.test.ts` (nouveau).
- `src/components/ResultView.tsx` (modifié) — formulaire manuel affiché
  aussi pour `no-ingredients`, bouton photo conditionnel sur
  `Capacitor.isNativePlatform()`, bascule OCR local / upload OFF pour ce
  même état.
- `src/components/ResultView.test.tsx` (modifié) — nouveaux tests pour
  chaque embranchement.
- `package.json` — ajout de `@capacitor-mlkit/text-recognition` et
  `@capacitor/filesystem`.

Aucune modification du manifeste Android (`CAMERA` et `INTERNET` déjà
déclarées), ni de `scripts/build-apk.sh` (le pipeline `npm run build` →
`npx cap sync android` → `gradlew assembleDebug` reste valide tel quel —
`cap sync` doit simplement être relancé une fois après l'installation des
nouvelles dépendances pour générer les modules Gradle natifs).

## Tests prévus

- `ocr-client.test.ts` : mock de `@capacitor-mlkit/text-recognition`,
  `@capacitor/filesystem`, `@capacitor/core`.
  - Retourne le texte reconnu quand écriture, OCR et lecture réussissent.
  - Retourne `null` immédiatement si `isNativePlatform()` est `false`,
    sans appeler filesystem ni ML Kit.
  - Retourne `null` si l'écriture du fichier échoue.
  - Retourne `null` si `processImage` rejette.
  - Retourne `null` si le texte reconnu est vide/blanc.
  - Supprime le fichier temporaire dans tous les cas (succès et échec
    après écriture réussie).
- `ResultView.test.tsx` :
  - Bouton "Photographier pour remplir" absent quand `isNativePlatform()`
    est `false`, pour `not-found` et `no-ingredients`.
  - Présent et pré-remplit `manualIngredients` quand l'OCR réussit.
  - `textarea` reste inchangée quand l'OCR renvoie `null`.
  - Pour `no-ingredients` sur natif : le bouton actuel d'upload OFF n'est
    plus affiché, seul le bouton OCR l'est.
  - Pour `no-ingredients` sur web : le comportement actuel (bouton upload
    OFF) reste inchangé, aucun bouton OCR affiché.
  - Pour `no-ingredients` : le champ nom du formulaire manuel est
    pré-rempli avec `state.product.productName` dès l'affichage, sans
    action de l'utilisateur.

## Risques et limites assumés

- **Pas de relecture automatique** : chaque photo doit être validée à la
  main par l'utilisateur avant matching. Un mode "matching automatique
  direct" est envisagé comme évolution future une fois l'usage réel sur
  le terrain aura montré la fiabilité de l'OCR sur les étiquettes
  réellement rencontrées — non construit ici pour éviter un faux niveau
  d'oxalate affiché silencieusement sur une lecture erronée.
- **Taille d'app** : `@capacitor-mlkit/text-recognition` embarque par
  défaut les modèles des 5 scripts supportés (latin, chinois, devanagari,
  japonais, coréen), sans option documentée pour n'inclure que le latin
  — plusieurs Mo ajoutés à l'APK au-delà du nécessaire. Acceptable pour
  cet usage (APK side-loadé sur un appareil de test, pas de distribution
  Play Store avec contrainte de taille), mais un compromis assumé plutôt
  qu'une optimisation.
- **Perte de la contribution communautaire OFF pour `no-ingredients` sur
  natif** : quand l'OCR local est disponible, la photo n'est plus envoyée
  à Open Food Facts. Les futurs scans de ce même produit — par cet
  utilisateur ou d'autres, sur web ou sans OCR fiable — ne bénéficient pas
  de la lecture faite ici. Décision explicite de l'utilisateur (priorité
  au résultat immédiat sur cette session plutôt qu'à l'effet réseau
  communautaire).
- **Précision OCR sur petit texte dense** : une seule prise de vue
  statique, sans cadrage guidé ni prétraitement d'image (contraste,
  redressement de perspective) — la qualité de reconnaissance dépendra
  fortement du cadrage et de l'éclairage au moment de la photo. Le texte
  restant éditable avant validation limite l'impact d'une reconnaissance
  imparfaite.
