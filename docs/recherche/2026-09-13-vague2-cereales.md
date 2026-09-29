# Revue de littérature — Vague 2, lot Céréales/Pains/Pâtes/Farines/Légumineuses/Protéines animales

**Date** : 2026-09-13
**Périmètre réel de ce lot** : les 114 entrées du fichier `lot_cereales.txt` généré pour cette
vague couvrent en réalité les pains, céréales de petit-déjeuner, maïs, farines, grains, pâtes,
riz, **œufs/poisson/viande**, et **toutes les légumineuses** (le découpage en tranches d'index
de la base locale ne correspondait pas exactement aux catégories du PDF OHF — les légumineuses
prévues pour un lot « protéines » séparé sont en fait dans ce fichier). **Point d'attention pour
la suite de la vague 2** : le lot « protéines/noix/légumineuses » risque de traiter à nouveau les
légumineuses en double — à vérifier et dédupliquer lors de la fusion finale des lots.

Méthodologie identique à la vague 1 (voir
`docs/recherche/2026-09-13-revue-litterature-oxalate-vague1.md` section 1 pour le détail complet :
absence de base USDA dédiée, HPLC vs enzymatique, total vs soluble, cru vs cuit/sec, variabilité
intrinsèque).

---

## 1. Céréales, grains, farines

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Sarrasin / buckwheat (farine, 280,0 ; grain, 123,0) | 280,0 / 123,0 | Chai & Liebman 2005 : farine de sarrasin 269 mg/100g (la plus riche des farines testées) [confirmation indépendante du chiffre cité en vague 1, cette fois via une seconde citation de la même étude] | Faible pour la farine | Moyenne | Deux citations indépendantes de Chai & Liebman convergent sur ~269-280 mg/100g pour la farine — accord raisonnable. Le grain (123,0) n'a pas de point de comparaison direct. |
| Amarante, grain (« Grain, Amaranth, uncooked », 151,0) | 151,0 | Étude HPLC dédiée (Polygonaceae/Amaranthaceae/Chenopodiaceae, ScienceDirect S0308814605004826) : 30 génotypes analysés, moyenne **229 mg/100g**, fourchette 178-278 mg/100g | Modéré (base locale sous la fourchette) | Moyenne | Première confrontation indépendante trouvée pour l'amarante en grain (absente en vague 1). La base locale (151) est inférieure à toute la fourchette de cette étude (178-278) — écart notable, possiblement lié à la variété (30 génotypes testés, grande variabilité génétique documentée pour cette espèce) ou à une confusion cru/cuit non précisée dans la base locale. Référence primaire non accédée directement (403), auteurs non confirmés. |
| Quinoa, bouilli/cuit (44,0-61,0) | 44,0-61,0 | Même étude HPLC : quinoa **184 mg/100g total, 131 mg/100g soluble** (parties comestibles) | **Important** (base locale nettement inférieure) | Faible-Moyenne | **Comble le trou identifié en vague 1** (aucune valeur trouvée alors). Écart important, mais forme non précisée dans la citation trouvée (probablement grain cru/sec, à comparer à une base locale en bouilli — la cuisson dilue fortement). Accès à la référence primaire non obtenu, confiance limitée par cette absence de vérification directe. Point à re-vérifier en priorité avec accès au texte intégral. |
| Son de blé (« Grain, Bran, Wheat », 207,0) | 207,0 | Étude bran/bran products (HPLC) : blé moyenne **220,8 mg/100g MS** total, 60,8 soluble ; fourchette individuelle jusqu'à 392,7 (wheat bran flakes) ; seconde étude (Cereals and Cereal Products, JAFC, DOI jf052776v, non accédée en texte intégral) : jusqu'à **457,4 mg/100g** pour le son de blé | Faible à modéré selon la source | **Haute** | Bon accord avec l'étude bran products (207 vs 220,8, écart <10%) ; la base locale existe bien sous ce nom exact (correction par rapport à la vague 1 qui avait signalé une absence — l'entrée « Grain, Bran, Wheat » existe séparément de « Grain, Bran, Rice », l'erreur venait d'une lecture incomplète en vague 1). Deux études indépendantes confirment un ordre de grandeur élevé (200-450 mg/100g), avec une variabilité inter-échantillons importante documentée par les auteurs eux-mêmes. |
| Son de riz (« Grain, Bran, Rice », 200,0) | 200,0 | Étude bran products : moyenne **139,5 mg/100g MS** | Modéré (~30-40%) | Moyenne | Cohérent avec le constat de la vague 1 (déjà noté). Un seul point de comparaison indépendant disponible. |
| Son d'avoine (« Grain, Oat Bran », 79,0) | 79,0 | Étude bran products : moyenne **67,2 mg/100g MS**, fourchette individuelle 37,0-392,7 (mais 392,7 est identifié comme un échantillon de son de blé, pas d'avoine, dans le résumé consulté — à vérifier) | Faible | Moyenne | Bon accord d'ordre de grandeur (79 vs 67). |
| Germe de blé (« Grain, Wheat Germ », 81,0) | 81,0 | Pas de valeur indépendante isolée trouvée (uniquement des citations mentionnant « wheat germ flour-269 » dans un résumé secondaire, non vérifiable, et probablement confondu avec la farine de sarrasin dans la citation trouvée) | — | Faible | Une valeur de « 269 » associée au germe de blé a été vue dans une citation tierce mais elle coïncide exactement avec la valeur farine de sarrasin trouvée ailleurs — forte suspicion de confusion/erreur de la source secondaire. Non retenue faute de fiabilité. |
| Riz brun, bouilli (6,0) | 6,0 | Sources trouvées (2, 6, 11 mg/100g pour blanc/brun/sauvage) quasi identiques à la base locale elle-même | Quasi nul | **Faible — suspicion de non-indépendance** | Les « sources indépendantes » trouvées pour le riz via recherche générale semblent en réalité republier les valeurs de l'OHF (sites grand public de type blog/app oxalate) plutôt qu'une étude primaire distincte. **Aucune confrontation réellement indépendante obtenue** pour le riz dans ce lot — à retenter en vague 3 avec un accès direct à une base de données primaire. |
| Riz blanc, bouilli (2,0) | 2,0 | Idem ci-dessus | — | Faible | Idem — pas de confrontation indépendante fiable obtenue. |
| Riz sauvage, bouilli (11,0) | 11,0 | Idem ci-dessus | — | Faible | Idem. |
| Orge (farine, 41,0 ; perlé bouilli, 10,0) | 41,0 / 10,0 | Pas de valeur indépendante isolée trouvée dans ce lot | — | Faible | Trou — non couvert par les sources accessibles trouvées ici. |
| Seigle (farine, 38,0) | 38,0 | Pas de valeur indépendante isolée trouvée | — | Faible | Trou. |
| Farro, cru (12,0) | 12,0 | Pas de valeur indépendante trouvée | — | Faible | Trou. |
| Millet (dry 21,0 ; boiled 7,0 ; cereal cooked 37,0 — 3 entrées incohérentes entre elles dans la base locale) | 21,0 / 7,0 / 37,0 | Pas de valeur indépendante trouvée dans ce lot | — | Faible | **Incohérence interne à signaler** : trois entrées « millet » dans la base locale donnent des valeurs très différentes (7 à 37 mg/100g) pour des états de préparation proches (cuit/bouilli) — à clarifier en priorité interne avant recherche externe supplémentaire, similaire au cas du sésame relevé en vague 1. |
| Farine de blé (32,0), blé entier bulgur (68,0), wheat berries (90,0) | 32,0 / 68,0 / 90,0 | Pas de valeur indépendante isolée trouvée dans ce lot pour ces formes précises | — | Faible | Trou. |

