# Pourcentages déclarés sur l'étiquette — design

## Contexte

L'app ne lit, pour chaque ingrédient de premier niveau d'Open Food Facts, que la proportion
**estimée** par OFF (`percent_estimate`). Elle ignore le pourcentage **déclaré** sur l'étiquette,
qu'OFF conserve pourtant dans le champ `percent`.

L'estimation peut être très fausse quand OFF découpe mal la liste d'ingrédients. Cas déclencheur :
Véritable Petit Écolier Chocolat au Lait (`7622210421968`). L'étiquette écrit ses sous-ingrédients
après deux-points (« PETIT BEURRE 52 % : Farine de BLE 68 %, sucre, BEURRE concentré 14 %, … ») au
lieu de parenthèses. OFF ne range que la farine sous le petit-beurre, remonte le reste au premier
niveau, et estime le chocolat au lait, déclaré à 48 %, à **1,07 %**. Le chocolat est reconnu, mais
la règle de proportion le ramène à « faible » : le produit sort « modéré » au lieu de
« très élevé ». La composition 52 % biscuit / 48 % chocolat est confirmée par
https://fr.wikipedia.org/wiki/Petit_%C3%A9colier.

Mesure sur l'échantillon d'audit (200 produits, 2026-10-01) :

- 123 produits déclarent au moins un pourcentage au premier niveau ;
- 4 produits ont des pourcentages déclarés dont la somme dépasse 100 % : un pourcentage relatif à
  un parent est remonté au premier niveau (« BEURRE concentré 14 % » du petit-beurre, par exemple).

## Décision de l'utilisateur

Trois approches ont été comparées (2026-10-01) :

| Approche | Changements | Non déterminables | Défaut principal |
|---|---|---|---|
| 1. Le déclaré remplace l'estimation | 5 | 41 | fait baisser « soja & amande » (amande déclarée 1,5 %, estimée 3,5 %) |
| 2. Déclaré seulement si la somme ≤ 100 % | 2 | 40 | rate Petit Écolier (somme 114 %) et Moelleux chocolat |
| **3. Le plus grand des deux** | **4** | **40** | peut surestimer un ingrédient |

**Retenue : l'approche 3.** L'erreur va toujours dans le sens prudent, ce qui convient à une app
qui aide à éviter l'oxalate : mieux vaut alerter un peu trop que pas assez. Un pourcentage relatif
remonté par erreur ne peut que surestimer un ingrédient, jamais le minimiser.

Ce chantier rend les niveaux plus justes ; il ne réduit pas le nombre de « non déterminable »,
qui dépend des ingrédients non reconnus (avoine en tête, chantier distinct).

## 1. Données

`StructuredIngredient` (`src/lib/off-client.ts`) reçoit un champ optionnel :

```ts
  // Pourcentage déclaré sur l'étiquette (champ OFF `percent`), quand il
  // existe. Premier niveau seulement, comme percentEstimate.
  percentDeclared?: number | null;
```

Il est rempli à partir de `percent` dans les trois lecteurs des ingrédients OFF :

- `src/lib/off-client.ts` (l'app) ;
- `scripts/audit-non-determinable.test.ts` (l'audit) ;
- `src/lib/oxalate-matcher.fixtures.test.ts` (les produits réels figés).

`src/lib/__fixtures__/off-products.json` n'a pas le champ `percent`. On y ajoute Petit Écolier
(`7622210421968`), extrait d'OFF avec `id`, `text`, `percent_estimate` et `percent`, ingrédients de
premier niveau uniquement. Les autres produits du fichier restent tels quels : sans `percent`, leur
résultat ne change pas.

## 2. Règle de calcul

Dans `matchStructuredIngredients` (`src/lib/oxalate-matcher.ts`), la proportion retenue pour un
ingrédient est :

1. chaque valeur, déclarée et estimée, passe d'abord par `sanitizePercent` (existant) : une valeur
   non finie, négative ou supérieure à 100 devient `null` ;
2. si les deux valeurs sont présentes, on retient la plus grande ;
3. si une seule est présente, on la retient ;
4. si aucune, la proportion est inconnue (`null`), comme aujourd'hui.

La proportion retenue remplace l'estimation partout où celle-ci servait : abaissement d'un
ingrédient à risque peu présent (`degradeByProportion`), seuils des inconnus (2 % par ingrédient,
5 % au total) et règle A.

Le champ de sortie `percentEstimate` de `MatchedIngredient` et `UnknownIngredient` garde son nom.
Un commentaire précise qu'il contient la proportion retenue (le plus grand du déclaré et de
l'estimé). Le renommer toucherait de nombreux fichiers pour un gain faible.

## 3. Affichage

Aucun changement d'interface. `ResultView` affiche la proportion retenue :
« Chocolat au LAIT (48%) » pour Petit Écolier.

## 4. Hors du chantier

- Les sous-ingrédients (la farine dans le petit-beurre) : l'app reste au premier niveau.
- La conversion des pourcentages relatifs à un parent en pourcentages du produit.
- L'OCR, la saisie manuelle et USDA : ils n'ont pas de pourcentage déclaré structuré.

## 5. Tests et critère de réussite

Tests unitaires de `matchStructuredIngredients` :

- déclaré plus grand que l'estimation : il l'emporte. Petit Écolier simplifié (petit-beurre 52 %
  déclaré / 53,5 % estimé, chocolat au lait 48 % déclaré / 1,07 % estimé, sucre 16,47 % estimé)
  → « très élevé », et le chocolat est affiché à 48 % ;
- déclaré plus petit que l'estimation : l'estimation est gardée (amande 1,5 % déclarée, 3,5 %
  estimée → l'amande garde 3,5 %) ;
- déclaré seul, sans estimation : il est retenu ;
- déclaré absurde (150) : ignoré, l'estimation est retenue ;
- un inconnu estimé à 1 % mais déclaré à 10 % devient significatif : le produit est
  « non déterminable ».

Test de `getProductByBarcode` : le champ `percent` d'OFF est recopié dans `percentDeclared`.

Test sur produits réels : Petit Écolier → « très élevé », sans inconnu significatif.

Audit (`OXA_AUDIT=1`) comparé à la référence de `feature/ble-chocolat` : exactement 4 produits
changent, tous vers le haut — Véritable Petit Écolier Chocolat au Lait (modéré → très élevé),
Moelleux chocolat (modéré → élevé), Cookie cacao pépites Sans Sucre (élevé → très élevé),
Cracotte Chocolat (élevé → très élevé) — et le nombre de « non déterminable » reste à 40/200.

## Branche

`feature/pourcentages-declares`, créée à partir de `feature/ble-chocolat` (non fusionnée) : le
résultat de Petit Écolier dépend de la famille petit-beurre ajoutée sur cette branche.
