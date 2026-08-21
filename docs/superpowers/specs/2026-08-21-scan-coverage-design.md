# Améliorer la couverture des scans — design

## Contexte

En examinant l'historique de scans en production, 5 des 10 scans les plus
récents retournaient "non déterminable". Investigation sur ces 5 cas
précis :

- 3 produits (gnocchi/pâtes) existent sur Open Food Facts avec un nom,
  mais `ingredients_text` y est vide — personne n'a encore renseigné la
  liste d'ingrédients pour ces fiches.
- 2 produits (Boursin Vegan, olives Gaea) ont des ingrédients renseignés
  mais dans une langue non couverte par `KNOWN_INGREDIENTS` (anglais,
  norvégien).

Un correctif immédiat (ajout des synonymes anglais, commit `60a91e9`) a
comblé une partie du second cas. Ce document couvre trois volets
complémentaires pour réduire davantage l'écart, sans prétendre l'éliminer :
un produit absent d'Open Food Facts ou une base OHF qui ne couvre pas
l'ingrédient resteront toujours possibles.

## Non-objectifs

- 100% de couverture n'est pas un objectif atteignable ni visé — Open
  Food Facts est une base communautaire, jamais exhaustive par
  construction.
- Pas de compte OFF individuel par utilisateur (friction d'auth
  supplémentaire jugée disproportionnée pour ce projet).
