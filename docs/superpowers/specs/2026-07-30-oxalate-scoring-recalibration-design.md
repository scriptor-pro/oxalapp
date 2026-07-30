# oxalapp — Design recalibration du mécanisme de score oxalate

Date : 2026-07-30

## Contexte

Le mécanisme de score actuel (`src/lib/oxalate-matcher.ts` +
`src/data/oxalate-database.json`) utilise des seuils faible/modéré/
élevé/très élevé dérivés de la base OHF (Oxalosis & Hyperoxaluria
Foundation), sans qu'ils correspondent explicitement à une classification
publiée. Une revue de la littérature à comité de lecture a été menée pour
vérifier la pertinence de ces seuils avant d'ajouter de nouvelles
fonctionnalités s'appuyant dessus.

## Constats issus de la littérature

**Classification clinique de référence.** L'étude évaluant des chatbots
IA sur l'estimation d'oxalate alimentaire (Gowda et al., PMC10817681,
2024) utilise la classification du *Mayo Clinic Oxalate Diet Handbook*
sur 539 aliments : **faible <5 mg/portion, modéré 5-8 mg/portion, élevé
>8 mg/portion**. C'est un référentiel plus strict et plus cité
cliniquement que les seuils actuellement dérivés d'OHF dans l'app.

**Variabilité des valeurs mesurées.** La revue méthodologique de Nazzal
et al. (PMC10486698, 2023) sur les méthodes d'extraction et de dosage de
l'oxalate documente une variabilité substantielle des valeurs publiées,
attribuable à la méthode analytique (HPLC vs enzymatique vs
spectrophotométrie) et à des facteurs agronomiques (variété, saison,
conditions de culture, cuisson). Exemple cité : l'épinard varie de 615 à
1093 mg/100g selon la saison. `oxalate-database.json` ne stocke
aujourd'hui qu'une valeur ponctuelle par aliment, sans refléter cette
incertitude.

**Absence de méthode publiée pour les produits transformés.** Aucune des
sources consultées ne modélise l'estimation d'un produit transformé à
partir de sa liste d'ingrédients — le sujet central d'oxalapp. Le principe
actuel de `oxalate-matcher.ts` (présence d'un ingrédient à risque → niveau
d'alerte au niveau de cet ingrédient) n'est donc pas une approximation
d'une méthode existante : c'est un choix de design propre au projet, à
assumer comme tel dans l'UI plutôt qu'à présenter comme une mesure.

## Décisions

### 1. Recalibrage des seuils

Nouveaux seuils, appliqués à `oxalatePerServing` (déjà présent dans
chaque entrée de `oxalate-database.json`, cohérent avec l'usage clinique
qui raisonne en mg par portion consommée, pas en mg/100g) :

| Niveau       | Seuil (mg/portion) | Source |
|--------------|---------------------|--------|
| faible       | < 5                 | Mayo Clinic Oxalate Diet Handbook |
| modéré       | 5 – 8               | Mayo Clinic Oxalate Diet Handbook |
| élevé        | 8 – 25              | Mayo Clinic (>8) + seuil interne pour garder 4 paliers |
| très élevé   | > 25                | Choix du projet — isole tôt les aliments les plus à risque (épinard, son de blé, cacao, rhubarbe), objectif de prudence maximale pour les personnes à risque de calculs rénaux |

Le seuil de 25 mg n'est pas issu de la littérature (Mayo Clinic s'arrête à
3 catégories) — c'est un choix assumé du projet pour conserver la
granularité à 4 niveaux déjà utilisée par le reste de l'app
(`OxalateLevel` dans `oxalate-matcher.ts:1`).

### 2. Reclassement de la base de données

Les 737 entrées de `oxalate-database.json` sont reclassées selon
`oxalatePerServing` et les nouveaux seuils ci-dessus. Le champ `level` de
chaque entrée est recalculé ; `avgOxalatePer100g`, `servingSize`,
`servingGrams`, `oxalatePerServing` restent inchangés (seule la valeur
dérivée `level` change).

### 3. `oxalate-matcher.ts` — mise à jour des niveaux, principe inchangé

`KNOWN_INGREDIENTS` garde son principe (mot-clé détecté dans le texte
d'ingrédients → niveau associé, le pire niveau parmi les correspondances
gagne). Les niveaux associés à chaque mot-clé sont mis à jour pour
refléter le reclassement de la base (ex. vérifié : cacao, épinard,
rhubarbe restent "très élevé" avec les nouveaux seuils ; le thé vert
passe de "faible" à "élevé" à 21 mg/portion).

### 4. Nouvelle mention de limite méthodologique dans `ResultView`

Ajout d'un texte, affiché uniquement pour les résultats basés sur un
matching d'ingrédients (pas pour une future recherche d'aliment brut),
à côté de la mention existante ("Estimation indicative — les valeurs
d'oxalate varient selon la variété, le sol, la cuisson, etc.") :

> Ce niveau reflète la présence d'un ingrédient connu pour sa teneur en
> oxalate, pas une quantité mesurée dans ce produit précis.

### 5. Fourchette d'incertitude par aliment (donnée uniquement, pas d'affichage dans ce périmètre)

Pour chaque entrée de `oxalate-database.json`, ajout de deux champs
`oxalatePerServingMin` et `oxalatePerServingMax`, calculés par une marge
forfaitaire de ±35 % autour de `oxalatePerServing` (valeur ronde au
milieu de la variabilité saisonnière documentée pour l'épinard, entre
+18 % et +78 % selon la saison de référence — un choix pragmatique, pas
une valeur mesurée par aliment).

Ce recalibrage se limite à **ajouter ces champs aux données**. Leur
affichage n'a pas de consommateur dans ce périmètre : `ResultView`
affiche aujourd'hui un niveau par *produit* (issu du matching
d'ingrédients), pas un niveau par *aliment individuel* — il n'y a donc
rien à modifier côté UI pour cette section. L'affichage de ces
fourchettes est prévu pour la future fonctionnalité "recherche par nom
d'aliment" (mise en pause, cf. Hors périmètre), qui présentera des
résultats aliment par aliment.

## Hors périmètre

- La fonctionnalité "recherche par nom d'aliment" (mise en pause avant ce
  recalibrage) reste à brainstormer séparément une fois ce document
  validé — elle réutilisera les données recalibrées ici.
- Pas de nouvelle recherche bibliographique par aliment pour obtenir de
  vraies fourchettes mesurées (jugé hors de portée raisonnable).
- Pas de changement du principe de matching par mot-clé dans
  `oxalate-matcher.ts` (aucune méthode publiée alternative identifiée).

## Tests à mettre à jour

`src/lib/oxalate-matcher.test.ts` : les assertions de niveau restent
valides pour cacao/épinard (vérifié ci-dessus, restent "très élevé"
après recalibrage) mais doivent être revérifiées pour chaque mot-clé de
`KNOWN_INGREDIENTS` une fois les nouveaux niveaux calculés.
