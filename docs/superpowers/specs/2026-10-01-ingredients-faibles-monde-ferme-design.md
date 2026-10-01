# Ingrédients faibles en monde fermé et inconnus négligeables — design

## Contexte

Un audit du 2026-09-30 a rejoué la logique de `ResultView` sur les 200
produits belges les plus scannés d'Open Food Facts (OFF). Résultat :
**113/200 (57 %) sortent « non déterminable »**, alors que tous ont une
liste d'ingrédients.

Cause principale : `KNOWN_INGREDIENTS` ne contient que des ingrédients à
risque (élevé/très élevé, plus le sésame modéré). Quand aucun n'est trouvé,
`aggregateResult` renvoie « non déterminable ». L'app ne peut donc jamais
conclure « faible » pour de l'eau minérale, du lait, un camembert, un soda,
de l'huile d'olive… alors que `oxalate-database.json` contient 289 entrées
« faible » inutilisées.

Ce document couvre les **étapes 4 et 5** de cet audit :

- **Étape 4** : reconnaître les ingrédients pauvres en oxalate, et conclure
  « faible » quand tous les ingrédients significatifs du produit sont
  reconnus faibles (raisonnement en « monde fermé »).
- **Étape 5** : ignorer les ingrédients inconnus présents à moins de 2 %.

Un prototype hors dépôt, appliqué au même échantillon avec exactement les
règles de ce document (familles du volet 1.1, règles 1.2, additifs 1.4,
garde-fou 2.2), mesure **57 % → 41 %** de « non déterminable » (82/200).
Les inconnus restants sont surtout du blé, de l'avoine, du chocolat et du
cacao, hors périmètre ici. Ce gain suppose que la reconnaissance des
ingrédients faibles hérite de la hiérarchie des ingrédients d'OFF. Une liste d'identifiants tapée à la main
(~80) ne donnait aucun gain (58 %), car OFF renvoie des identifiants très
spécifiques (`en:skimmed-milk-powder`, `en:sea-salt`, `en:cow-s-milk`…).

## Décisions prises en brainstorming

1. **Règle stricte partout (option A).** « Faible » signifie toujours : tous
   les ingrédients présents à 2 % ou plus sont reconnus, et aucun ne dépasse
   « faible ». Cela s'applique aussi au cas existant où un ingrédient à
   risque est rétrogradé par sa proportion. Dans l'échantillon, 10 des 16
   « faible » actuels sont douteux : une trace de cannelle ou de cacao
   masque 30 à 60 % de blé ou d'avoine non reconnus (Lotus Biscoff,
   Bastogne, Cookie Crisp, Crunchy Oats…). Ces produits passeront
   « non déterminable ». C'est un changement voulu : un faux « faible » est
   plus dangereux pour un régime pauvre en oxalate qu'un
   « non déterminable ».
2. **Périmètre : ingrédients structurés OFF seulement.** Le texte brut
   (saisie manuelle, OCR, USDA) garde son comportement actuel et ne peut
   toujours pas produire « faible ». Son découpage en ingrédients fera
   l'objet d'un chantier séparé.
3. **Affichage** : une phrase de justification pour « faible », et la liste
   des ingrédients non reconnus pour « non déterminable ».
4. **Approche : table générée par script et versionnée** dans le dépôt, à
   partir de la hiérarchie des ingrédients OFF.

## Non-objectifs

