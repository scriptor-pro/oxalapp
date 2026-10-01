# Choix à faire : quel niveau d'oxalate pour les pâtes ?

**Date** : 2026-10-01
**Statut** : décidé le 2026-10-01 — option A (par 100 g)
**Contexte** : chantier « blé + chocolat + mention « au moins » », qui fait suite à l'audit des
résultats « non déterminable ».

## Le problème en une phrase

Les mesures scientifiques s'accordent sur la **teneur** des pâtes. Le choix porte sur la façon
de compter : **par 100 g** ou **par portion**. Les deux logiques donnent un niveau différent pour
les pâtes, et seulement pour elles.

## Les chiffres

Valeurs de la base OHF utilisée par l'app (`src/data/oxalate-database.json`) :

| Aliment (entrée OHF) | Oxalate / 100 g | Portion de référence | Oxalate / portion | Niveau OHF |
|---|---|---|---|---|
| Pâtes de blé blanches, cuites (« Pasta, Wheat, Non-whole wheat varieties, Cooked & drained ») | 18 mg | 1 tasse (128 g) | 24 mg | **élevé** |
| Pâtes complètes, cuites (« Pasta, Wheat, Whole wheat varieties, Cooked & drained ») | 25 mg | 1 tasse (128 g) | 31 mg | **très élevé** |
| Couscous (« Pasta, Couscous, dried, boiled ») | 17 mg | ½ tasse (78,5 g) | 13 mg | **élevé** |
| Semoule crue (« Flour, Semolina ») | 46 mg | ¼ tasse (41,5 g) | 19 mg | **élevé** |
| Pain blanc (« Bread, Wheat, White ») | 24 mg | 1 tranche (30 g) | 7 mg | **modéré** |
| Pain complet (« Bread, Wheat, Whole Grain, 100% Whole Wheat ») | 35 mg | 1 tranche (38 g) | 13 mg | **élevé** |

Mesures indépendantes, qui confirment l'ordre de grandeur :

- [Liebman & Okombo 2009](https://www.sciencedirect.com/science/article/abs/pii/S0889157509000088) :
  la plupart des pâtes du commerce contiennent 20 à 30 mg/100 g, dont 5 à 12 mg sous forme
  soluble. Valeurs lues dans un résumé ; texte intégral non consulté.
- [Siener et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16608223/) : le blé dur en grain
  entier contient 76,6 mg/100 g. Les produits de blé dur complet (couscous, boulgour,
  pâtes) ont une teneur comparable.

**Le paradoxe** : à poids égal, les pâtes cuites contiennent *moins* d'oxalate que le pain blanc
(18 contre 24 mg/100 g). Pourtant OHF classe les pâtes « élevé » et le pain « modéré ». La seule
différence vient de la portion : on mange environ 128 g de pâtes, contre 30 g de pain.

## Pourquoi c'est un vrai choix

Depuis le recalibrage de juillet 2026, les niveaux de l'app reposent sur les seuils **par portion**
de la Mayo Clinic, appliqués aux portions de référence d'OHF
(`docs/superpowers/specs/2026-07-30-oxalate-scoring-recalibration-design.md`) :

| Niveau | Oxalate par portion |
|---|---|
| faible | moins de 5 mg |
| modéré | 5 à 8 mg |
| élevé | 8 à 25 mg |
| très élevé | plus de 25 mg |

Les trois paliers proposés pour le blé (son « très élevé », complet « élevé », raffiné « modéré »)
s'appuient, eux, sur les mesures **par 100 g** de la littérature. Pour le pain et les biscuits,
les deux logiques donnent le même niveau. Pour les pâtes, elles divergent.

## Les deux options

### A. Pâtes « modéré » : on applique le palier « blé raffiné » à tout le blé raffiné

- **Pour** : règle simple (trois paliers, sans exception), cohérente avec la concentration réelle
  des pâtes par 100 g.
- **Contre** : incohérente avec le reste de l'app, qui raisonne par portion. C'est aussi un risque
  de fausse réassurance : une assiette de 128 à 250 g de pâtes cuites apporte environ 23 à 45 mg
  d'oxalate (18 mg/100 g), soit autant que trois à six portions d'un aliment « modéré ».

### B. Pâtes « élevé », conforme à OHF

On distingue le **blé dur**, dont on fait les pâtes et le couscous, du **blé tendre**, dont on fait
le pain et les biscuits. Open Food Facts les identifie séparément (par exemple
`en:durum-wheat-semolina` contre `en:wheat-flour`), ce qui rend la règle applicable de façon fiable :

| Forme | Niveau |
|---|---|
| Son de blé | très élevé (déjà en place) |
| Blé dur complet (pâtes et semoule complètes) | très élevé |
| Blé dur raffiné (pâtes, couscous, semoule) | élevé |
| Blé tendre complet (farine complète, flocons, grains) | élevé |
| Blé tendre raffiné (farine blanche : pain, biscuits) | modéré |

- **Pour** : cohérente avec toute l'app et avec OHF ; prudente pour les personnes sous régime
  pauvre en oxalate, pour qui un plat de pâtes compte vraiment.
- **Contre** : la règle repose sur une portion *typique*, pas sur la quantité réellement mangée.
  Les rares produits à base de blé dur qui ne sont pas des pâtes seraient traités comme des pâtes.
  Enfin, le code d'Open Food Facts n'est pas toujours assez précis : « Whole Wheat Penne Rigate »
  est codé `en:durum-wheat`, sans préciser « complet », et serait donc classé « élevé » au lieu de
  « très élevé ».

## Effet mesuré

Mesure faite le 2026-10-01 sur les 200 produits belges les plus scannés (échantillon en cache de
l'audit) :

- Le taux de « non déterminable » est **identique** avec A et B : 76 → 46 (38 % → 23 %), puisque
  le blé est reconnu dans les deux cas.
- Seul le niveau affiché change pour **4 produits** : Barilla Penne Rigate, Fusilli No 98,
  Lasagne all'uovo et Whole Wheat Penne Rigate. Ils sont « modéré » avec A, « élevé » avec B.

## Recommandation

**Option B.** L'app raisonne par portion depuis le recalibrage de juillet. Changer de logique pour
les seules pâtes rendrait les niveaux moins cohérents entre eux. Et pour une personne sous régime
pauvre en oxalate, un plat de pâtes est un apport significatif.

## Décision

**Option A, retenue par l'utilisateur le 2026-10-01** : les pâtes sont classées **par 100 g**, comme
tout le blé raffiné, donc « modéré ». Raison donnée : « une portion, c'est subjectif ».

Conséquences pour le chantier blé :

- Les paliers suivent les teneurs par 100 g de la littérature : son « très élevé » (200 à 460 mg),
  blé complet « élevé » (50 à 80 mg), blé raffiné « modéré » (15 à 45 mg), sans distinguer blé dur
  et blé tendre.
- Les pâtes, le couscous et la semoule raffinés sont donc « modéré » ; les pâtes complètes sont
  « élevé ».
- **Point ouvert** : le reste de l'app classe encore les ingrédients **par portion** (seuils Mayo
  appliqués aux portions OHF). Le blé suivra donc une autre logique que les autres ingrédients.
  Rendre toute l'app cohérente avec un classement par 100 g serait un chantier distinct, à
  décider séparément.
