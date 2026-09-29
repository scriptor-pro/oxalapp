# Synthèse des vagues 1-3 — recommandations concrètes pour `oxalate-database.json`

**Date** : 2026-09-13
**Base** : `src/data/oxalate-database.json`, 737 entrées, dérivées du PDF OHF.
**Sources croisées** : vague 1 (aliments bruts prioritaires), vague 2 (couverture large en 5
lots : céréales, laitiers/boissons, légumes, protéines, transformés/marques), vague 3
(oxalate.org + FAO Bangladesh 2014).

## Comment lire ce document

Sur l'ensemble des ~150 aliments confrontés à une littérature indépendante à travers les trois
vagues, la conclusion transversale la plus importante est méthodologique, pas numérique : **la
majorité des écarts observés s'expliquent par la forme du produit (cru/cuit/sec), l'unité de
mesure, la variété ou la méthode de dosage — pas par une erreur de la base locale.** En
conséquence, très peu de cas ci-dessous appellent une correction ferme et immédiate ; la
plupart appellent une **note d'incertitude explicite** ou une **investigation complémentaire**
avant toute modification de valeur.

Les recommandations sont classées par action requise, pas par catégorie d'aliment.

---

## 1. Corrections numériques à envisager (confiance suffisante)

Aucun cas de cette revue n'atteint le niveau de confiance « haute + écart significatif + forme
strictement comparable » qui justifierait de modifier une valeur numérique sans étape
intermédiaire. Les meilleurs accords trouvés (framboise, mûre, chocolat noir en barre, cajou,
betterave, rhubarbe, taro, thé vert recalé) **confirment** au contraire la base locale plutôt
qu'ils ne la contredisent — c'est un résultat positif en soi : sur les aliments bien
documentés et comparés dans une forme équivalente, l'OHF tient globalement la route.

**Aucune correction numérique n'est recommandée à ce stade.** Le travail des trois vagues
sert surtout à calibrer la confiance à afficher (section 3) plutôt qu'à réécrire des valeurs.

---

## 2. Anomalies à investiguer en priorité avant toute décision

Ces cas présentent soit un écart trop important pour être de la simple variabilité produit,
soit une incohérence interne à la base elle-même. **Ne pas corriger sans une source
supplémentaire** — chaque cas ci-dessous n'a qu'une ou deux sources en présence, parfois
elles-mêmes contradictoires.

| # | Aliment | Base locale | Écart constaté | Priorité | Action recommandée |
|---|---|---|---|---|---|
| 1 | **Eau de coco** | 7,0 mg/100g | FAO Bangladesh 2014 (HPLC) : 318 mg/100g — facteur x45. **Résolu, voir 2.1** : preuve fonctionnelle indépendante tranche en faveur de la valeur basse. | **Résolu** | Conserver 7,0 mg/100g. Ne pas intégrer la valeur FAO. |
| 2 | **Haricots rouges/blancs/noirs, cuits** | 20,0 / 61,0 / 60,0 mg/100g | Trois valeurs qui ne se recoupent pas du tout selon la source : base locale (cuit) 20-61 ; Chai & Liebman (sec) jusqu'à 548 ; Abera et al. 2023 (cru **et** cuit, HPLC) seulement 1,3-1,8 | **Haute** | Ne pas moyenner. Lire les méthodologies complètes de Chai & Liebman et d'Abera et al. pour comprendre la source de l'écart (facteur 10-30) avant toute modification. |
| 3 | **Pourpier (Purslane), feuilles** | 621,0 mg/100g | Zherkova et al. 2025 : 2520-7970 mg/100g frais (facteur 4-13) | **Haute** | Source unique, récente, méthode moins fiable (titration KMnO₄ vs HPLC). Chercher une 2e étude avant toute décision. |
| 4 | **Graines de sésame, entières séchées** | 3800,0 mg/100g | Incohérence interne : "toasted" = 216, "hulled" = 146 dans la même base. **Clarifié, voir 2.2** : source indépendante confirme l'écart massif entier/décortiqué comme réel (l'oxalate de calcium est concentré dans l'enveloppe), mais sa propre valeur (1750 mg) diverge encore x2,2 de la base locale. | Moyenne (écart résiduel, pas une incohérence) | Envisager de corriger vers 1750 mg/100g si une 2e source confirme, sinon élargir l'incertitude affichée plutôt que trancher sur une seule étude. |
| 5 | **Kiwi** | 36,0 mg/100g | Littérature (réf. 1, 77) : 4,5-23 mg/100g — base locale au-dessus de toute la fourchette | Moyenne | Possible confusion de variété (vert vs gold/jaune, connus pour différer). À vérifier laquelle est visée dans la base locale. |
| 6 | **Pomme de terre au four** | voir base | Base locale ~3,5x la seule source trouvée (vague 2 légumes) | Moyenne | Une seule source de comparaison — à recouper. |
| 7 | **Pousses de bambou** | voir base | Base locale nettement sous la littérature (facteur 2-10, vague 2 légumes) | Moyenne | Une seule source — à recouper. |
| 8 | **Ail, cru** | 9,0 mg/100g | Deux sources indépendantes ne détectent aucun oxalate (vague 2 légumes) | Moyenne | Deux sources convergent contre la base locale — cas le plus mûr pour une correction (→ quasi nul), mais à confirmer avant d'écraser une valeur à 0. |
| 9 | **Champignons, crus** | voir base | Désaccord massif (facteur ~10) **entre études indépendantes elles-mêmes**, avant même comparaison à la base locale (vague 2 légumes) | Basse | Pas d'action possible tant que la littérature elle-même ne converge pas. |

