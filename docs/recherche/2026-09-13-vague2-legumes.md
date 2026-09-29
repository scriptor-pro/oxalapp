# Revue de littérature — Vague 2, lot LÉGUMES (107 entrées)

**Date** : 2026-09-13
**Méthodologie** : voir `2026-09-13-revue-litterature-oxalate-vague1.md` pour le protocole complet
(sources consultées, limites générales sur OHF/USDA, variabilité intrinsèque, HPLC vs
enzymatique, total vs soluble, cru vs cuit). Ce document applique le même protocole au lot
« légumes » de la base locale (107 entrées).

« Base locale » = valeur `avgOxalatePer100g` actuelle dans `oxalate-database.json` (source : OHF).
Valeurs en mg d'oxalate/100 g sauf indication contraire.

---

## 1. Aliments déjà traités en vague 1 (repris tels quels)

| Aliment | Base locale | Littérature indépendante | Confiance | Voir vague 1 |
|---|---|---|---|---|
| Épinard, bouilli | 567,0 | Pas de valeur bouillie isolée ; cru 329,6–2350 selon variété/saison | Faible | §2.1 |
| Blette (Swiss chard) | 657–1167 selon variété/forme | 874–1458,1 total cru ; feuilles 525,5 / tiges 127,4 | Moyenne | §2.1 |
| Betterave, bouillie | 57,0 | 36,9–76,0 cru | **Haute** | §2.1 |
| Oseille, crue/bouillie | 779,0 / 582,0 | 1079 soluble (1 source, méthode ancienne) | Faible | §2.1 |
| Rhubarbe, crue | 1060,0 | 986–1235 (3 sources convergentes) | **Haute** | §2.1 |
| Poireau, cru | 17,0 | 17,0–48,6 | Moyenne | §2.1 |
| Patate douce | 126,0 / 42,0 | Aucune trouvée | Faible | §2.1 |
| Persil | 110,0 / 1127,0 séché | 136–270,7 (frais) | Faible-Moyenne | §2.1 |
| Taro, feuilles crues | 652,0 | 300,2–721,9 | **Haute** | §2.1 |
| Amarante, grain | 151,0 | Non comparable (littérature = feuilles, base locale = grain) | Faible | §2.1 |
| Gombo/Okra, bouilli | 101,0 | 317,2 cru / 56,3 soluble (formes non alignées) | Faible-Moyenne | §2.1 |

## 2. Nouveaux aliments confrontés en vague 2

### 2.1 Bien documentés (revue MDPI Salgado et al. 2023, tableau 5)