## 2. Pains

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Pain, blé blanc (24,0) et complet (35,0) | 24,0 / 35,0 | Étude « Oxalate content of selected breads and crackers » (ScienceDirect S0889157509001963, probablement Chai & Liebman ou collaborateurs — auteurs non confirmés directement) : pains **16,5 à 45,9 mg/100g**, sauf un échantillon au sésame à 111,5 mg/100g | Faible | Moyenne | Base locale (24-35) tombe bien dans la fourchette générale (16,5-45,9) de cette étude dédiée aux pains — bon accord. Point notable : l'étude signale explicitement que le sésame ajouté fait grimper fortement la valeur (111,5 vs <46 pour les autres) — cohérent avec la teneur très élevée du sésame identifiée en vague 1. |
| Autres pains de la base (bagel, cornbread, muffin anglais, buns, pain de seigle, tortilla de blé, pain "organic seeds and grains") | 15,0 à 45,0 environ selon l'entrée | Même étude, même fourchette générale (16,5-45,9 mg/100g) | Faible | Moyenne | Pas de décomposition par type de pain trouvée dans le résumé accessible, mais l'ensemble de la base locale pour les pains est cohérent avec la fourchette globale de cette étude dédiée. |

## 3. Pâtes

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Pâtes de blé, cuites (18,0-25,0 selon type) | 18,0 / 25,0 | Étude « Oxalate content of selected pasta products » (ScienceDirect S0889157509000088) : pâtes **20-30 mg/100g matière sèche** | Faible | Moyenne | Bon accord d'ordre de grandeur (18-25 base locale vs 20-30 littérature), malgré une différence d'unité (cuit vs matière sèche) qui devrait normalement faire diverger davantage les deux valeurs — possible coïncidence ou base locale proche de la matière sèche pour les pâtes al dente. Auteurs de l'étude non confirmés directement (résumé secondaire uniquement). |
| Pâtes spécialisées (riz, épeautre, sarrasin/kamut, avec épinards, etc.) | 2,0 à 98,0 très variable | Pas de décomposition par type trouvée dans l'étude ci-dessus | — | Faible | La forte variabilité de la base locale elle-même (2 à 98 mg/100g selon l'ingrédient principal — la pâte aux épinards à 98,0 est cohérente avec la teneur connue de l'épinard) n'est pas confrontable finement avec la seule fourchette globale trouvée. |

