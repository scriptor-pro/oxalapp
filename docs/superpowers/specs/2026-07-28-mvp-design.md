# oxalapp — Design MVP

Date : 2026-07-28

## Contexte

Application (web/mobile) permettant d'estimer la teneur en oxalate d'un
produit alimentaire (y compris produits transformés) à partir de son
code-barres. Il n'existe pas de base grand public équivalente à Yuka pour
l'oxalate — ce nutriment n'est pas soumis à étiquetage obligatoire. L'app
**estime** un niveau à partir de la liste d'ingrédients, elle ne retourne
pas de valeur exacte garantie.

Le projet est destiné à être partagé avec d'autres personnes concernées
(patients/proches gérant leur apport en oxalate), pas uniquement à un usage
personnel — d'où la présence de comptes utilisateurs dès le MVP.

## Objectif du MVP

Permettre à un utilisateur connecté de scanner un produit, obtenir une
estimation de son niveau d'oxalate, et retrouver son historique de scans.

## Sources de données

- **OHF (Oxalosis & Hyperoxaluria Foundation)** — base de référence pour
  les teneurs en oxalate. Le PDF officiel (`Oxalate-List-022724.pdf`) est
  déjà présent dans le répertoire du projet — pas besoin de le
  retélécharger ni de scraper le site pour le MVP.
- **Open Food Facts** (`world.openfoodfacts.org/api`) — API publique
  gratuite, bonne couverture des produits belges/français. Retourne la
  liste d'ingrédients d'un produit à partir de son code-barres (EAN).

## Architecture

```
Navigateur (PWA React/TSX)
  ├─→ Open Food Facts API (EAN → ingrédients, infos produit)
  ├─→ Base oxalate embarquée (JSON généré depuis le PDF OHF)
  ├─→ Moteur de matching mots-clés (JS, côté client)
  └─→ PocketBase (auth email/mdp, historique de scans, favoris)
```

Le front est une PWA statique (React/TSX + Vite), déployée sur Vercel.
PocketBase tourne sur un petit VPS et gère uniquement les
comptes utilisateurs et leurs données personnelles (historique, favoris) —
jamais la donnée produit (vient d'Open Food Facts en temps réel) ni la
base oxalate (embarquée statiquement dans le bundle).

**Alternative envisagée et écartée pour le MVP** : ajouter un serveur Node
intermédiaire entre le front et OFF/PocketBase, pour faire le matching
côté serveur et cacher les appels OFF. Écartée car le matching retenu
(règles par mots-clés) est trivial à exécuter côté client, et un service
supplémentaire ajoute de la maintenance sans bénéfice au stade MVP.
Migration possible plus tard si le matching se complexifie ou si la base
doit devenir modifiable sans redéploiement du front.

## Composants

1. **Extraction de la base oxalate** (script Python one-shot, hors app)
   Parse `Oxalate-List-022724.pdf` avec `pdfplumber` → produit
   `oxalate-database.json` structuré : `{ ingrédient, catégorie, portion,
   mg_oxalate, niveau }`. Exécuté une fois, résultat versionné dans le
   repo. Ré-exécutable manuellement si OHF publie une mise à jour.

2. **Module de matching** (`src/lib/oxalate-matcher.ts`)
   Prend la liste d'ingrédients (texte brut d'Open Food Facts) en entrée,
   recherche les sous-chaînes correspondant aux entrées connues de la base
   oxalate (insensible à la casse/accents), retourne un niveau global
   (faible / modéré / élevé / très élevé) + le détail des ingrédients
   ayant matché. Logique pure, testable indépendamment de l'UI.

3. **Client Open Food Facts** (`src/lib/off-client.ts`)
   Wrapper autour de l'API OFF : `getProductByBarcode(ean)` → ingrédients
   + nom/image produit, ou `null` si non trouvé.

4. **Scanner code-barres** (`ScannerView`)
   Composant React utilisant ZXing-js (cross-browser, fonctionne sur
   Safari/iOS contrairement à la Barcode Detection API native) pour
   scanner via la caméra, retourne l'EAN détecté.

5. **Résultat de scan** (`ResultView`)
   Affiche le produit, le niveau oxalate estimé avec explication (quels
   ingrédients ont pesé dans l'estimation), et l'avertissement
   "estimation indicative — les valeurs varient selon variété, sol,
   cuisson, etc.". Gère le cas "non trouvé" avec formulaire de saisie
   manuelle (nom produit ou ingrédients en texte libre).

6. **Auth + Historique** (PocketBase)
   Collections PocketBase :
   - `users` (auth native email/mot de passe)
   - `scans` (user, ean, nom produit, niveau, date, favori: bool,
     source: "off" | "saisie_manuelle")

   Écrans : connexion/inscription, liste historique (chronologique, avec
   niveau et étoile favori), détail d'un scan passé, toggle favori.

## Flux de données (parcours principal)

1. Utilisateur connecté ouvre l'app → écran de scan par défaut.
2. Scan caméra → EAN détecté (ZXing-js).
3. Appel Open Food Facts avec l'EAN.
   - **Produit trouvé** → ingrédients extraits → matcher oxalate →
     niveau calculé → `ResultView` affiché → scan sauvegardé
     automatiquement dans l'historique PocketBase.
   - **Produit non trouvé sur OFF** → message "produit inconnu" +
     formulaire de saisie manuelle → si saisi, passe par le matcher →
     résultat affiché, sauvegardé avec `source: "saisie_manuelle"`.
4. Depuis `ResultView`, l'utilisateur peut marquer le produit en favori.
5. Onglet "Historique" → liste chronologique des scans → clic sur une
   entrée → détail complet revisualisé.

## Gestion des erreurs

- **Permission caméra refusée / indisponible** → message explicite + lien
  vers réglages navigateur.
- **Timeout/erreur réseau Open Food Facts** → message "service
  indisponible, réessayez" (distinct du cas "produit non trouvé").
- **Aucun ingrédient ne matche la base oxalate** (produit trouvé mais
  liste trop générique) → niveau affiché "non déterminable" plutôt qu'un
  faux "faible".
- **Échec de sauvegarde PocketBase** → n'empêche jamais l'affichage du
  résultat à l'utilisateur ; notification discrète d'échec de
  synchronisation seulement.

## Tests

- Tests unitaires du module de matching : cas connus (ex. liste avec
  cacao → élevé), liste sans ingrédient à risque → faible, ingrédients
  vides/malformés → non déterminable.
- Tests unitaires du parsing du PDF OHF : vérifier la structure de sortie
  sur un échantillon du PDF réel.
- Test manuel du flux complet (scan d'un vrai produit) avant mise à
  disposition des autres utilisateurs.

## Hors scope MVP (pistes futures)

- Suppression d'entrées de l'historique.
- Connexion via Google ou autre fournisseur OAuth.
- Score pondéré par quantité/position des ingrédients.
- Serveur intermédiaire pour matching côté serveur / cache OFF.
- Couverture élargie des marques belges/européennes dans la base oxalate.