| Aliment | Base locale | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Artichaut, bouilli | 13,0 | 6,8 total cuit [Salgado et al. 2023, réf. interne 1] | Modéré (base locale ~2× la valeur trouvée) | Moyenne | Un seul point de comparaison ; ordre de grandeur cohérent (faible teneur). |
| Asperge, bouillie/vapeur | 6,0 | 2,6 total / 0,9 soluble cuit [Salgado et al. 2023] | Modéré | Moyenne | Base locale plus haute mais même catégorie « faible-modéré ». |
| Pousses de bambou | 23,0 | Cultivées crues 222 total/163 soluble ; cultivées cuites 93/51 ; marinées cuites 51/10 [Salgado et al. 2023, réf. 61] | **Très important** | Faible-Moyenne | Écart massif (facteur 2 à 10) — la base locale (23,0) est bien en dessous de toute forme trouvée dans la littérature indépendante. Point d'attention prioritaire : la valeur base locale pourrait sous-estimer fortement cet aliment, ou correspondre à une préparation/variété très différente (en conserve rincée ?). |
| Brocoli, cru | 12,0 | 16,1 total/11,6 soluble cru [réf. 32] ; 1,4 total cru [réf. 1] | Large fourchette inter-études (1,4 à 16,1) | Faible | Deux sources indépendantes en désaccord fort entre elles (facteur ~10) — la base locale tombe entre les deux, ce qui n'est pas une confirmation solide vu la dispersion de la littérature elle-même. |
| Brocoli, bouilli/vapeur | 7,0 | 10,1 total/6,6 soluble cuit [réf. 32] | Faible | Moyenne | Bon accord avec au moins une source. |
| Choux de Bruxelles, bouillis | 4,0 | 1,2 total cuit [réf. 1] | Modéré (facteur ~3) | Faible | Un seul point de comparaison, faible enjeu absolu (aliment pauvre en oxalate dans les deux cas). |
| Chou, cru | 5,0 | Non détecté [réf. 40] ; 7 total cru [réf. 61] | Faible | Moyenne | Cohérent : aliment très pauvre en oxalate, confirmé par 2 sources indépendantes. |
| Chou, bouilli | 4,0 | 5 total/4 soluble cuit [réf. 61] | Faible | **Haute** | Bon accord. |
| Carotte, crue | 24,0 | 29–49 total/24–28 soluble [réf. 36, 61] ; 16,4 total [réf. 40] ; 17,8 total/9,0 soluble [réf. 1] | Important (facteur ~3 entre sources indépendantes elles-mêmes) | Faible-Moyenne | La base locale (24,0) tombe dans la fourchette basse-moyenne de 4 sources qui divergent déjà beaucoup entre elles. |
| Carotte, bouillie/conserve | 12,0 | 12–26 total/7–14 soluble [réf. 36, 61] | Faible | Moyenne | Bon accord, base locale en borne basse. |
| Céleri, cru | 25,0 | 23,2 total [réf. 40] | Faible | **Haute** | Excellent accord (<10 % d'écart). |
| Céleri-rave, conserve | 7,0 | Voir §2.2 (étude racines congelées) — pas de valeur céleri-rave isolée extraite avec certitude dans cette vague | — | Faible | — |
| Chou-fleur, cru/bouilli | 3,0 | Cru : 27 total (soluble non détecté) [réf. 61] ; non détecté [réf. 40] | Incohérent entre sources indépendantes elles-mêmes | Faible | Deux sources indépendantes se contredisent (27 vs non détecté) — la base locale (3,0) est proche de la seconde. Illustre bien la variabilité/incertitude analytique pour les aliments à très faible teneur. |
| Chou-fleur, cuit | — | 8 total cuit [réf. 61] | — | Faible | Pas d'entrée « cuit » isolée dans la base locale sous ce nom exact à vérifier. |
| Concombre | 4,0 | Non détecté [réf. 40] ; 0,4 total [réf. 1] | Faible | **Haute** | Cohérent : aliment quasi sans oxalate, confirmé par 2 sources. |
| Aubergine, crue | — (base locale regroupe crue/cuite) | 55 total/45 soluble (longue) [réf. 61] ; 54,4/53,7 [réf. 40] — deux sources indépendantes en bon accord | Faible | **Haute** | Deux sources convergent autour de 54-55 mg/100g cru. |
| Aubergine, cuite | 62,0 | 38 total/19 soluble [réf. 61] ; 12,8 total/4,8 soluble [réf. 1] | Important (facteur ~3 à 5 entre études, et vs base locale) | Faible | Grande dispersion inter-études elle-même ; base locale au-dessus de toutes les valeurs cuites trouvées — à vérifier (forme/variété non précisée dans base locale : « raw, boiled, baked or roasted » regroupées en une seule entrée alors que la littérature montre des écarts significatifs entre méthodes de cuisson). |
| Fenouil, cru | — | 19,7 total/17,2 soluble [réf. 1] | — | Faible | Pas d'entrée « cru » isolée dans la base locale (seulement « bouilli »). |
| Fenouil, bouilli | 5,0 | 5,3 total cuit [réf. 1] | Faible | **Haute** | Excellent accord (<10 %). |
| Ail, cru | 9,0 | Non détecté [réf. 40, 59] (deux sources indépendantes convergentes) | **Important** (base locale nettement supérieure) | Faible-Moyenne | Deux sources indépendantes ne détectent aucun oxalate dans l'ail, alors que la base locale indique 9,0 mg/100g (classé « faible » mais non nul). Écart notable en valeur relative, quoique faible en absolu — possible artefact de méthode de détection (seuil de détection variable selon les études). |
| Champignons, en conserve/cuits | 1,0 | 0,7 total conserve / 0,5 total cuit [réf. 1] | Faible | **Haute** | Excellent accord. |
| Champignons, crus/séchés | 76,0 (séchés) | Crus : deux groupes de sources très divergents — 320-482 soluble [réf. 54,76,78] vs 36-41 soluble [réf. 79,82] (facteur ~10 entre études indépendantes elles-mêmes) | **Très important**, mais dispersion interne à la littérature | Faible | Un des cas les plus marquants de désaccord entre études indépendantes de cette vague — impossible de trancher une valeur consensus pour le champignon cru avec les sources trouvées ici ; nécessiterait l'accès aux articles complets (non obtenu dans cette vague) pour comprendre l'origine de l'écart (espèce, méthode). |
| Oignon, cru | 5,0 | Non détecté [réf. 40] ; 1,7 total [réf. 1] | Faible | Moyenne | Cohérent, aliment très pauvre en oxalate. |
| Oignon, bouilli/sauté | 4,0 | Pas de valeur cuite isolée trouvée | — | Faible | — |
| Oignons verts / échalotes (proxy) | Shallots : 2,0 | 33,3 total/28,2 soluble pour « spring/green onions » [réf. 40] — **attention, ce n'est pas la même espèce que l'échalote (Allium ascalonicum) de la base locale, plutôt un proxy oignon nouveau/ciboule** | Non directement comparable | Faible | À traiter avec prudence — confusion d'espèce possible, ne pas utiliser tel quel pour valider/invalider la valeur échalote. |
| Poivron, cru | 20,0 | 31,0 total/27,5 soluble [réf. 40] | Modéré | Moyenne | Base locale plus basse mais même ordre de grandeur. |
| Poivron, cuit | 19,0 | Pas de valeur cuite isolée trouvée | — | Faible | — |
| Pomme de terre, bouillie avec peau | 21,0 | 24,3 total/12,8 soluble [réf. 1] | Faible | **Haute** | Bon accord (<20 % d'écart). |
| Pomme de terre, au four | 46,0 | 13,0 total/11,7 soluble (au four) [réf. 1] | **Important** (base locale ~3,5× supérieure) | Faible-Moyenne | Écart notable pour la cuisson au four spécifiquement — la base locale distingue peau/sans peau différemment de la source, ce qui peut expliquer une partie de l'écart (peau incluse = plus concentré). |
| Pomme de terre, frite | 32,0 | 26,9 total/17,0 soluble [réf. 1] | Faible | Moyenne | Bon accord. |
| Pomme de terre, chips | — | 47,0 total/45,8 soluble [réf. 1] | — | Faible | Pas d'entrée « chips » dans ce lot légumes (voir lot « transformés »). |
| Pomme de terre, crue | — | 17,1 total/13,0 soluble [réf. 1] | — | Faible | Base locale ne semble pas avoir d'entrée « crue » isolée. |
| Citrouille, conserve | 6,0 | Non détecté [réf. 40, 1] | Modéré (en absolu très faible) | Moyenne | Cohérent : deux sources indépendantes convergent sur une teneur quasi nulle, la base locale (6,0) reste dans la catégorie « faible/modéré ». |
| Radis, cru (rouge) | 1,0 | 1,7 total (rouge) [réf. 1] | Faible | **Haute** | Excellent accord. |
| Radis, cru (blanc) | 1,0 | Non détecté (blanc) [réf. 1] | Faible | Moyenne | Cohérent, aliment très pauvre en oxalate. |
| Tomate, crue | 9,0 | 8,5–11 total/3,6–7 soluble [réf. 1, 61] | Faible | **Haute** | Excellent accord, 2 sources convergentes. |
| Tomate, conserve | 9,0 | 12,7 total/3,1 soluble (pelées) [réf. 1] | Faible | Moyenne | Cohérent. |
| Cresson, cru | 8,0 | Non détecté [réf. 1] | Modéré en valeur relative, faible en absolu | Moyenne | Écart de détection plutôt que de teneur réelle vu les faibles valeurs en jeu. |

*Note sur les références numérotées* : les crochets [réf. N] renvoient à la numérotation interne
de Salgado et al. (2023) telle qu'affichée dans le tableau 5 de l'article (accès PMC). La
bibliographie complète correspondant à ces numéros (auteurs/année/journal exacts pour réf. 32,
36, 40, 54, 59, 61, 76, 78, 79, 82) n'a **pas pu être récupérée** dans cette vague — les tentatives
d'accès à la liste de références complète de l'article (PMC et MDPI) ont échoué (403 ou contenu
non exposé par l'outil de récupération). **Ces citations sont donc à considérer comme
provisoires/secondaires** (citées via l'article de synthèse, pas vérifiées à la source) tant que
la bibliographie complète n'est pas récupérée — voir recommandations en fin de document.

### 2.2 Racines et tubercules — étude dédiée sur légumes-racines congelés

Source : étude peer-reviewed sur betterave, carotte, céleri-rave et panais après congélation/
cuisson (titre : *Effect of processing and cooking on total and soluble oxalate content in
frozen root vegetables prepared for consumption*). **Auteurs et journal exacts non confirmés
dans cette vague** — accès direct refusé (403) sur ResearchGate et ScienceDirect ; seul un
résumé de moteur de recherche a été exploité.

| Aliment | Base locale | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Betterave (racine), fraîche | — | 105 total/82 soluble mg/100g frais — la plus riche des 4 racines étudiées | — | Faible | Cohérent avec le classement « très élevé » de la betterave dans la base locale, mais valeur non directement comparable (forme fraîche vs bouillie de la base locale, déjà traitée en vague 1 à 57 mg/100g bouillie — cohérent car la cuisson réduit la teneur). |
| Panais, bouilli | 12,0 | ~40 mg/100g cru (source secondaire, site non académique, à vérifier) ; étude root vegetables confirme présence mais valeur panais non isolée dans le résumé accessible | Non tranché | Faible | Aucune valeur peer-reviewed directement extraite avec certitude pour le panais dans cette vague — trou partiel. |
| Céleri-rave, conserve | 7,0 | Mentionné dans l'étude comme un des 4 légumes testés, valeur non extraite du résumé accessible | — | Faible | Trou — accès au texte complet nécessaire. |

### 2.3 Nopal / cactus (Opuntia)

| Aliment | Base locale | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Nopal, cru | 152,0 | Étude sur maturité des raquettes : 4,3–11,5 mg/**g de matière sèche** (soit ~430-1150 mg/100g MS selon stade de maturité) [López-Palacios et al., *Journal of Food Composition and Analysis*, auteurs/année exacts non confirmés — 403 sur ScienceDirect/Academia] | Non directement comparable (MS vs frais) | Faible | La conversion MS→frais dépend de la teneur en eau du nopal (~90-95%), ce qui pourrait ramener la fourchette de l'étude à un ordre de grandeur compatible avec la base locale, mais ce calcul n'a pas pu être vérifié faute d'accès au texte complet (teneur en eau non confirmée dans le résumé). À retraiter en vague 3 si accès obtenu. |
| Nopal, cuit | 116,0 | Pas de valeur cuite isolée extraite | — | Faible | — |

### 2.4 Pourpier (Purslane) — écart majeur détecté

| Aliment | Base locale | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Pourpier, feuilles | 621,0 | Zherkova et al. (2025), *Plants* (Basel) : oxalate total frais 2520–7970 mg/100g FW (frais), 1907-4350 mg/100g pour la forme blanchie | **Considérable** (facteur 4 à 13 supérieur à la base locale) | Faible | **Écart le plus important détecté dans tout le lot légumes.** Deux réserves importantes : (1) méthode de dosage par titration KMnO₄ (moins spécifique/fiable que HPLC, peut sur-estimer en présence d'autres acides organiques réducteurs) ; (2) c'est une source unique, récente (2025), non recoupée avec une deuxième étude indépendante dans cette vague. Ne pas modifier la base locale sur cette seule source sans recoupement — mais **priorité haute pour vague 3** : chercher une deuxième étude sur le pourpier (HPLC de préférence) pour trancher entre un facteur d'erreur méthodologique et une vraie sous-estimation de la base locale/OHF. |

## 3. Aliments sans confrontation indépendante trouvée (trous)

- **Algues (nori, kombu, wakame)** — aucune étude peer-reviewed dédiée trouvée ; seules des
  bases grand public (OxalateGuard, oxalatecontent.com, qui semblent elles-mêmes dériver de
  l'OHF) donnent des valeurs, non indépendantes de la base locale.
- **Moutarde (feuilles), fenouil cru isolé, panais (valeur chiffrée fiable), céleri-rave
  (valeur chiffrée), échalote (au sens strict), navet, igname, maïs doux (sweet corn
  spécifiquement — une étude existe sur maïs génétiquement modifié mais l'accès au texte
  complet donnant la valeur de référence non-OGM a échoué, 403)** — pas de confrontation
  chiffrée fiable obtenue dans cette vague.
- **Rutabaga, radicchio, fenouil bouilli déjà couvert mais pas cru isolé, jicama, kohlrabi,
  endive/escarole (sauf « non détecté » pour endive crue), fiddleheads, huazontle, roselle,
  vipergrass/salsify, water chestnuts, hearts of palm, grape leaves, good king henry** —
  aucune recherche indépendante n'a été trouvée pour ces aliments moins courants dans la
  littérature scientifique anglophone/occidentale consultée ici. Certains (huazontle, good
  king henry) sont des plantes régionales (Mexique, Europe) où la littérature existe
  probablement en espagnol ou dans des revues ethnobotaniques non couvertes par cette
  recherche en anglais/français.
- **Bibliographie complète des références numérotées de Salgado et al. (2023)** — non
  récupérée (voir note §2.1). Toutes les confrontations basées sur cet article portent donc
  une incertitude bibliographique supplémentaire tant que les références primaires exactes
  ne sont pas vérifiées.

## 4. Synthèse du lot légumes

- **~55 aliments avec au moins une valeur de comparaison chiffrée** sur les 107 de ce lot
  (en comptant les 11 déjà couverts en vague 1).
- **Bons accords (confiance haute)** : céleri, concombre, fenouil bouilli, chou bouilli,
  champignons en conserve/cuits, radis rouge, tomate crue, aubergine crue, betterave (déjà
  vague 1), rhubarbe (déjà vague 1), taro (déjà vague 1).
- **Écarts majeurs à investiguer en priorité (vague 3)** :
  1. **Pourpier** — facteur 4-13, source unique 2025, méthode moins fiable (KMnO₄).
  2. **Pousses de bambou** — base locale nettement sous la littérature (facteur 2-10).
  3. **Champignons crus** — désaccord massif (facteur ~10) *entre études indépendantes
     elles-mêmes*, avant même comparaison à la base locale.
  4. **Pomme de terre au four** — base locale ~3,5× supérieure à la seule source trouvée.
  5. **Ail** — deux sources indépendantes ne détectent aucun oxalate, base locale à 9,0 mg/100g.
- **Limite transversale** : une bonne partie des confrontations de ce lot repose sur des
  citations secondaires (numéros de référence d'un article de synthèse) dont la bibliographie
  primaire n'a pas pu être vérifiée dans le temps imparti — à corriger avant toute utilisation
  de ces valeurs pour recalibrer la base locale.

## 5. Bibliographie consolidée (lot légumes)

1. Salgado N, Silva MA, Figueira ME, Costa HS, Albuquerque TG (2023). *Oxalate in Foods:
   Extraction Conditions, Analytical Methods, Occurrence, and Health Implications.* Foods,
   12(17), 3201. DOI: 10.3390/foods12173201. PMC10486698. [Texte intégral consulté ; tableau 5
   exploité en détail. Bibliographie des références numérotées internes 1, 32, 36, 40, 54, 59,
   61, 76, 78, 79, 82 non récupérée.]
2. Judprasong K, Charoenkiatkul S, Sungpuag P, Vasanachitt K, Nakjamanong Y (2006). *Total and
   soluble oxalate contents in Thai vegetables, cereal grains and legume seeds and their
   changes after cooking.* Journal of Food Composition and Analysis, 19(4), 340-347.
   [Existence et auteurs confirmés via recherche ; contenu chiffré non extrait directement
   dans cette vague — étude non exploitée en détail, à faire en vague 3.]
3. Zherkova Z, Todorova M, Grozeva N, Tzanov M, Petrova A, Veleva P, Atanassova S (2025).
   *Assessment of Purslane (Portulaca oleracea L.) Total Oxalate Content, Ascorbic Acid, and
   Total Organic Acids Using Near-Infrared Spectroscopy.* Plants (Basel). PMC12656633. [Texte
   intégral consulté avec succès.]
4. Étude sur nopal (Opuntia ficus-indica var. redonda) à différents stades de maturité —
   *Evaluation of oxalates and calcium in nopal pads*, Journal of Food Composition and
   Analysis. [Auteurs/année non confirmés dans cette vague, accès direct refusé (403) ;
   valeurs obtenues via résumé de recherche uniquement.]
5. Étude sur légumes-racines congelés (betterave, carotte, céleri-rave, panais) — *Effect of
   processing and cooking on total and soluble oxalate content in frozen root vegetables
   prepared for consumption*. [Auteurs/année/journal exacts non confirmés dans cette vague,
   accès direct refusé (403) ; seule la valeur betterave a pu être extraite via résumé.]
6. Kasidas GP, Rose GA. *Oxalate content of some common foods: determination by an enzymatic
   method.* [Référence repérée mais non exploitée en détail dans cette vague — pertinente pour
   vague 3.]
7. *Oxalate content in common Japanese foods* (1984), Vol. 30, No. 3 — méthode radio-enzymatique.
   [Auteurs exacts non confirmés ; PDF localisé au dépôt institutionnel de Kyoto University mais
   non extractible par l'outil de récupération dans cette vague (probable scan image). Confirme
   qualitativement une forte teneur en épinard, perilla, poivron, sésame, chocolat, thé — pas
   de valeur chiffrée nouvelle extraite pour ce lot légumes.]

**Avertissement bibliographique** : comme en vague 1, plusieurs références ci-dessus n'ont pas
pu être vérifiées par accès direct au texte intégral (accès payant/403). Document de travail
interne, pas une synthèse prête à publication scientifique.

## 6. Recommandations pour la vague 3

1. **Pourpier** en priorité absolue — écart le plus important détecté, une seule source.
2. Tenter l'accès via Google Scholar / sci-hub-like légal (ex. auteur direct, ResearchGate
   "request full-text") pour Judprasong et al. 2006 (Thai vegetables) — couvrirait
   potentiellement plusieurs trous de ce lot (panais, navet, maïs, échalote proches).
3. Récupérer la bibliographie complète de Salgado et al. 2023 (PDF plutôt que HTML PMC/MDPI)
   pour transformer les citations secondaires actuelles en références vérifiées.
4. Pousses de bambou et champignons crus — écarts/dispersions les plus francs après le
   pourpier, à recouper avec une 3e source si possible.