## 4. Œufs, poisson, viande

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Œufs (0,0) | 0,0 | Consensus large et informel (sources de vulgarisation nutritionnelle, pas d'étude primaire chiffrée isolée trouvée) : oxalate négligeable/nul dans les œufs | Aucun | Moyenne | Cohérence qualitative forte (les produits animaux ne synthétisent pas d'oxalate), mais aucune étude peer-reviewed primaire chiffrée trouvée spécifiquement — confiance limitée par l'absence de référence primaire vérifiable, malgré un très large consensus informel. |
| Poisson et fruits de mer (3,0) | 3,0 | Idem — consensus informel « négligeable », pas d'étude primaire chiffrée trouvée | Aucun | Faible-Moyenne | Cohérent qualitativement avec la base locale (valeur très faible), mais pas de confrontation quantitative rigoureuse possible avec les sources trouvées ici. |
| Viande et volaille (non listé isolément dans ce lot, regroupé ailleurs dans la base) | — | Idem | — | Faible-Moyenne | Même constat. |

## 5. Légumineuses

**Découverte majeure de cette vague** : une étude 2023 indépendante (Abera, Yohannes & Chandravanshi,
*International Journal of Analytical Chemistry*, 2023 — « Effect of Processing Methods on
Antinutritional Factors (Oxalate, Phytate, and Tannin) and Their Interaction with Minerals... in
Red, White, and Black Kidney Beans ») trouve des valeurs **radicalement plus basses** que Chai &
Liebman 2005 et que la base locale pour les mêmes légumineuses.