- Pas de découpage du texte brut (`matchIngredients` inchangée).
- Pas de lecture des sous-ingrédients imbriqués (étape 2 de l'audit).
- Pas d'héritage de la hiérarchie pour les ingrédients **à risque**
  (étape 3) : seuls les ingrédients faibles héritent. Le générateur sera
  conçu pour pouvoir être étendu à l'étape 3 plus tard.
- Pas de céréales, légumineuses ni fruits à coque dans les familles faibles.
  La décision sur le blé reste ouverte ; le riz est exclu car la farine de
  riz est « élevé » selon OHF.
- Pas de repli sur la catégorie du produit (étape 7).
- Pas d'affichage de la liste des inconnus pour les niveaux modéré, élevé
  ou très élevé.
- Pas de modification de `IngredientsOcrView`, `HistoryView`,
  `FoodSearchView`, ni du schéma PocketBase.
- Pas de reconstruction ni de déploiement web/APK (fait par l'utilisateur).

## Volet 1 — Données

### 1.1 Source éditée à la main : `scripts/low-oxalate-roots.json`

Trois sections :

```jsonc
{
  "roots": [
    // Familles dont tous les descendants sont réputés faibles.
    { "id": "en:milk", "kind": "ohf", "justification": "Milk, Cows or Goats, All types" },
    { "id": "en:salt", "kind": "neutre", "justification": "minéral, pas de tissu végétal" },
    { "id": "en:oil-and-fat", "kind": "forme-raffinée", "justification": "Oils, All types nut, vegetable and seed oils" }
  ],
  "forceLow": [
    // Identifiants (et leurs descendants) faibles MALGRÉ un ancêtre à risque.
    { "id": "en:orange-juice", "justification": "Juice, Orange, (OHF faible) — l'orange entière est élevé" },
    { "id": "en:cocoa-butter", "justification": "Candy, White Chocolate (OHF faible) — graisse extraite du cacao" }
  ],
  "exclude": [
    // Identifiants (et leurs descendants) à retirer des familles faibles,
    // pour corriger une bizarrerie de la hiérarchie OFF.
    { "id": "en:…", "justification": "…" }
  ]
}
```

Types de famille (`kind`) :

- **`ohf`** : justifiée par une entrée « faible » de
  `oxalate-database.json`, citée textuellement dans `justification`.
- **`neutre`** : ingrédient sans tissu végétal, donc sans oxalate (eau,
  sel, minéraux, vitamines, levures, ferments, présure, noms de catégories
  d'additifs).
- **`forme-raffinée`** : extrait purifié où l'oxalate ne passe pas (huiles,
  graisses, sucres, sirops, amidons, arômes). Justifié par les entrées OHF
  correspondantes : « Oils, All types… », « Sugar, Cane, White »,
  « Corn, Cornstarch », « Flour, Potato Starch », « Candy, White
  Chocolate ».

Liste initiale des familles. Les identifiants exacts sont validés par le
générateur, qui échoue sur un identifiant absent de la hiérarchie :

| Type | Familles |
|---|---|
| `ohf` | produits laitiers (`en:dairy`), protéines de lait, œuf, poisson ; pomme, poire, raisin, citron, citron vert, ananas, pêche, prune, cerise, melon ; jus de pomme, de citron, de pamplemousse ; oignon, ail, échalote, chou, chou-fleur, champignon, laitue, petit pois, brocoli ; café, vinaigre, miel, extrait de vanille |
| `neutre` | eau, sel, minéraux, vitamines, levure, ferments, ferments lactiques, présure, alcool, caféine ; émulsifiant, acidifiant, colorant, épaississant, stabilisant, conservateur, antioxydant, correcteur d'acidité, poudre à lever, édulcorant, gélifiant ; codes E (1.4) |
| `forme-raffinée` | huiles et graisses (`en:oil-and-fat`), sucres ajoutés (`en:added-sugar`), glucose, fructose, dextrose, lactose, maltodextrine, amidon, arôme |

**La viande n'est pas une famille faible.** L'entrée OHF « Meats and
Poultry, Variety including sausage and liver » est classée **modéré**
(5 mg par portion). Les produits carnés restent donc « non déterminable »
tant que la table ne gère que le niveau faible.

On prend les familles larges (`en:dairy`, `en:oil-and-fat`,
`en:added-sugar`) parce que la hiérarchie OFF est irrégulière. Par exemple,
le lait écrémé en poudre et la matière grasse laitière sont rangés
directement sous `en:dairy`, pas sous `en:milk`. L'huile de colza est sous
`en:vegetable-oil-and-fat`, pas sous `en:vegetable-oil`. Le sirop d'agave
est sous `en:added-sugar`, pas sous `en:sugar`. Les descendants à risque de
ces familles sont écartés par la règle 1.2. Les bizarreries restantes
(ex. `de:reisdrinkpulver` sous `en:added-sugar`) sont traitées à la
relecture du rapport, via `exclude`.

Volontairement **absents** : maïs (la farine et la semoule de maïs sont
« élevé »), riz, céréales, légumineuses, fruits à coque, orange (élevé),
noix de coco.

Liste initiale de `forceLow` :

- jus d'orange (OHF « Juice, Orange, » faible), car `en:orange` est un
  identifiant à risque ;
- beurre de cacao (« Candy, White Chocolate »), car il est rangé sous
  `en:cocoa`.

Les jus faibles dont le fruit n'est pas à risque n'ont pas besoin de
`forceLow`. Ils sont soit déjà sous une famille faible (jus de pomme sous
`en:apple`, jus de citron sous `en:lemon`), soit ajoutés comme famille
`ohf` (`en:grapefruit-juice`, « Juice, Grapefruit »). L'amidon de blé
(`en:wheat-starch`) est rangé sous `en:starch` seulement, sans `en:wheat` :
pas besoin de `forceLow`.

Liste initiale de `exclude`, issue de la relecture des descendants pendant
la préparation du plan :

- masse de cacao rangée sous le beurre de cacao
  (`en:cocoa-mass-and-cocoa-butter` et sa variante bio) ;
- raisins secs et pépins de raisin, absents d'OHF (`en:raisin`,
  `en:sultana`, `en:grape-seed`, `fr:farine-de-pepins-de-raisin`) ;
- jus de raisin rouge, « modéré » selon OHF (`en:red-grape-juice`,
  `en:concord-grape-juice`, `en:muscadine-grape-juice`) ;
- groseilles rangées sous le raisin (`en:raw-red-and-whitecurrants`) ;
- pois mange-tout, « très élevé » selon OHF (`en:sugar-snap-peas`,
  `en:snow-pea`, `en:edible-podded-pea`), et gesse (`en:grass-pea`) ;
- composés qui contiennent un aliment à risque sans le déclarer comme
  parent : `en:cinnamon-apple`, `en:candied-lemon-zest`,
  `en:chocolate-liqueur`, `en:milk-chocolate-with-sweetener`,
  `en:red-yeast-rice`, `en:sugar-beet-syrup` ;
- `en:e162` (1.4).

D'autres entrées peuvent s'ajouter à la relecture du rapport du générateur
(voir 1.3).

### 1.2 Règles de calcul

Les règles s'appliquent dans cet ordre :

1. **`exclude` l'emporte sur tout** : un identifiant de `exclude`, ou l'un
   de ses descendants, n'est jamais faible. Exemple :
   `en:cocoa-mass-and-cocoa-butter` est rangé sous `en:cocoa-butter`
   (`forceLow`) mais contient de la masse de cacao.
2. **`forceLow`** : un descendant (ou lui-même) d'un identifiant `F` de
   `forceLow` est faible si ses seuls ancêtres à risque sont aussi des
   ancêtres de `F`, et s'il n'est pas lui-même un `offId` à risque.
   `forceLow` ne pardonne donc que les ancêtres à risque au-dessus de `F`.
   Par exemple, un « jus d'orange et carotte » rangé sous `en:orange-juice`
   resterait exclu à cause de la carotte.
3. **Familles (`roots`)** : un descendant (ou lui-même) d'une famille est
   faible si ni lui ni aucun de ses ancêtres n'est un identifiant à risque
   (`offId` d'une entrée de `KNOWN_INGREDIENTS`).

**L'ingrédient à risque l'emporte par défaut.** Une règle générale « la
forme raffinée l'emporte » a été écartée : dans la hiérarchie OFF,
`en:caramelised-peanut` est rangée sous `en:sugar`, et serait sortie faible
alors que la cacahuète est très élevé. Rien ne la distingue structurellement
de `en:cocoa-butter` (sous `en:cocoa` et `en:vegetable-fat`). Les formes
raffinées légitimes passent donc toutes par `forceLow`, avec justification.

### 1.3 Générateur

- `scripts/low-oxalate-generator.ts` : logique pure et testable.
  `computeLowOxalateIds(taxonomy, rootsFile, riskyOffIds)` renvoie la table
  `identifiant → famille` et un rapport (nombre de descendants par famille,
  identifiants écartés par conflit avec un ingrédient à risque, identifiants
  écartés par `exclude`). Le parcours tolère les cycles.
- `scripts/generate-low-oxalate-ingredients.ts` : point d'entrée avec les
  entrées-sorties.
  - Télécharge `https://static.openfoodfacts.org/data/taxonomies/ingredients.json`
    avec un User-Agent identifiant l'app et le dépôt
    (`oxalapp/<version> (+https://github.com/scriptor-pro/oxalapp)`),
    sans adresse e-mail personnelle.
  - Échoue si une famille, un `forceLow` ou un `exclude` n'existe pas dans
    la hiérarchie.
  - Écrit `src/data/low-oxalate-ingredients.json` et affiche le rapport.
  - Lancé par `npm run generate:low-oxalate`, soit
    `node scripts/generate-low-oxalate-ingredients.ts` (Node 24 exécute le
    TypeScript directement ; le projet a déjà `erasableSyntaxOnly` et
    `allowImportingTsExtensions`).
- Les identifiants à risque viennent de `KNOWN_INGREDIENTS`. Le générateur
  ne doit pas importer `oxalate-matcher.ts`, qui importera le JSON généré :
  sinon, la première génération échouerait, et Node ne sait pas importer du
  JSON sans attribut d'import. D'où la réorganisation du volet 2.1.

Format de `src/data/low-oxalate-ingredients.json` :

```jsonc
{
  "source": {
    "name": "Open Food Facts — taxonomie des ingrédients",
    "url": "https://static.openfoodfacts.org/data/taxonomies/ingredients.json",
    "downloadedAt": "2026-10-01T…Z",
    "sha256": "…",
    "license": "ODbL 1.0 (base) / DbCL 1.0 (contenu) — © contributeurs Open Food Facts",
    "generator": "scripts/generate-low-oxalate-ingredients.ts"
  },
  "families": {
    "en:dairy": { "kind": "ohf", "justification": "…" },
    "en:cocoa-butter": { "kind": "exception", "justification": "…" },
    "additifs": { "kind": "neutre", "justification": "…" }
  },
  "ids": { "en:skimmed-milk-powder": "en:dairy", "en:e330": "additifs" }
}
```

`ids` associe chaque identifiant faible à sa famille d'origine : une
famille de `roots`, une entrée `forceLow` (type `exception`), ou la
famille synthétique `additifs` (1.4). Les clés sont triées pour que les
diffs restent lisibles.

Taille attendue : ~3 000 entrées (mesuré par le prototype), environ
130 Ko avant compression et 25 Ko environ après.

### 1.4 Additifs

La hiérarchie OFF contient environ 700 codes E (`en:e330`, `en:e500ii`,
`en:e160c`…), avec des descendants qui ne s'écrivent pas en code E (par
exemple `en:soya-lecithin` sous `en:e322i`, lui-même sous `en:e322`). Le
générateur ajoute donc automatiquement chaque identifiant qui correspond à
`^en:e\d{3,4}[a-z]?(?:i{1,3}|iv|v|vi)?$` comme famille `neutre`. Ces
identifiants et leurs descendants sont regroupés sous la famille
synthétique `additifs`.

Les règles 1.2 s'appliquent normalement. `en:e162` (rouge de betterave,
extrait d'un aliment très riche en oxalate) est dans `exclude`. Les
colorants issus de la carotte noire (`en:black-carrot-extract`…) sont
écartés par leur ancêtre à risque `en:carrot`.

Au moment du scan, il n'y a **pas** d'expression régulière : la table
générée est la seule source. Un nouveau code E inconnu de la table
retombe en « inconnu », sans danger.

### 1.5 Licence

OFF publie ses données sous ODbL 1.0 (base) et DbCL 1.0 (contenu), avec
attribution et partage à l'identique. Aucune mention de licence propre à la
hiérarchie des ingrédients n'a été trouvée : elle est traitée comme une
donnée OFF. `low-oxalate-ingredients.json` est une base dérivée, embarquée
dans l'APK. Il porte donc l'attribution et la licence ODbL dans son en-tête.
**Point à valider par l'utilisateur** (la spec du chantier en 8 phases, §36,
demande une validation pour tout changement de licence).

