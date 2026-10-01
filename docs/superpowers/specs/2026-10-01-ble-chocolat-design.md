# Blé en trois paliers, chocolat et cacao, mention « niveau minimum » — design

## Contexte

Après le chantier « ingrédients faibles » (`2026-10-01-ingredients-faibles-monde-ferme-design.md`),
il reste 76 « non déterminable » sur les 200 produits belges les plus scannés de l'échantillon
d'audit. Les ingrédients inconnus les plus fréquents sont la farine de blé (22 produits), la farine
complète (7), puis les pépites de chocolat, les flocons d'avoine et le cacao.

Une mesure jetable (2026-10-01) donne :

- reconnaître le blé en trois paliers : 76 → **46** « non déterminable » ;
- mais 19 des 30 produits ainsi résolus gardent un ingrédient significatif inconnu, souvent du
  chocolat. Leur niveau n'est alors qu'un minimum : par exemple Granola L'Original reste
  « élevé » alors qu'il contient 27 % de chocolat au lait non reconnu.

Ce document couvre trois changements livrés ensemble : le blé, le chocolat et le cacao, et une
mention qui signale qu'un niveau n'est qu'un minimum.

## Décisions de l'utilisateur

1. **Blé classé par 100 g, en trois paliers**, fondés sur la littérature
   (`choix-pates-oxalate.md`, recherche du 2026-10-01) :
   - son → très élevé (200 à 460 mg/100 g) ;
   - complet → élevé (50 à 80 mg/100 g) ;
   - raffiné → modéré (15 à 45 mg/100 g).

   Les pâtes, le couscous et la semoule raffinés sont donc « modéré », sans distinction entre blé
   dur et blé tendre. Raison donnée : « une portion, c'est subjectif ».
2. **Reconnaissance aussi dans le texte brut** (saisie manuelle, OCR, USDA), avec des expressions
   précises et jamais « blé » seul.
3. **Mention « niveau minimum »** : le badge reste inchangé, et une phrase liste les ingrédients
   non reconnus.
4. **Approche** : le générateur existant est étendu pour produire une seconde table, celle des
   ingrédients à risque, à partir de familles de la taxonomie Open Food Facts (OFF).

## Non-objectifs

- Pas d'avoine ni d'autre famille, mais la liste des familles est conçue pour en ajouter plus tard
  sans changer le code.
- Pas de passage du reste de l'app au classement par 100 g. Les autres ingrédients restent classés
  par portion : c'est un point ouvert, à décider séparément.
- Pas de calcul d'oxalate par emballage (chantier ultérieur).
- Pas de modification de l'historique ni du schéma PocketBase.

## Volet 1 — Table des ingrédients à risque hérités

### 1.1 Source écrite à la main : `scripts/risky-oxalate-roots.json`

```jsonc
{
  "families": [
    {
      "id": "wheat",
      "root": "en:wheat",
      "label": "blé",
      "level": "modéré",
      "justification": "blé raffiné : pains 16,5-45,9 mg/100 g (Okombo & Liebman 2010), pâtes 20-30 mg/100 g (Liebman & Okombo 2009) ; classement par 100 g (choix-pates-oxalate.md)",
      "upgrades": [
        {
          "pattern": "whole|wholemeal|graham|bulgur|freekeh|germ|flakes|puffed|grain|kernels|groats|sprouted|einkorn-wheat|^en:emmer$|rivet|hard-|^en:soft-wheat$|soft-white-wheat|soft-red|grit|cooked-wheat|type-110|type-150|t-1050|type-850|type-2$|dark-|seitan",
          "level": "élevé",
          "label": "blé complet",
          "justification": "blé complet : grain entier 53,3-76,6 mg/100 g, farine et flocons complets comparables (Siener et al. 2006, PMID 16608223)"
        },
        {
          "pattern": "bran",
          "level": "très élevé",
          "label": "son de blé",
          "justification": "son de blé 207-457,4 mg/100 g (base OHF ; Siener et al. 2006)"
        }
      ]
    },
    {
      "id": "chocolate",
      "root": "en:chocolate",
      "label": "chocolat",
      "level": "très élevé",
      "justification": "Candy, Dark Chocolate 232 mg/100 g ; Candy, Milk Chocolate 115 mg/100 g (OHF)"
    },
    {
      "id": "cocoa",
      "root": "en:cocoa",
      "label": "cacao",
      "level": "très élevé",
      "justification": "Cocoa or Cacao Powder, Dark Chocolate 656 mg/100 g ; Cocoa Powder, Dutch Process 170 mg/100 g (OHF)"
    }
  ],
  "exclude": [
    { "id": "en:white-chocolate", "justification": "Candy, White Chocolate, bar or chips : 8 mg/100 g, faible (OHF)" }
  ]
}
```