| Aliment | Base locale (OHF, cuit) | Chai & Liebman 2005 | Abera et al. 2023 | Écart | Confiance | Notes |
|---|---|---|---|---|---|---|
| Haricots rouges (kidney), cuits | 20,0 | Fourchette légumineuses cuites 4-80 mg/100g (pas de valeur isolée « red kidney » confirmée) | **Rouge : 1,79 mg/100g cru, 1,32 mg/100g cuit** | **Très important** (facteur ~15 entre base locale/Chai&Liebman et Abera et al.) | Faible | Divergence majeure entre deux études indépendantes elles-mêmes (Chai&Liebman gamme générale 4-80 vs Abera et al. 1,3-1,8). Ceci n'est PAS une simple variabilité de méthode mineure — c'est un ordre de grandeur différent. Hypothèses possibles : méthode de dosage très différente, variété de haricot, région de culture (étude Abera et al. menée en Éthiopie), ou erreur dans l'une des deux études. **Ne pas trancher sans lire les méthodes complètes des deux études** — signalé ici comme divergence non résolue plutôt que consensus forcé. |
| Haricots blancs, cuits | 61,0 | Blancs secs 547,9 mg/100g [réf. vague 1, revue MDPI] | **Blanc : 1,6-1,8 mg/100g cru** (range) | **Très important** | Faible | Même divergence extrême. Trois valeurs pour « haricots blancs » qui ne se recoupent presque pas : 547,9 (sec, revue MDPI), 61,0 (cuit, base locale), 1,6-1,8 (cru, Abera et al.) — signale une incohérence sérieuse dans la littérature grand public sur cet aliment, à traiter avec prudence plutôt qu'à moyenner. |
| Haricots noirs, cuits | 60,0 | Fourchette générale 4-80 | **Noir : 1,5-1,8 mg/100g cru** (range) | **Très important** | Faible | Idem. |
| Lentilles, cuites | 9,0 | Brune 24,0 mg/100g sec / 14,3 soluble [réf. vague 1] | Non couvert par Abera et al. | Faible (cuit vs sec) | Moyenne | Reprend le constat de la vague 1, cohérent avec l'effet de dilution à la cuisson. |
| Pois chiches, cuits | 10,0 | 14,3 mg/100g sec [réf. vague 1] | Non couvert | Faible | Moyenne | Reprend le constat de la vague 1. |
| Soja, cuit/dried&boiled | 45,0 | Sec 276,8 total / 37,9 soluble [confirmation Chai & Liebman via revue MDPI] | Non couvert | Modéré (soluble 37,9 proche de la base locale 45,0 si la base locale reflète le soluble) | Moyenne | Le rapprochement avec la valeur **soluble** (37,9) plutôt que totale (276,8) de Chai&Liebman est plus cohérent avec la base locale — hypothèse à vérifier : la base locale OHF pourrait mélanger total et soluble selon les aliments, comme déjà suspecté en vague 1. |
| Autres haricots (anasazi, blue, butter, cannellini, fava, flor de mayo, great northern, lima, mung, navy, october, pink, pinto, soybean curd) | 3,0 à 107,0 selon type | Fourchette générale Chai&Liebman 4-80 | Non couverts individuellement | — | Faible | Pas de confrontation individuelle possible avec les sources trouvées dans ce lot ; la plupart tombent dans la fourchette générale Chai&Liebman sauf « Flor de Mayo » (107,0) et « Cannellini » (89,0) qui la dépassent légèrement. |
| Pois (green peas, split peas, black-eyed, pigeon, purple hull) | 2,0 à 36,0 | Pas de valeur individuelle trouvée | — | Faible | Trou. |
| Edamame | 30,0 | Pas de valeur indépendante trouvée (confirme le trou de la vague 1) | — | Faible | Trou persistant. |

**Synthèse légumineuses** : le résultat le plus important de ce lot n'est pas un consensus mais une
**divergence non résolue entre deux études indépendantes toutes deux publiées dans des revues à
comité de lecture** (Chai & Liebman 2005 vs Abera et al. 2023) pour les mêmes haricots (rouge,
blanc, noir), avec un facteur d'écart de l'ordre de 10 à 30. Ceci illustre bien la limite de fond
de tout exercice de « consensus » sur l'oxalate : parfois, il n'y a pas de convergence possible
sans trancher sur la méthode analytique et le contexte (variété, origine géographique, traitement)
de chaque étude — une moyenne naïve des deux serait scientifiquement trompeuse.

---

## 6. Aliments sans confrontation multi-source possible (trous)

- Orge (farine et grain), seigle (farine), farro, germe de blé (valeur trouvée non fiable)
- Riz (blanc/brun/sauvage) — aucune confrontation réellement indépendante obtenue, seulement des
  sites qui semblent republier l'OHF
- Toutes les céréales de petit-déjeuner de marque (All-Bran, Bran Flakes, Chex, Fiber One,
  Grape-Nuts, Kashi, Meuslix, Shredded Wheat, Special K, Weetabix) — aucune étude testant le
  produit de marque exact trouvée ; approximation possible par composition (ex. All-Bran → son de
  blé, valeur indépendante disponible ci-dessus) mais non réalisée systématiquement dans ce lot
  faute de temps