## Volet 2 — Logique du matcher

### 2.1 Réorganisation préalable

`KNOWN_INGREDIENTS` (~340 lignes de données) et ses types (`OxalateLevel`,
`KnownIngredient`) sont déplacés de `src/lib/oxalate-matcher.ts` vers
`src/data/known-ingredients.ts`. Ce nouveau fichier n'importe rien et ne
contient que des données et des types. `oxalate-matcher.ts` les réexporte :
`food-search.ts` et les tests existants n'ont pas à changer leurs imports.
Aucun changement de contenu.

### 2.2 `matchStructuredIngredients`

Pour chaque ingrédient structuré :

1. **Nettoyage du pourcentage** : un `percentEstimate` hors de [0, 100]
   devient `null`. Cela corrige un bug de données réel (« Cranberries »,
   `percent_estimate` à −359 %, aujourd'hui traité comme « moins de 2 % »).
2. **Classement**, dans cet ordre :
   1. `offId` d'un ingrédient à risque connu : comportement actuel, avec la
      rétrogradation selon la proportion (`degradeByProportion`).
   2. `offId` présent dans `low-oxalate-ingredients.json` (codes E
      compris, 1.4) : **reconnu faible**.
   3. Mots-clés à risque dans le texte : comportement actuel.
   4. Sinon : **inconnu**.

   L'identifiant faible passe **avant** les mots-clés du texte : c'est
   l'identifiant OFF qui fait foi, comme le principe déjà posé dans le code.
   Effets voulus : `en:cocoa-butter` (« beurre de cacao ») devient faible au
   lieu de déclencher le mot-clé « cacao » ; « arôme naturel d'amande »
   (`en:natural-almond-flavouring`, sous `en:flavouring`) et « huile
   d'amande » (`en:almond-oil`, sous `en:vegetable-oil`) ne déclenchent plus
   d'alerte. Ces trois rattachements ont été vérifiés dans la hiérarchie
   OFF. La pâte de cacao (`en:cocoa-paste`, absente des familles faibles)
   déclenche toujours « cacao » par le texte.
3. **Inconnus négligeables (étape 5)** : un inconnu dont le pourcentage
   nettoyé est dans [0, 2) est ignoré, et son pourcentage s'ajoute au
   **total ignoré**. Un inconnu à 2 % ou plus, ou de pourcentage `null`,
   est un **inconnu significatif**.
4. **Garde-fou** : si le total ignoré dépasse 5 %, aucun inconnu n'est
   ignoré. Ils deviennent tous significatifs, ce qui empêche un « faible ».
   Mesuré sur l'échantillon : sans effet sur le taux, aucun produit ne
   dépasse le seuil.

### 2.3 Agrégation (règle stricte)

- Si au moins un ingrédient à risque reste au-dessus de « faible » après
  rétrogradation, le niveau est **le plus élevé trouvé**, comme aujourd'hui.
  Les inconnus ne pourraient que l'augmenter : c'est un minimum.
- Sinon, le niveau est **« faible »** si :
  - au moins un ingrédient est reconnu (faible, ou à risque rétrogradé à
    faible) ;
  - **et** il n'y a aucun inconnu significatif ;
  - **et** le garde-fou n'est pas déclenché.
- Sinon : **« non déterminable »**.

### 2.4 Interface

```ts
export interface UnknownIngredient {
  text: string;                    // texte de l'étiquette, langue du produit
  offId: string | null;
  percentEstimate: number | null;  // nettoyé (null si hors [0, 100])
}

export interface MatchResult {
  level: MatchLevel;
  matchedIngredients: MatchedIngredient[];  // inchangé : ingrédients à risque seulement
  unknownIngredients: UnknownIngredient[];  // nouveau : inconnus significatifs
}
```

- Les ingrédients reconnus faibles ne sont **pas** ajoutés à
  `matchedIngredients` : `ResultView` les afficherait comme « à risque ».
- `matchIngredients` (texte brut) renvoie toujours `unknownIngredients: []`.
- `unknownIngredients` est rempli quel que soit le niveau, mais n'est
  affiché que pour « non déterminable » (volet 3).

## Volet 3 — Affichage (`src/components/ResultView.tsx`)

### 3.1 `categorizeFailure`

`ScanFailureReason` devient
`"no-ingredients" | "unknown-ingredients" | "no-match"`. Les motifs sont
évalués dans cet ordre, uniquement si le niveau est « non déterminable » :

1. `no-ingredients` : `ingredientsText` vide. Inchangé (formulaire manuel,
   OCR, photo).
2. `unknown-ingredients` : `result.unknownIngredients` non vide.
3. `no-match` : sinon. Message inchangé (« Aucun ingrédient à risque connu
   détecté dans la liste fournie. »), toujours utilisé par le texte brut.

### 3.2 Messages

- **`unknown-ingredients`** : « Ingrédients non reconnus : farine de blé
  (50 %), arôme de malt. »
  - `text` de chaque ingrédient, dans l'ordre de la liste ;
  - pourcentage arrondi à l'entier, ou omis si `null` ;
  - même format numérique que l'affichage existant des ingrédients à risque.
- **Justification de « faible »** : « Tous les ingrédients présents à 2 %
  ou plus sont reconnus comme pauvres en oxalate. », affichée quand le
  niveau est « faible ». Le texte brut ne pouvant pas produire « faible »,
  cette phrase est toujours exacte.
- **Avertissement** : la phrase « Ce niveau reflète la présence d'un
  ingrédient connu pour sa teneur en oxalate, pas une quantité mesurée dans
  ce produit précis. » devient « Ce niveau est déduit de la liste
  d'ingrédients, pas d'une quantité mesurée dans ce produit précis. ». La
  première phrase (« Estimation indicative — … ») est inchangée.
  `IngredientsOcrView` garde son texte actuel, qui reste exact pour le
  texte brut.

## Volet 4 — Tests, mesure, critères de réussite

### 4.1 Tests automatiques (`npm test`)

- **`scripts/low-oxalate-generator.test.ts`**, sur une mini-hiérarchie
  fictive : parcours des descendants, exclusion sous un identifiant à
  risque, `forceLow` (beurre de cacao sous cacao), `exclude`, cycle dans la
  hiérarchie, échec sur un identifiant de famille absent.
- **`src/lib/oxalate-matcher.test.ts`** :
  - tous les ingrédients faibles donnent « faible » ;
  - un inconnu à 2 % ou plus donne « non déterminable », avec
    `unknownIngredients` renseigné ;
  - un inconnu à 1,5 % est ignoré et donne « faible » ;
  - plusieurs inconnus sous 2 % totalisant plus de 5 % donnent
    « non déterminable » ;
  - un inconnu de pourcentage `null` donne « non déterminable » ;
  - un ingrédient « élevé » avec un inconnu à 40 % donne « élevé » ;
  - noisette à 0,8 % avec un inconnu à 60 % donne « non déterminable »
    (changement voulu de la règle A) ;
  - noisette à 0,8 % avec seulement des faibles donne « faible » ;
  - un `percentEstimate` à −359 est traité comme `null` ;
  - `en:cocoa-butter` donne « faible » ; « pâte de cacao » sans identifiant
    connu donne « très élevé » ;
  - les codes E de la table sont faibles, `en:e162` reste inconnu ;
  - `matchIngredients` renvoie `unknownIngredients: []` et garde son
    comportement.

  Les tests existants dont l'attendu change à cause de la règle stricte
  sont modifiés un par un, chacun justifié dans le message de commit.
- **Produits réels** : 5 à 6 listes d'ingrédients structurées réelles (par
  exemple Orangina, Lotus Biscoff, Coca-Cola, un chocolat blanc, un
  camembert), stockées comme données de test dans
  `src/lib/__fixtures__/off-products.json`, avec l'attribution OFF (ODbL),
  et leur niveau attendu.