Les motifs `upgrades` s'appliquent à l'identifiant OFF, dans l'ordre : le dernier motif reconnu
l'emporte, si bien que « son » passe avant « complet ». Ils reprennent les règles de la mesure du
2026-10-01, qui a classé 53 identifiants complets et 70 raffinés.

### 1.2 Règles de calcul

Pour chaque famille, chaque descendant de `root`, `root` compris, reçoit le niveau de la famille,
éventuellement relevé par un `upgrade`. **Sauf** dans ces cas :

1. il est dans `exclude`, ou descend d'un identifiant exclu ;
2. il figure dans la table « faible » (`low-oxalate-ingredients.json`). Le beurre de cacao, par
   exemple, reste faible : cette table l'emporte toujours ;
3. il est l'`offId` exact d'une entrée de `KNOWN_INGREDIENTS` (`en:wheat`, `en:wheat-bran`,
   `en:cocoa`…), qui garde son niveau existant.

Si un identifiant appartient à deux familles, le niveau le plus élevé l'emporte, et le rapport le
signale.

### 1.3 Générateur

- `scripts/risky-oxalate-generator.ts` : logique pure.
  `computeRiskyOxalateIds(taxonomy, riskyRootsFile, lowIds, knownOffIds)` renvoie la table et un
  rapport :
  - nombre d'identifiants par famille et par niveau ;
  - identifiants écartés par `exclude`, par la table faible et par `KNOWN_INGREDIENTS` ;
  - identifiants présents dans deux familles.

  La fonction échoue si une racine ou une exclusion est absente de la taxonomie, ou si un motif
  n'est pas une expression régulière valide.
- Le point d'entrée `scripts/generate-low-oxalate-ingredients.ts` est renommé
  `scripts/generate-oxalate-tables.ts`. Il télécharge la taxonomie une seule fois et produit les
  deux tables : la table faible d'abord, puis la table à risque, qui a besoin des identifiants
  faibles. Le script npm `generate:low-oxalate` devient `generate:oxalate-tables`.
- Sortie `src/data/risky-oxalate-ingredients.json`, avec le même en-tête de provenance (source,
  date, empreinte, licence ODbL) que la table faible :

```jsonc
{
  "source": { "...": "..." },
  "families": { "wheat": { "label": "blé", "justification": "..." }, "...": {} },
  "ids": { "en:wheat-flour": { "level": "modéré", "label": "blé", "family": "wheat" } }
}
```

Taille attendue : environ 190 entrées.

## Volet 2 — Mots-clés pour le texte brut

### 2.1 Nouvelle exclusion « précédé de »

`KnownIngredient` reçoit un champ optionnel `excludePrecededBy?: string[]`, symétrique de
`excludeFollowedBy`. Il est implémenté par une assertion arrière négative (lookbehind) sur le texte
normalisé.

### 2.2 Entrées ajoutées à `src/data/known-ingredients.ts`

| Mot-clé (et variantes) | Niveau | Exclusions |
|---|---|---|
| farine de blé, farine de froment, semoule de blé, semoule de blé dur, blé dur, wheat flour, durum wheat semolina, tarwebloem | modéré | — |
| farine de blé complet, farine de blé complète, farine complète de blé, farine complète, blé complet, flocons de blé, germe de blé, volkoren tarwemeel, whole wheat flour, wholemeal flour, wheat germ | élevé | — |
| chocolat | très élevé | suivi de « blanc » |
| chocolade | très élevé | précédé de « witte » |
| chocolate | très élevé | précédé de « white » |

Ajouts aux entrées existantes :
- `cacao` reçoit `excludePrecededBy: ["beurre de"]` ;
- `cocoa` reçoit `excludeFollowedBy: ["butter"]`.

Le néerlandais « cacaoboter » n'est déjà pas reconnu, faute de limite de mot entre « cacao » et
« boter ».

« blé » seul n'est jamais un mot-clé. Le dédoublonnage existant garde le mot-clé le plus long : dans
« farine de blé complet », seul « farine de blé complet » (élevé) est retenu, pas « farine de blé »
(modéré). Les nouvelles entrées n'ont pas d'`offId` : la reconnaissance par identifiant passe
exclusivement par la table à risque du volet 1.