- Riz de marque (Uncle Ben's) — non confrontable, produit composite
- Pâtes de marque/spécialisées individuellement (seule une fourchette globale « pâtes » trouvée)
- Farine d'amande, de cassava, de châtaigne, de coco, de pois chiche, de lin, d'avoine, de riz, de
  sorgho, de soja (au-delà de la valeur globale Chai&Liebman), d'épeautre, de tapioca, de teff, de
  tigernut, de gluten de blé, farine sans gluten de marque, fécule de pomme de terre/arrow-root —
  aucune valeur individuelle indépendante trouvée dans ce lot
- Œufs, poisson, viande — consensus qualitatif fort (négligeable) mais aucune étude primaire
  chiffrée trouvée

## 7. Bibliographie consolidée de ce lot

1. Chai W, Liebman M (2005). *Oxalate content of legumes, nuts, and grain-based flours.* Journal
   of Food Composition and Analysis, 18(7), 723-729. [Valeurs obtenues via citations secondaires
   (nuthealth.org, résumés de recherche) ; accès direct au PDF non obtenu (403 sur ScienceDirect
   et ResearchGate).]
2. Auteurs non confirmés (2009 environ, à vérifier). *Oxalate content of selected breads and
   crackers.* Journal of Food Composition and Analysis. ScienceDirect ID S0889157509001963.
   [Résumé secondaire uniquement ; probablement même équipe que Chai & Liebman vu la continuité
   thématique, non confirmé.]
3. Auteurs non confirmés (2009 environ, à vérifier). *Oxalate content of selected pasta products.*
   Journal of Food Composition and Analysis. ScienceDirect ID S0889157509000088. [Résumé
   secondaire uniquement.]
4. Auteurs non confirmés. *Total, soluble and insoluble oxalate content of bran and bran
   products.* [Existence confirmée en vague 1, réutilisée ici ; ResearchGate/Academia.edu, 403 en
   accès direct.]
5. Auteurs non confirmés (méthode HPLC-enzyme-reactor). *Oxalate contents of species of the
   Polygonaceae, Amaranthaceae and Chenopodiaceae families.* Food Chemistry (ScienceDirect
   S0308814605004826). [403 en accès direct ; valeurs obtenues via résumé de moteur de recherche
   uniquement — fiabilité limitée, à re-vérifier impérativement avant usage.]
6. Auteurs non confirmés. *Oxalate Content of Cereals and Cereal Products.* Journal of
   Agricultural and Food Chemistry, DOI: 10.1021/jf052776v. [403 en accès direct, une seule
   valeur (son de blé 457,4 mg/100g) obtenue via citation tierce.]
7. Abera S, Yohannes W, Chandravanshi BS (2023). *Effect of Processing Methods on Antinutritional
   Factors (Oxalate, Phytate, and Tannin) and Their Interaction with Minerals (Calcium, Iron, and
   Zinc) in Red, White, and Black Kidney Beans.* International Journal of Analytical Chemistry.
   PMC10599953. [Texte consulté avec succès via PMC (après redirection 301) — source la plus
   fiable de ce lot, mais ses résultats divergent fortement des autres sources sur les mêmes
   légumineuses, voir section 5.]

**Avertissement bibliographique** : comme pour la vague 1, plusieurs références listées ci-dessus
(1, 2, 3, 4, 5, 6) n'ont pas été vérifiées par accès direct au texte intégral (blocages 403
systématiques sur ScienceDirect/ResearchGate pour ce lot) — leurs valeurs viennent de résumés de
moteur de recherche ou de citations tierces (nuthealth.org notamment). Seule la référence 7 (PMC)
a été consultée en texte intégral avec un niveau de confiance normal sur la source elle-même
(indépendamment de la divergence de ses résultats avec le reste de la littérature).

## 8. Recommandations pour la suite

1. **Dédupliquer les légumineuses avec le lot « protéines/noix/légumineuses »** de cette même
   vague 2 — ce lot les a déjà couvertes en détail suite à un chevauchement de découpage.
2. **Ne pas moyenner naïvement** Chai & Liebman et Abera et al. pour les haricots rouges/blancs/
   noirs — l'écart est trop important (facteur 10-30) pour représenter une simple variabilité
   normale ; nécessite une lecture complète des deux méthodologies avant toute décision.
3. Éclaircir l'incohérence interne à la base locale sur le millet (trois valeurs 7/21/37 mg/100g
   pour des préparations proches).
4. Prioriser en vague 3 l'accès direct (via une bibliothèque universitaire ou Sci-Hub si
   légalement accessible pour l'utilisateur, sinon contact direct aux auteurs) aux textes complets
   de Chai & Liebman (2005) et de ses suites (breads/crackers, pasta) — ce sont les études les
   plus citées et les plus systématiques pour cette catégorie d'aliments, et leur accès direct
   résoudrait plusieurs incertitudes de confiance « Faible » marquées uniquement par prudence
   méthodologique (citation secondaire) plutôt que par doute sur la valeur elle-même.
</content>