- Pas de nouvelle vérification automatique après une contribution photo
  (le traitement OCR d'Open Food Facts est asynchrone, hors du contrôle
  de l'app).
- Pas de proxy serveur pour le fallback UPCitemdb — appel direct
  client, best-effort, quota partagé non garanti.

## Volet 1 — Distinguer les causes d'échec

`matchIngredients()` reste inchangé (fonction pure, déjà bien testée).
La distinction se fait dans `ResultView`, à partir de données déjà
disponibles :

```ts
type ScanFailureReason = "no-ingredients" | "no-match";

function categorizeFailure(
  result: MatchResult,
  product: OffProduct
): ScanFailureReason | null {
  if (result.level !== "non déterminable") return null;
  if (!product.ingredientsText.trim()) return "no-ingredients";
  return "no-match";
}
```

- `no-ingredients` → le produit existe sur OFF mais sans liste
  d'ingrédients exploitable. C'est le seul cas où la contribution photo
  (Volet 2) est proposée.
- `no-match` → du texte existe, rien n'a matché de connu. Message plus
  honnête que le "non déterminable" actuel (ex: "Aucun ingrédient à
  risque connu détecté dans la liste fournie"), sans action proposée —
  contribuer une photo n'aiderait pas puisque le texte existe déjà.
- Le flux `not-found` (EAN absent d'OFF) reste géré comme aujourd'hui
  par le formulaire de saisie manuelle, avec l'ajout du Volet 3 en amont.

## Volet 2 — Contribuer une photo à Open Food Facts

Quand `categorizeFailure` renvoie `no-ingredients`, `ResultView` propose
un bouton "Photographier les ingrédients". Le flux :

1. `<input type="file" accept="image/*" capture="environment">` — ouvre
   la caméra sur mobile sans dépendance native supplémentaire (cohérent
   avec l'approche déjà retenue pour le scan de code-barres via
   ZXing-js dans un `<video>`, pas de plugin Capacitor caméra dédié).
2. Nouveau module `src/lib/off-contribute.ts` :

```ts
export async function uploadIngredientsPhoto(
  ean: string,
  image: Blob,
  lang: string // "fr" ou "nl", déduit de la langue du produit OFF si disponible, sinon "fr" par défaut
): Promise<boolean>
```

   `POST` multipart vers
   `https://world.openfoodfacts.org/cgi/product_image_upload.pl` avec :
   - `code`: l'EAN
   - `user_id` / `password`: le compte de contribution partagé oxalapp
   - `imagefield`: `ingredients_${lang}`
   - `imgupload_ingredients_${lang}`: le binaire de l'image

3. Retour booléen simple (succès/échec réseau) — pas de lecture du
   contenu OCR extrait, l'API ne le renvoie pas de façon synchrone.
4. `ResultView` affiche un message de confirmation ("Merci, transmis à
   Open Food Facts — la liste d'ingrédients sera disponible après
   traitement") ou d'échec (réutilise le pattern `sync-error` déjà en
   place), sans bloquer le reste de l'écran.

**Credentials** : `VITE_OFF_CONTRIBUTOR_USER` /
`VITE_OFF_CONTRIBUTOR_PASSWORD`, nouvelles variables d'environnement
suivant le même traitement que `VITE_POCKETBASE_URL` (`.env.local` /
`.env.production`, jamais commitées). Le compte est dédié à cet usage,
sans autre permission ou donnée sensible associée — le compromis d'avoir
ces identifiants côté client (build web/APK, donc inspectables) est
jugé acceptable pour cette raison, mais reste un compromis assumé, pas
une garantie de confidentialité.

## Volet 3 — Fallback UPCitemdb quand OFF ne trouve rien

Quand `getProductByBarcode` renvoie `null` (OFF `status: 0` ou produit
absent), avant de tomber sur l'écran "produit non trouvé" actuel :

```ts
// src/lib/upcitemdb-client.ts
export async function lookupProductName(ean: string): Promise<string | null>
```

`GET https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}` (plan
gratuit, pas de clé requise, 100 requêtes/jour partagées par toute
l'app). Si un nom est trouvé, il pré-remplit le champ "Nom du produit"
du formulaire de saisie manuelle déjà existant dans `ResultView`
(actuellement vide). L'utilisateur n'a plus qu'à taper les ingrédients
lui-même.

Comportement best-effort explicite : tout échec (quota dépassé, timeout,
réseau) est silencieux et dégrade vers le comportement actuel (champ
"Nom du produit" vide) — pas de message d'erreur supplémentaire, pas de
retry.

## Composants touchés

- `src/lib/off-contribute.ts` (nouveau) — upload photo vers OFF.
- `src/lib/upcitemdb-client.ts` (nouveau) — lookup nom produit fallback.
- `src/components/ResultView.tsx` — branchement des 3 volets :
  catégorisation d'échec, bouton contribution photo, pré-remplissage du
  nom via UPCitemdb.
- `.env.local` / `.env.production` — nouvelles clés
  `VITE_OFF_CONTRIBUTOR_USER` / `VITE_OFF_CONTRIBUTOR_PASSWORD` (valeurs
  réelles fournies hors du repo, comme pour PocketBase).

## Tests prévus

- `categorizeFailure` : tests unitaires purs pour les 3 branches
  (`no-ingredients`, `no-match`, `null` quand `level` n'est pas "non
  déterminable").
- `uploadIngredientsPhoto` : mock `fetch`, vérifie le `FormData` envoyé
  (champs `code`, `user_id`, `imagefield`, image binaire), gère succès
  et échec réseau.
- `lookupProductName` : mock `fetch`, teste réponse avec nom, réponse
  vide, et échec réseau (retourne `null` dans tous les cas d'échec).
- `ResultView` : tests de composant couvrant chaque nouvel embranchement
  UI (bouton photo visible seulement si `no-ingredients`, champ nom
  pré-rempli après fallback UPCitemdb réussi, message `no-match` distinct
  de l'ancien "non déterminable" générique).

## Risques et limites assumés

- Le compte de contribution OFF partagé signifie que toutes les
  contributions de tous les utilisateurs de l'app apparaissent comme
  venant d'une seule identité OFF — acceptable pour cette échelle de
  projet, à revisiter si l'usage grandissait significativement.
- Le quota UPCitemdb (100/jour, partagé) peut être épuisé par un usage
  concurrent d'autres apps utilisant la même clé si applicable, ou par
  un pic d'usage — dégrade silencieusement vers le comportement actuel,
  jamais un blocage visible pour l'utilisateur.
- Aucun de ces volets ne résout les cas où l'ingrédient à risque existe
  bien dans le texte mais dans une langue totalement non couverte
  (norvégien, allemand, etc.) — seul un futur élargissement de
  `KNOWN_INGREDIENTS` à ces langues y remédierait, hors scope ici.