### 2.1 Investigation complémentaire — Eau de coco (cas #1 résolu)

Recherche menée pour trancher entre la base locale (7,0 mg/100g) et la valeur FAO Bangladesh
2014 (318 mg/100g, vérifiée directement dans le PDF source, méthode HPLC documentée).

**Aucune source ne mesure directement l'oxalate de l'eau de coco de façon indépendante et
vérifiable** (Siener et al. 2017 cité par plusieurs sources tierces à "7 mg/100g" mais le
texte intégral reste bloqué par paywall — non vérifié directement).

En revanche, une étude clinique complète a été trouvée et exploitée directement :
**Bihl G, et al. (probable — auteurs exacts non confirmés dans le texte consulté),
*Coconut Water: An Unexpected Source of Urinary Citrate*, PMC6236775.** Essai croisé sur 8
volontaires sains, consommant **1,92 L/jour d'eau de coco pure pendant 4 jours** (vs eau du
robinet en phase contrôle), avec dosage précis de l'oxalate urinaire (méthode non détaillée
dans le résumé consulté, mais rigueur clinique du protocole croisé).

**Résultat clé** : l'oxalate urinaire n'a **pas varié significativement** entre les deux
phases (26,6 → 27,7 mEq/jour, p = 0,40).

**Raisonnement** : si l'eau de coco contenait réellement 318 mg d'oxalate/100 mL (valeur
FAO), 1,92 L/jour représenterait un apport d'environ **6 100 mg d'oxalate/jour** — 20 à 60
fois l'apport alimentaire quotidien moyen en oxalate (typiquement 100-300 mg/j toutes sources
confondues). Un tel apport aurait dû produire une hausse spectaculaire et statistiquement
non-ambiguë de l'oxalate urinaire, même en tenant compte d'une biodisponibilité partielle.
Ce n'est pas ce qui est observé.