## Volet 3 — Matcher et affichage

### 3.1 `matchStructuredIngredients`

L'ordre de classement d'un ingrédient structuré devient :

1. `offId` exact d'un ingrédient à risque connu (existant) ;
2. `offId` dans la table faible (existant) ;
3. **`offId` dans la table à risque héritée** (nouveau) : correspondance avec `level` et `label` du
   palier, `labelText` égal au texte de l'étiquette, `dbItem` égal à la justification du palier ;
4. mots-clés du texte, désormais avec les nouvelles entrées et exclusions (existant, étendu) ;
5. sinon, ingrédient inconnu.

Le reste ne change pas : rétrogradation par proportion, inconnus négligeables sous 2 %, garde-fou
de 5 %, règle stricte de « faible ».

### 3.2 `ResultView` : mention « niveau minimum »

Si le niveau est « modéré » ou « élevé » **et** que `unknownIngredients` n'est pas vide, une ligne
s'ajoute sous la liste des ingrédients à risque :

> Niveau minimum : ces ingrédients n'ont pas été reconnus et pourraient l'augmenter : pépites de
> chocolat (15%).

Elle utilise le même format que la liste « Ingrédients non reconnus » : pourcentages arrondis,
doublons retirés, nom jamais vide.

Pas de mention pour :
- « très élevé », qui ne peut pas être dépassé ;
- « faible », qui exige déjà l'absence d'inconnus ;
- « non déterminable », qui a déjà sa propre liste.

`IngredientsOcrView` n'est pas concerné, puisque le texte brut n'a pas d'inconnus listés.

## Volet 4 — Tests, mesure, critères de réussite

### 4.1 Tests automatiques

- **Générateur** (mini-taxonomie fictive) :
  - niveau de la famille ;
  - relèvement « complet » et « son », avec priorité du dernier motif ;
  - exclusion du chocolat blanc et de ses descendants ;
  - priorité de la table faible et des `offId` connus ;
  - identifiant présent dans deux familles ;
  - racine absente ;
  - motif invalide.
- **Matcher** :
  - `en:wheat-flour` → modéré ; `en:whole-wheat-flour` → élevé ; `en:durum-wheat-semolina` →
    modéré ;
  - `en:chocolate-chunk` à 15 % → très élevé ; à 5 % → élevé, rétrogradé ;
  - `en:cocoa-butter` et `en:white-chocolate` → faible ou non à risque ;
  - texte : « Farine de blé complet » → élevé (pas modéré) ; « farine de blé » → modéré ;
    « blé » seul → rien ;
  - texte : « chocolat blanc », « white chocolate », « witte chocolade », « beurre de cacao »,
    « cocoa butter » → aucune alerte ; « pépites de chocolat » → très élevé.
- **`ResultView`** :
  - la ligne « Niveau minimum » apparaît pour « modéré » et « élevé » avec des inconnus ;
  - elle n'apparaît pas pour « très élevé », ni sans inconnus.
- **Produits réels** : les attendus des données de référence sont mis à jour.
  - Edelbitter 90 % : « non déterminable » → **très élevé** (pâte de cacao reconnue) ;
  - Lotus Biscoff : « non déterminable » → **modéré**.

### 4.2 Mesure

L'audit (`OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts --reporter=default`)
est relancé sur l'échantillon en cache.

### 4.3 Critères de réussite

1. `npm test`, `tsc -b` et `npm run lint` passent.
2. Au plus **46** « non déterminable » sur 200 (76 aujourd'hui). La mesure avec le blé seul donnait
   46, et le chocolat ne peut que réduire ce nombre.
3. L'utilisateur a relu :
   - le rapport du générateur : répartition complet/raffiné et exclusions ;
   - la liste des produits qui changent de niveau, notamment ceux qui montent à « très élevé » grâce
     au chocolat.

## Risques et limites assumés

- **Codage OFF imprécis** : « Whole Wheat Penne Rigate » est codé `en:durum-wheat`, sans
  « complet ». Il sera donc classé raffiné, « modéré ».
- **Deux logiques de classement** coexistent : le blé est classé par 100 g, le reste par portion
  (point ouvert).
- **Un minimum reste un minimum** : la mention le dit explicitement, mais le badge seul peut encore
  être lu trop vite.
- **Variabilité réelle du blé** : la teneur varie du simple au double selon l'espèce, la variété et
  la cuisson (Massey 2007). Les paliers donnent un ordre de grandeur, pas une valeur précise.
