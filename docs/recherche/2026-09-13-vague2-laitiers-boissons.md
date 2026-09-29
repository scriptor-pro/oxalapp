# Revue de littérature — Vague 2, lot « laitiers/boissons/gras » (nom hérité)

**Date** : 2026-09-13
**Méthodologie** : identique à la vague 1 — voir
`2026-09-13-revue-litterature-oxalate-vague1.md` pour le protocole complet (limites générales,
méthode de dosage HPLC vs enzymatique, total vs soluble, cru vs cuit).

## ⚠️ Avertissement sur le périmètre réel de ce lot

Le fichier de travail fourni pour cette tâche
(`scratchpad/lot_laitiers_boissons_gras.txt`, 100 lignes) **ne contient pas** les laits
végétaux, yaourts végétaux, fromages ni matières grasses annoncés dans la consigne — c'est une
erreur de découpage en amont (décalage d'indices lors de la préparation des lots). Le fichier
réellement fourni couvre en réalité :

- Jus de fruits et légumes (25 entrées)
- Thé glacé / mate / herbal (thé noir et vert déjà traités en vague 1, réutilisés ci-dessous)
- Alcool (bière, cidre, spiritueux, vin), eau de coco, soda
- Sucreries et dérivés du cacao (chocolats, sirops, confitures, miel, sucre)
- Condiments et débuts de la section épices (Adobo, mole sauce, tahini, moutarde, vinaigre...)
- Les 2 premières entrées « Herbs and Spices » (Allspice, Almond Extract)

**Les laits végétaux, yaourts, fromages et matières grasses n'ont donc PAS été traités ici** —
ils devront être couverts dans un lot séparé ultérieur, avec le fichier correctement régénéré
depuis la base JSON. Ce document couvre fidèlement le contenu réel du fichier reçu, sans
inventer de données sur des catégories absentes.

---

## 1. Jus de fruits et légumes

**Source principale identifiée** : Siener R, Seidler A, Voss S, Hesse A (2016). *The oxalate
content of fruit and vegetable juices, nectars and drinks.* Journal of Food Composition and
Analysis, 45, 108-112. DOI: 10.1016/j.jfca.2015.10.004. Étude de 13 jus de légumes et 19 jus/
nectars de fruits du commerce (Bonn, Allemagne), méthode HPLC-réacteur enzymatique — source
indépendante de haute qualité méthodologique.

| Aliment | Base locale (OHF) | Littérature indépendante (Siener et al. 2016) | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Jus de betterave | 66,0 mg/100g | 60,1–70,0 mg/100mL | Faible | **Haute** | Excellent accord ; confirmé comme le jus le plus riche avec le nectar de rhubarbe. |
| Jus de pomme | 1,0 mg/100g | 0,87 mg/100mL | Faible | **Haute** | Très bon accord. |
| Jus de raisin (rouge) | 2,0 mg/100g | 3,93 mg/100mL | Modéré | Moyenne | Base locale plus basse mais même ordre de grandeur (faible en absolu). |
| Jus de raisin (vert) | 1,0 mg/100g | 1,50 mg/100mL | Faible | **Haute** | Bon accord. |
| Jus de tomate | 5,0 mg/100g | <10 mg/100mL (valeur exacte non isolée dans les résumés consultés) | Non quantifiable précisément | Moyenne | Cohérent avec la fourchette générale « tous les autres jus <10 mg/100mL » de l'étude. |
| Jus d'orange | 1,0 mg/100g | <10 mg/100mL (valeur exacte non isolée) ; fruit entier 2,07–10,64 mg/100g [autre source] | Cohérent | Moyenne | Idem — pas de valeur isolée précise trouvée pour le jus seul dans les extraits disponibles. |
| Jus de pamplemousse | 0,0 mg/100g | <10 mg/100mL | Cohérent | Moyenne | — |
| Jus de canneberge | 1,0 mg/100g | <10 mg/100mL | Cohérent | Moyenne | — |
| Jus de grenade | 3,0 mg/100g | <10 mg/100mL | Cohérent | Moyenne | — |
| Jus de citron | 1,0 mg/100g | <10 mg/100mL | Cohérent | Faible | — |
| Jus de citron vert | 2,0 mg/100g | Pas de valeur isolée trouvée | — | Faible | — |
| Jus d'ananas | 1,0 mg/100g | <10 mg/100mL | Cohérent | Moyenne | — |
| Jus de prune | 3,0 mg/100g | <10 mg/100mL | Cohérent | Faible | — |
| Jus de groseille rouge/cassis | 1,0 mg/100g | <10 mg/100mL | Cohérent | Faible | — |
| Jus d'abricot / nectar | 2,0–4,0 mg/100g | <10 mg/100mL | Cohérent | Faible | — |
| Jus de légumes (mix) | 9,0 mg/100g | Pas de valeur isolée trouvée pour un mix générique | — | Faible | — |
| Jus de carotte | 9,0 mg/100g | Pas de valeur isolée trouvée | — | Faible | — |
| Jus de cerise | 1,0 mg/100g | Pas de valeur isolée trouvée | — | Faible | — |
| Jus de star fruit / carambole (doux et acide) | 202,0 / valeur non lue | Pas de source indépendante trouvée (le fruit entier a été traité en vague 1, écart notable variété-dépendant déjà documenté) | — | Faible | Valeur base locale très élevée (202 mg/100g) cohérente avec le statut de la carambole comme fruit à très haute teneur, déjà noté en vague 1 pour le fruit entier. |
| Jus de bitter gourd/margose | 27,0 mg/100g | Une étude dédiée existe : *Oxalate content of raw, wok-fried, and juice made from bitter gourd fruits* (PMC6261200) — non exploitée en détail dans ce lot faute de temps, valeur non extraite | — | Faible | À approfondir : source directement pertinente identifiée mais non lue en détail. |

**Synthèse jus** : bon accord global. Le point le plus solide est la confirmation indépendante
que **betterave et rhubarbe dominent nettement** la catégorie, avec toutes les autres valeurs
sous 10 mg/100mL — cohérent avec la base locale qui place la quasi-totalité des jus en « faible »
sauf betterave, star fruit et quelques valeurs « élevé »/« très élevé » qui semblent être des
erreurs de classification automatique (voir section 4).

## 2. Thé glacé, thé mate, thé herbal

**Source** : Siener R, Seidler A, Hesse A (2017). *Oxalate content of beverages.* Journal of Food
Composition and Analysis. DOI non confirmé dans les résumés consultés — ScienceDirect
S0889157517302132. Étude complémentaire à celle de 2016 (même équipe, même méthode HPLC-réacteur
enzymatique), portant sur thés, boissons alcoolisées et softs drinks.

| Aliment | Base locale (OHF) | Littérature indépendante (Siener et al. 2017) | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Thé glacé (iced tea) | 7,0 mg/100g | 0,28–1,96 mg/100mL | **Important** (base locale 3,5 à 25× plus haute) | Moyenne | Divergence notable — possiblement une différence de préparation (thé glacé maison infusé fort vs boisson industrielle diluée testée par Siener), ou catégorie hétérogène dans la base locale (« Multiple Brands » sans distinction du type de thé de base). À signaler comme point de vigilance. |
| Thé herbal (variétés) | 2,0 mg/100g | 0,08–1,82 mg/100mL | Faible à modéré | Moyenne | Bon accord global, base locale dans la fourchette haute. |
| Thé mate | 6,0 mg/100g | Pas de valeur isolée « maté » trouvée dans cette étude (probablement inclus dans « thé herbal » ou non testé séparément) | — | Faible | Le maté a une composition différente du thé/tisane classique (caféine, xanthines) ; pas de confrontation directe possible avec les sources consultées ici. |
| Thé noir infusé | 11,0 mg/100g | *(déjà traité en vague 1 — voir ce document pour le détail du problème d'unité feuilles sèches vs boisson)* | — | — | Renvoi vague 1. |
| Thé vert infusé | 9,0 mg/100g | *(déjà traité en vague 1)* | — | — | Renvoi vague 1. |

**Point notable** : Siener et al. 2017 rapportent aussi que thé noir et vert infusés (dans leur
propre protocole, boisson prête à boire) sont à **3,21–6,34 mg/100mL** — une valeur bien plus
directement comparable à la base locale que les données « mg/g feuilles sèches » utilisées en
vague 1. Cela **encadre bien** les valeurs base locale de thé noir (11,0, légèrement au-dessus)
et thé vert (9,0, dans la fourchette haute). Ce point améliore la confiance donnée en vague 1
pour ces deux aliments — passer de « Faible-Moyenne » à **Moyenne-Haute** serait justifié en
tenant compte de cette source complémentaire.

## 3. Alcool et eau de coco

| Aliment | Base locale (OHF) | Littérature indépendante (Siener et al. 2017 sauf mention) | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Bière (+ cidre, hard seltzer) | 1,0 mg/100g | Étude Siener : 0,3–1,78 mg/100mL (bière sans alcool en haut de fourchette) ; étude polonaise indépendante (PubMed 22642068, dosage acide oxalique dans la bière) : 1,8–30,3 mg/L = 0,18–3,03 mg/100mL | Faible à modéré selon la source | Moyenne | Deux études indépendantes convergent globalement vers un ordre de grandeur bas (<3 mg/100mL), cohérent avec la base locale. La fourchette haute de l'étude polonaise (3,03) dépasse légèrement la valeur base locale — à noter, pas alarmant. |
| Spiritueux distillés | 1,0 mg/100g | Pas de valeur isolée trouvée (les spiritueux distillés, sans résidu végétal significatif, sont attendus proches de zéro) | — | Faible | Plausible par raisonnement (distillation), non vérifié empiriquement dans cette recherche. |
| Vin | 0,0 mg/100g | 0,30 mg/100mL (vin blanc, Siener et al. 2017) ; « oxalate des vins plus bas que celui des jus de fruits correspondants » | Faible | **Haute** | Bon accord, base locale légèrement sous-estimée par arrondi mais cohérente. |
| Eau de coco | 7,0 mg/100g | Pas de source indépendante trouvée dans ce lot | — | Faible | À rechercher en vague 3 si cet aliment est jugé prioritaire. |
| Soda (avec/sans sucre) | 0,0 mg/100g | « Boissons soft/wellness/énergie/sport <0,81 mg/100mL » [Siener et al. 2017] | Faible | **Haute** | Bon accord. |

## 4. Sucreries, chocolat, condiments (aperçu, confrontation partielle)

Cette section n'a pas bénéficié du même niveau de recherche dédiée que les jus/thé/alcool
ci-dessus (volume trop important pour ce lot) ; elle documente surtout ce qui a été trouvé de
façon incidente ou déjà couvert en vague 1.

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Cacao/cacao en poudre, chocolat noir | 656,0 mg/100g | *(déjà traité en vague 1 — bon accord)* | — | — | Renvoi vague 1. |
| Chocolat noir (candy bar) | 232,0 mg/100g | *(déjà traité en vague 1 — bien confirmé, 34 échantillons 13 pays)* | — | — | Renvoi vague 1. |
| Chocolat blanc | 8,0 mg/100g | Pas de source indépendante trouvée dans ce lot | — | Faible | Plausible par raisonnement : le chocolat blanc ne contient pas de matière sèche de cacao (source principale d'oxalate), donc une valeur basse est cohérente qualitativement. |
| Mole sauce (verte/rouge/noire/amande) | 12,0–321,0 mg/100g selon variante | Aucune étude quantitative directe trouvée. Une étude sur la biodisponibilité (essai clinique PubMed, "Snacks and urinary oxalate: almonds or chocolate?") confirme que l'amande élève significativement l'oxalurie contrairement au chocolat — cohérent qualitativement avec le fait que la variante « amande » (245,0) et « rouge » (321,0, contient souvent chili + chocolat + épices) soient les plus élevées dans la base locale, mais aucune valeur chiffrée indépendante pour confronter. | Non quantifiable | Faible | Confrontation qualitative seulement. |
| Tahini (Condiments, dry roasted sesame) | 273,0 mg/100g | Une étude dédiée existe (*The Oxalate Content of Sesame Seeds and Related Foods*, Springer, incluant Tahina et Halava) mais accès bloqué (paywall) — valeur chiffrée non extraite. Confirme au moins l'existence d'une littérature ciblée sur ce produit précis. | Non quantifiable dans ce lot | Faible | Cette même lacune (tahini) avait déjà été identifiée en vague 1 pour une entrée voisine — la source Springer identifiée ici est une piste concrète à exploiter en vague 3. |
| Épices, Allspice (piment de la Jamaïque) | 1075,0 mg/100g | Pas de valeur isolée trouvée pour l'allspice spécifiquement. Une étude sur 10 épices indiennes (PMID 22492273, *Plant Foods for Human Nutrition*, 2012) trouve une fourchette totale de 194 (muscade) à 4014 (cardamome verte) mg/100g MS pour des épices comparables (matière sèche) — l'ordre de grandeur de 1075 mg/100g pour l'allspice **n'est pas incohérent** avec cette fourchette générale des épices séchées, mais ce n'est pas une confrontation directe (épice différente). | Non comparable directement | Faible | Même étude signale un point cliniquement pertinent : la cannelle courante serait à ~1675 mg/100g et la cannelle de Ceylan à ~1180 mg/100g — si ces aliments sont présents ailleurs dans la base locale, prioritaire à vérifier en vague 3. |

## 5. Constat méthodologique complémentaire

Deux articles de la même équipe (Siener, Seidler, Hesse et al., Bonn) forment un ensemble
cohérent et de haute qualité méthodologique (HPLC-réacteur enzymatique, nombreux échantillons
commerciaux) pour toute la catégorie boissons :

- Siener R, Seidler A, Voss S, Hesse A (2016). *The oxalate content of fruit and vegetable
  juices, nectars and drinks.* J Food Compos Anal, 45, 108-112.
  DOI: 10.1016/j.jfca.2015.10.004.
- Siener R, Seidler A, Hesse A (2017). *Oxalate content of beverages.* J Food Compos Anal.
  ScienceDirect ID S0889157517302132 (DOI exact non confirmé dans les résumés consultés).

Ces deux études sont probablement les meilleures sources indépendantes disponibles pour
recalibrer toute la catégorie « boissons » de la base locale — nettement plus fiables que les
comparaisons obtenues en vague 1 pour le thé (qui souffraient du problème d'unité feuilles
sèches/boisson). **Recommandation** : en vague 3 ou lors d'une éventuelle recalibration de la
base, prioriser l'accès au texte intégral de ces deux articles (actuellement non obtenu,
seulement résumés/citations tierces) pour extraire la totalité des ~32 boissons testées.

## 6. Aliments sans confrontation possible dans ce lot

- Eau de coco
- Jus de citron vert, de carotte, de cerise (valeurs isolées non trouvées, seulement bornées par
  la fourchette générale « <10 mg/100mL » de l'étude Siener)
- Jus de bitter gourd (source dédiée identifiée mais non exploitée en détail)
- Toutes les entrées « Jellies, Jams or Preserves » (aucune recherche dédiée effectuée, hors
  périmètre de temps de ce lot)
- Mole sauce (confrontation qualitative seulement, pas de valeur chiffrée)
- Tahini (source identifiée mais bloquée par paywall)
- Baking powder/soda, cream of tartar, gelatine (composés chimiques ou dérivés non végétaux,
  faible priorité scientifique — vraisemblance a priori de valeurs proches de zéro sauf
  contamination/additifs, non vérifiée)

## 7. Hors périmètre de ce document — à traiter séparément

**Laits végétaux, yaourts végétaux, fromages et produits laitiers, matières grasses** (beurre,
margarine, huiles) — ces catégories étaient dans la consigne initiale de ce lot mais absentes du
fichier de travail réellement fourni. Étant donné leur pertinence clinique forte (lait d'amande
et lait de soja réputés riches en oxalate d'après la littérature générale sur les laits
végétaux), elles devraient être traitées en priorité dans un lot dédié correctement régénéré
depuis `src/data/oxalate-database.json`.

## 8. Bibliographie consolidée de ce lot

1. Siener R, Seidler A, Voss S, Hesse A (2016). *The oxalate content of fruit and vegetable
   juices, nectars and drinks.* Journal of Food Composition and Analysis, 45, 108-112.
   DOI: 10.1016/j.jfca.2015.10.004. [Résumé et citations tierces consultés ; texte intégral non
   obtenu — accès ScienceDirect payant.]
2. Siener R, Seidler A, Hesse A (2017). *Oxalate content of beverages.* Journal of Food
   Composition and Analysis. ScienceDirect S0889157517302132. [Résumé et citations tierces
   consultés ; texte intégral non obtenu.]
3. Étude polonaise sur l'acide oxalique dans la bière — PubMed PMID 22642068 (titre original en
   polonais, traduction anglaise : *The evaluation of anti-nutritive components in beer on the
   example of oxalic acid*). [Résumé consulté via traduction ; auteurs et journal exacts non
   confirmés dans cette recherche.]
4. Étude sur les épices indiennes — PubMed PMID 22492273, *Total and soluble oxalate content of
   some Indian spices*, Plant Foods for Human Nutrition, 2012. [Résumé consulté ; auteurs
   précis et texte intégral non obtenus, accès Springer bloqué par authentification.]
5. *The Oxalate Content of Sesame Seeds and Related Foods* (incluant tahini/halava), Springer.
   [Existence confirmée via recherche ; aucune valeur chiffrée extraite, accès bloqué.]
6. *Snacks and urinary oxalate: Which wins, almonds or chocolate?* PubMed PMID 41083049.
   [Résumé consulté — pertinent pour la biodisponibilité, pas pour la teneur brute.]
7. *Oxalate content of raw, wok-fried, and juice made from bitter gourd fruits.* PMC6261200.
   [Existence confirmée, non exploité en détail dans ce lot.]

**Avertissement bibliographique** : comme en vague 1, plusieurs références ci-dessus n'ont pas
été vérifiées par accès au texte intégral (paywalls ScienceDirect/Springer systématiques
rencontrés dans cette session). Les valeurs numériques rapportées proviennent des résumés
structurés retournés par la recherche web, pas d'une lecture directe des tableaux de données
originaux — à revérifier avant toute utilisation dans une recalibration formelle de la base.