**Conclusion** : cette preuve fonctionnelle, bien qu'indirecte (l'étude ne visait pas à
mesurer l'oxalate de l'eau de coco elle-même), est suffisamment robuste pour trancher en
faveur de la valeur basse. **La valeur FAO Bangladesh de 318 mg/100g est très probablement
une erreur** (unité, saisie, ou artefact propre à l'échantillon/méthode locale) plutôt qu'une
vraie teneur. **Recommandation : conserver la valeur base locale (7,0 mg/100g) et ne pas
intégrer la valeur FAO.**

### 2.2 Investigation complémentaire — Sésame entier séché (cas #4 clarifié)

Recherche menée pour comprendre l'écart interne à la base locale entre sésame "whole dried"
(3800 mg/100g) et sésame "hulled" (décortiqué, 146 mg/100g) — facteur x26.

**Source trouvée et vérifiée directement** : Ishii Y, Takiyama K (2000). *Distribution of
Calcium in Sesame Seeds.* Journal of Cookery Science of Japan, 33(3), 372. Université des
Femmes de Mukogawa. Méthode : chromatographie ionique. DOI: 10.11402/cookeryscience1995.33.3_372
(J-STAGE, accès libre, texte consulté directement).

**Valeurs mesurées** :
- Sésame entier séché : oxalate total **1750 mg/100g**, oxalate libre 350 mg/100g.
- Sésame décortiqué : oxalate total **100 mg/100g**, oxalate libre 50 mg/100g.
- Observation explicite des auteurs : **« pratiquement tout l'oxalate de calcium se concentre
  dans les enveloppes des graines »**.

**Conclusion** :
1. **L'écart qualitatif entier/décortiqué est confirmé et expliqué** par une source
   indépendante et vérifiable — ce n'est pas une incohérence de la base locale, c'est un
   phénomène réel et attendu (concentration de l'oxalate de calcium dans le péricarpe/l'enveloppe).
2. **L'écart quantitatif reste ouvert** : la base locale (3800) est 2,2× plus élevée que cette
   étude japonaise (1750) pour la forme entière, et le ratio décortiqué/entier diffère aussi
   (146/3800 ≈ 3,8 % dans la base locale vs 100/1750 ≈ 5,7 % chez Ishii & Takiyama — ordre de
   grandeur cohérent, pas une contradiction franche).
3. Une deuxième étude est mentionnée dans la littérature secondaire (nombre d'échantillons/
   auteurs non confirmés) qui donnerait une valeur proche de 3800 — non vérifiée directement,
   à retrouver si une vague 4 est menée.

**Recommandation** : ne pas corriger la valeur 3800 → 1750 sur la seule base de cette étude
(un point de comparaison, variété/origine du sésame non contrôlée) mais **élargir l'incertitude
affichée pour cette entrée spécifique** plutôt que la présenter avec la même précision que le
reste de la base — l'écart x2,2 avec une source par ailleurs solide (méthode documentée,
institution identifiée) justifie une prudence accrue, sans aller jusqu'à trancher.

---

## 3. Recalibrage de l'incertitude affichée (± 35 % générique actuel)

C'est probablement l'action la plus utile à court terme, indépendamment des cas 1-9 : la
revue montre que l'incertitude réelle **varie énormément selon l'aliment**, et qu'un ±35 %
uniforme sous-représente certains cas et sur-représente d'autres.

- **Aliments à faire monter en confiance** (accord démontré avec ≥2 sources indépendantes,
  forme comparable) : framboise, mûre, betterave, rhubarbe, taro, chocolat noir (barre), cajou,
  vin, soda, thé noir/vert infusés (grâce à Siener et al. 2016/2017, mg/100mL directement
  comparable). Un ±35 % est probablement trop large pour ces cas — pourrait descendre à ±15-20%.
- **Aliments à signaler avec une incertitude nettement supérieure à ±35 %**, voire une mention
  qualitative plutôt que quantitative :
  - Épinard, amarante (feuilles), pourpier — variabilité intrinsèque × source unique récente
    pour le pourpier.
  - Haricots rouges/blancs/noirs cuits (cas #2 ci-dessus) — divergence non résolue entre études.
  - Sésame entier (cas #4) — écart x2,2 avec la seule source indépendante trouvée (Ishii &
    Takiyama 2000), voir §2.2.
  - Star fruit/carambole — variété/origine géographique très variable.
  - Toutes les entrées « produits de marque/transformés » (vague 2 transformés) — confrontées
    uniquement par ingrédient dominant, jamais par mesure directe du produit fini ; la dilution
    par les ingrédients non-oxalate n'est pas connue. Ce sont structurellement les valeurs les
    **moins fiables** de toute la base, quel que soit leur accord apparent avec la littérature
    sur l'ingrédient pur.

**Recommandation concrète** : introduire un niveau de confiance à 3 paliers (haute/moyenne/
faible) en plus du ±35 %, plutôt qu'un pourcentage unique pour toute la base — cohérent avec
ce que les trois vagues ont produit comme colonne « Confiance » systématique.

---

## 4. Problèmes de forme à corriger dans la présentation de l'app (pas dans les valeurs)

Ces points ne changent aucune valeur numérique mais affectent la fiabilité perçue :

1. **Thé (noir/vert)** — le problème d'unité (littérature en mg/g feuilles sèches vs base
   locale en mg/100mL boisson infusée) a été résolu par la vague 2 : Siener et al. 2017 donne
   des valeurs directement comparables (mg/100mL) qui confirment bien la base locale. Aucune
   action requise sur la valeur, mais la confiance affichée pour ces deux entrées peut monter.