- **`src/components/ResultView.test.tsx`** : nouveau motif de
  `categorizeFailure`, message des inconnus, justification de « faible »,
  nouvel avertissement.

### 4.2 Outil de mesure (lancé à la demande, hors `npm test`)

`scripts/audit-non-determinable.test.ts` (`// @vitest-environment node`) :
un test Vitest désactivé sauf si `OXA_AUDIT=1`. Commande :
`OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts`.

- Récupère les 200 produits belges les plus scannés via l'API de recherche
  OFF, à raison de 100 produits par page, en espaçant les requêtes (limite
  OFF de 10 recherches par minute), avec nouvelles tentatives sur les
  erreurs 503. Le User-Agent est le même que celui du générateur.
- Met l'échantillon en cache dans `.cache/off-audit-sample.json` (ignoré
  par git) et le réutilise ensuite, pour comparer avant et après sur les
  mêmes produits.
- Rejoue la logique de `ResultView` : ingrédients structurés si présents,
  texte brut sinon.
- Affiche le taux de « non déterminable », la répartition par niveau et les
  identifiants inconnus les plus fréquents.
- Enregistre le niveau de chaque produit dans
  `.cache/off-audit-baseline.json` au premier lancement. Aux lancements
  suivants, affiche **chaque produit dont le niveau change**, avec l'ancien
  et le nouveau niveau.