2. **Légumineuses cuites vs sèches** — la base locale donne systématiquement des valeurs
   « cuites », alors qu'une bonne partie de la littérature indépendante rapporte des valeurs
   « sèches ». Sans facteur de conversion sec→cuit documenté, aucune comparaison quantitative
   fiable n'est possible pour cette catégorie. Ne concerne pas une correction de valeur, mais
   limite fortement la capacité à valider ou invalider ces entrées à l'avenir.
3. **Produits de marque (vague 2 transformés)** — méthode par « ingrédient dominant » validée
   avec l'utilisateur mais qui ne peut, par construction, jamais confirmer une valeur produit
   fini — seulement écarter une valeur clairement incohérente avec la composition attendue.
   Aucune incohérence de ce type détectée dans le lot examiné (147 entrées), à l'exception du
   point de classement Wendy's Caesar Salad (voir vague 2 transformés, note dédiée — problème
   de seuil d'affichage, pas de valeur).

---

## 5. Trous documentés (aucune littérature indépendante trouvée)

Liste consolidée des aliments où les trois vagues n'ont trouvé aucune confrontation possible,
par ordre de pertinence clinique perçue (fréquence de citation dans la littérature générale
sur l'oxalate) :

**Haute pertinence clinique, aucune donnée indépendante** : quinoa (bouilli), café (boisson),
patate douce, tahini (accès bloqué mais source identifiée), edamame, amarante en grain
(distincte des feuilles), son de blé (absent de la base sous ce nom exact — à vérifier),
graines (chia, chanvre, tournesol, courge, papaye), laits/yaourts végétaux au-delà de
l'amande.

**Pertinence moindre ou aliments régionaux** : algues (nori/kombu/wakame — sources trouvées
non indépendantes de l'OHF), panais, céleri-rave, navet, maïs doux, rutabaga, radicchio,
jicama, kohlrabi, water chestnuts, hearts of palm, huazontle, good king henry (plantes
régionales, littérature probablement non anglophone).

---

## 6. Pistes concrètes pour une éventuelle vague 4

Par ordre de rentabilité attendue (accès identifié comme probablement obtenable) :

1. **Siener et al. 2016/2017** (jus de fruits/légumes + boissons, ~32 boissons testées,
   méthode HPLC-réacteur enzymatique, équipe Bonn) — texte intégral non obtenu (paywall).
   Le cas eau de coco a été tranché sans cette source (voir §2.1, preuve clinique
   indépendante), mais l'accès à ce texte recalibrerait toute la catégorie boissons d'un coup.
2. **Massey, Palmer & Horner 2001** — lien probable en accès libre déjà repéré
   (`lib.dr.iastate.edu/bot_pubs/49/`), non vérifié. Couvrirait beurre de cacahuète, refried
   beans, lentilles, et une fourchette pour 13 soyfoods commerciaux.
3. **Abera et al. 2023 vs Chai & Liebman 2005** (cas #2) — les deux textes semblent accessibles
   (PMC pour Abera et al.) ; comparer les protocoles de dosage en détail pourrait à lui seul
   trancher le plus gros écart non résolu de toute la revue.
4. **Judprasong et al. 2006** (légumes thaïlandais) — couvrirait potentiellement panais, navet,
   maïs, échalote d'un coup si l'accès via ResearchGate "request full-text" aboutit.

## 7. Ce que cette revue ne remplace pas

Rappel pour l'app elle-même (déjà dans le CLAUDE.md, confirmé et renforcé par cette revue) :
la variabilité intrinsèque du produit (variété, sol, saison, cuisson) domine dans la plupart
des cas l'écart entre sources publiées. Un travail de « consensus multi-sources » ne peut pas
produire de valeur unique garantie pour un produit précis — l'objectif réaliste reste une
fourchette avec confiance affichée, pas une précision accrue de la valeur ponctuelle.