Cet outil est écrit **en premier**, et lancé une fois avant toute
modification du matcher pour figer la mesure de référence.

### 4.3 Critères de réussite

1. `npm test`, `tsc -b` (utilisé par `scripts/build-apk.sh`) et `npm run
   lint` passent.
2. Sur l'échantillon en cache, le taux de « non déterminable » passe
   d'environ 57 % à **45 % au plus**. Le prototype mesure 42 % ; la marge
   couvre les écarts entre prototype et implémentation, et l'évolution de
   l'échantillon OFF.
3. L'utilisateur a relu la liste des produits qui changent de niveau. Toute
   baisse de niveau s'explique par l'une de ces causes :
   - suppression d'un faux « faible » ;
   - beurre de cacao ;
   - arôme ou huile issus d'un ingrédient à risque.
4. L'utilisateur a relu le rapport du générateur et le premier
   `low-oxalate-ingredients.json`. En particulier : les identifiants
   écartés par conflit, et un échantillon des descendants de chaque
   famille.

## Risques et limites assumés

- **Bizarreries de la hiérarchie OFF.** Un descendant mal rangé peut être
  déclaré faible à tort. Garde-fous : un ancêtre à risque l'emporte
  toujours, le rapport du générateur est relu, et `exclude` permet de
  corriger.
- **Fraîcheur.** Les identifiants ajoutés à OFF après la génération sont
  inconnus jusqu'à la régénération suivante. Sans danger : ils retombent
  en « non déterminable ».
- **`percent_estimate` est une estimation OFF**, pas une valeur déclarée.
  `percent_max`, plus prudent, n'est fourni que pour 107 ingrédients sur
  1 708 dans l'échantillon : inutilisable. Le garde-fou de 5 % limite le
  risque.
- **Régression visible** : une dizaine de produits populaires aujourd'hui
  « faible » (biscuits, céréales) passent « non déterminable » jusqu'à la
  décision sur le blé et l'avoine. L'historique des scans garde l'ancien
  niveau.
- **Échantillon** : 200 produits populaires. Les produits rares, ou sans
  ingrédients structurés, sont sous-représentés.
