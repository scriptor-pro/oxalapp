# Revue de littérature — teneur en oxalate des aliments (Vague 1/3)

**Date** : 2026-09-13
**Périmètre** : aliments bruts prioritaires à fort enjeu clinique (légumes-feuilles, noix,
légumineuses, céréales, thé/cacao/café, fruits à teneur notable).
**Objectif** : confronter la base locale actuelle (`src/data/oxalate-database.json`, dérivée
exclusivement du PDF de l'OHF) à la littérature scientifique publiée indépendante, pour évaluer
si une valeur de type « consensus multi-sources » est possible et quelle incertitude réelle
(plutôt que le ±35 % générique actuellement appliqué) serait justifiée.

## 1. Méthodologie

### 1.1 Sources consultées

- **Recherche web** (WebSearch/WebFetch) sur PubMed, ScienceDirect, ResearchGate, Wiley Online
  Library, Semantic Scholar, MDPI, Academia.edu — pas d'accès à des bases payantes complètes
  (la plupart des articles ne sont accessibles qu'en résumé ou via des citations dans des
  articles tiers qui les compilent).
- **Revue de synthèse principale** : *Oxalate in Foods: Extraction Conditions, Analytical
  Methods, Occurrence, and Health Implications*, revue 2023 (MDPI, *Foods*, PMC10486698) —
  compile de nombreuses études primaires sur légumes, légumineuses, fruits ; c'est la source la
  plus riche exploitée ici pour ces catégories.
- **Articles primaires ciblés** : Noonan & Savage (1999), Chai & Liebman (2005), Savage et al.
  (nuts, plusieurs études 2000s), Charrier & Savage (2002, thé), Holmes & Kennedy (2000),
  études chinoise (Sun et al., *Southern China*) et japonaise (méthode radio-enzymatique,
  citée dans la revue MDPI).
- **Base locale de référence** : `src/data/oxalate-database.json`, valeurs `avgOxalatePer100g`
  extraites du PDF OHF (`Oxalate-List-022724.pdf`).

### 1.2 Limites générales — à lire avant les tableaux

1. **L'OHF n'est probablement pas une source primaire indépendante.** La base OHF est
   largement une compilation de la littérature académique (dont Harvard/Massey, Holmes &
   Kennedy, Chai & Liebman, Savage et al.), pas un laboratoire qui mesure lui-même. Je n'ai
   **pas pu confirmer avec certitude** la liste exacte des études sources de l'OHF (le site ne
   publie pas de bibliographie détaillée par aliment accessible facilement). **Donc une partie
   des « confrontations » ci-dessous compare probablement l'OHF à ses propres sources
   sous-jacentes plutôt qu'à des sources réellement indépendantes** — c'est une limite
   importante à garder en tête : un accord OHF/Chai&Liebman peut refléter le fait que l'OHF a
   *repris* Chai&Liebman, pas une convergence indépendante.
2. **Pas de base USDA dédiée à l'oxalate.** Contrairement à ce que suggère le CLAUDE.md du
   projet, il n'existe pas de « USDA oxalate database » officielle et maintenue comme il en
   existe une pour les macronutriments (FoodData Central n'a pas de champ oxalate). Les sites
   qui citent « USDA » pour l'oxalate renvoient en réalité, à chaque vérification possible, vers
   la base Harvard (Massey et al.) ou vers des compilations tierces. **Aucune source USDA
   primaire indépendante n'a été trouvée** pour cette vague — voir section 4.
3. **Variabilité intrinsèque énorme.** Pour beaucoup d'aliments (épinard, amarante, noix), les
   valeurs varient d'un facteur 2 à 7 **au sein même d'une seule étude** selon variété,
   saison, sol, maturité — avant même de comparer les études entre elles. Une partie de
   l'écart inter-sources n'est donc pas une « erreur » à arbitrer mais une variabilité réelle
   du produit.
4. **Méthode de dosage.** Deux familles de méthodes coexistent : HPLC (référence actuelle,
   post-1990 environ) et méthodes enzymatiques/spectrophotométriques plus anciennes ou plus
   rapides (oxalate oxidase, dichromate). Les études les plus récentes (2010s-2020s) utilisent
   presque toutes HPLC ou une méthode enzymatique validée par HPLC ; les écarts avec des études
   plus anciennes (pré-2000) sont parfois attribuables à la méthode plutôt qu'au produit.
5. **Total vs soluble.** Beaucoup d'études rapportent séparément l'oxalate **total** et
   **soluble** (biodisponible). L'OHF et la base locale ne précisent pas systématiquement
   laquelle est utilisée — à vérifier, car c'est une source de divergence majeure avec les
   études qui ne rapportent que le soluble.
6. **Cru vs cuit.** La cuisson (bouillage notamment) réduit fortement l'oxalate soluble par
   lixiviation dans l'eau. Comparer une valeur « cru » d'une étude à une valeur « bouilli » de
   l'OHF est une source d'écart artificiel si la forme n'est pas alignée — j'ai tenté d'aligner
   les formes ci-dessous mais ce n'est pas toujours possible avec les résumés disponibles.

**Conclusion méthodologique** : les tableaux ci-dessous fournissent des **fourchettes de
littérature indépendante** à mettre en regard de la valeur OHF/base locale, avec un niveau de
confiance qui reflète surtout *le nombre d'études indépendantes trouvées*, pas une certitude
absolue sur la vraie valeur physiologique (qui n'existe probablement pas comme nombre unique,
vu la variabilité intrinsèque du produit).

---

## 2. Tableaux par aliment

Valeurs en **mg d'oxalate / 100 g**, sauf indication contraire. « Base locale » = valeur
`avgOxalatePer100g` actuelle dans `oxalate-database.json` (source : OHF).

### 2.1 Légumes-feuilles et légumes verts

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Épinard, cru | — (seule entrée « bouilli » en base) | 329,6–2350 mg/100g total selon étude ; deux études citées à 460 et 390 mg/100g [revue MDPI, réf. 37-39] | **Très important** (facteur ~7) | Moyenne | Écart dominé par variété/saison/sol, documenté dans la littérature elle-même (culture hiver 1092,9 mg soluble vs automne 614,9 mg soluble dans une même étude). Une valeur unique n'a pas de sens physiologique fort pour cet aliment. |
| Épinard, bouilli/cuit | 567,0 | Pas de valeur « bouilli » isolée trouvée dans la revue MDPI (surtout du cru) | Non comparable directement | Faible | La cuisson réduit l'oxalate soluble par lixiviation ; 567 mg/100g bouilli est plausible si la valeur crue de référence est dans le haut de la fourchette (~800-900+ mg/100g cru). |
| Blette / bette à carde (Swiss chard), crue | 657,0 (vert) / 1167,0 (rouge) | 874–1458,1 mg/100g total [revue MDPI réf. 1, 40] ; feuilles 525,5 mg cru, tiges 127,4 mg cru [réf. 32] | Modéré à important | Moyenne | Confirme l'ordre de grandeur « très élevé » ; feuilles nettement plus riches que tiges — la base locale ne distingue pas feuille/tige, source d'imprécision potentielle. |
| Blette, bouillie | 335,0 (vert) / 679,0 (rouge/vert) | Pas de valeur bouillie isolée trouvée | — | Faible | — |
| Betterave-feuilles / betterave racine, bouillie | 57,0 | 36,9–76,0 mg/100g total cru [réf. 1, 32] | Faible | **Haute** | Bon accord — la base locale (bouillie) tombe dans la fourchette basse de la littérature (crue), cohérent avec l'effet cuisson. |
| Mangold / Spinach beet | 874,0 | Pas de source indépendante distincte trouvée (souvent regroupé avec chard dans la littérature) | — | Faible | À rapprocher de Swiss chard ci-dessus plutôt que traité isolément. |
| Oseille (sorrel), crue | 779,0 | 1079 mg/100g soluble [réf. 41, méthode spectrophotométrie] | Modéré | Faible | Un seul point de comparaison ; méthode plus ancienne (spectrophotométrie) potentiellement moins fiable que HPLC. |
| Oseille, bouillie | 582,0 | Pas de valeur bouillie trouvée | — | Faible | — |
| Rhubarbe, crue | 1060,0 | 1235 mg/100g total [réf. 1] ; pétioles 1080 mg/100g total [réf. 55] ; tiges 986,7 mg total / 287,3 mg soluble [réf. 32] | Faible à modéré | **Haute** | Trois sources indépendantes convergent dans une fourchette 986-1235 mg/100g total — bon accord avec la base locale (1060). |
| Rhubarbe, cuite/en conserve | 666,0 | Pas de valeur cuite isolée trouvée | — | Faible | — |
| Poireau, cru | 17,0 | 17,0–48,6 mg/100g total [réf. 1, 40] | Faible (base locale en borne basse) | Moyenne | La base locale se situe à la borne inférieure de la fourchette littérature — plausible, poireau a une variabilité modérée documentée. |
| Patate douce, cuite/bouillie | 126,0 (avec peau) / 42,0 (sans peau) | Pas de source indépendante directe trouvée dans cette vague | — | Faible | À rechercher en vague 2/3 — aliment fréquemment cité en clinique mais peu documenté dans les sources consultées ici. |
| Persil, frais | 110,0 | 136–270,7 mg/100g total [réf. 1, 40] ; soluble 72–782 mg/100g selon prép. [réf. 40, 41] | Important | Faible-Moyenne | Base locale plus basse que la littérature indépendante — écart notable, possiblement lié à la forme (frais entier vs haché/préparé) ou à la partie de plante analysée. |
| Persil, séché | 1127,0 | Pas de valeur séchée indépendante trouvée | — | Faible | Concentration attendue par déshydratation, cohérent qualitativement. |
| Taro, feuilles, crues | 652,0 | 300,2–721,9 mg/100g total, très dépendant du cultivar et du traitement [réf. 34] | Faible | **Haute** | Bon accord, la base locale tombe dans la fourchette rapportée. |
| Amarante, grain | 151,0 (grain non cuit) | Grain non trouvé isolément ; feuilles vertes ~1940 mg/100g total, feuilles violettes ~1354 mg/100g [réf. 33, 34] | Non comparable (parties différentes) | Faible | La base locale couvre le **grain** (pseudo-céréale), la littérature trouvée couvre les **feuilles** (légume) — deux produits distincts, à ne pas confondre dans l'app. |
| Gombo / Okra, bouilli | 101,0 | 317,2 mg/100g total cru / 56,3 mg soluble [réf. 63] | Modéré | Faible-Moyenne | Un seul point de comparaison, formes (cru vs bouilli) non alignées — écart plausiblement expliqué par la cuisson, mais pas confirmé. |

### 2.2 Noix et graines

C'est la catégorie où la **divergence inter-études est la mieux documentée et quantifiée**
dans la littérature elle-même — plusieurs papiers comparent explicitement leurs résultats à
ceux des études précédentes.

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Amande, crue/grillée | 369,0 | 296,1 mg/100g [étude « présente », Savage et al.] ; 383,3 mg/100g [Hönow & Hesse 2002] ; 491 mg/100g [Chai & Liebman 2005] | **Important** (facteur ~1,7 entre min et max) | Moyenne | Trois études indépendantes donnent 296–491 mg/100g ; la base locale (369) tombe au milieu de cette fourchette — **c'est un des rares cas où la valeur médiane de 3 sources indépendantes encadre bien la valeur OHF**. |
| Cacahuète, grillée | 131,0 | 75,6 mg/100g [étude « présente »] ; 131 mg/100g [autre référence non nommée dans le résumé disponible] | Modéré à important | Faible-Moyenne | Deux valeurs très éloignées (75,6 vs 131) ; la base locale coïncide exactement avec l'une des deux sources — coïncidence à vérifier plutôt qu'une confirmation forte, car l'attribution de cette seconde valeur reste incertaine dans le résumé disponible. |
| Noix de cajou, crue/grillée | 249,0 | 265,9 mg/100g [étude « présente »] ; 263 mg/100g [Hönow & Hesse 2002] | Faible | **Haute** | Bon accord entre deux études indépendantes (263-266) et la base locale (249) — écart <10 %. |
| Noix (walnut), crue/grillée | 62,0 | 54,1 mg/100g [étude « présente »] ; 77 mg/100g [autre référence] | Faible à modéré | Moyenne | Base locale (62) se situe entre les deux valeurs indépendantes (54-77) — accord raisonnable. |
| Graines de sésame, séchées entières | 3800,0 | Pas de valeur indépendante directe trouvée pour le sésame entier dans cette vague (l'étude japonaise mentionne le sésame parmi les aliments riches sans valeur chiffrée accessible) | — | Faible | Valeur base locale extrême (3800 mg/100g) à vérifier en priorité en vague 2/3 — écart type avec sésame « toasted » (216) et « hulled » (146) de la même base suggère une hétérogénéité interne à la base OHF elle-même (graine entière avec enveloppe vs décortiquée). |
| Tahini (pâte de sésame) | 273,0 | Pas de source indépendante directe trouvée | — | Faible | — |

**Synthèse noix** : la littérature indépendante confirme un **classement qualitatif cohérent**
(amande et cajou parmi les plus riches, noix commune plus modérée) mais avec des écarts
quantitatifs de 15 à 70 % selon l'aliment et l'étude. Les auteurs eux-mêmes (papier comparant
« present study » vs Hönow & Hesse 2002) notent explicitement que « les valeurs d'oxalate pour
amande, cacahuète, noix et pécan étaient plus basses dans certaines études tandis que celles de
cajou, noisette et pignon étaient similaires » selon la méthode utilisée (kit commercial
oxalate-oxydase vs HPLC) — **la méthode analytique semble être un facteur d'écart identifié
explicitement par les auteurs**, pas seulement une hypothèse de ma part.

### 2.3 Légumineuses

| Aliment | Base locale (OHF, cuit) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Haricots blancs, cuits | 61,0 | Chai & Liebman 2005 : légumineuses cuites de 4 à 80 mg/100g selon l'espèce (fourchette globale, pas de valeur isolée « white beans » trouvée dans les résumés accessibles) ; revue MDPI cite haricots blancs **secs** à 547,9 mg/100g total [réf. 63] | Non comparable directement (sec vs cuit) | Faible | La valeur « sec » (548) et « cuit » (61) ne sont pas directement comparables sans connaître le ratio de dilution à la cuisson — cohérent qualitativement (forte perte à la cuisson/trempage, documentée pour les légumineuses) mais pas vérifiable quantitativement ici. |
| Haricots rouges (kidney), cuits | 20,0 | 13,9–113 mg/100g total [réf. 1, 36, 61] ; Chai & Liebman fourchette légumineuses cuites 4-80 mg/100g | Faible | **Haute** | Bon accord, base locale dans la fourchette basse-moyenne de la littérature. |
| Haricots noirs, cuits | 60,0 | Dans la fourchette Chai & Liebman (4-80 mg/100g cuit) | Faible | Moyenne | Cohérent mais pas de point de comparaison isolé spécifique aux haricots noirs trouvé. |
| Soja, cuit | 45,0 | 124–497 mg/100g total selon forme [réf. 36, 61, 63] ; graines sèches 276,8 mg/100g total [réf. 63] | Important (mais formes différentes) | Faible-Moyenne | Écart important mais partiellement expliqué par sec vs cuit ; à approfondir. |
| Edamame | 30,0 | Pas de valeur indépendante isolée trouvée | — | Faible | — |
| Lentilles, cuites | 9,0 | Brune 24,0 mg/100g **sec** ; rouge 13,8 mg/100g **sec** ; « dried » 13,3 mg/100g [réf. 1, 63] | Faible (mais sec vs cuit) | Moyenne | Base locale (cuit, 9,0) cohérente avec une forte dilution par rapport aux valeurs sèches (13-24) — accord qualitatif raisonnable. |
| Pois chiches, cuits | 10,0 | 14,3 mg/100g **sec** [réf. 63] | Faible | Moyenne | Cohérent avec l'effet de cuisson/dilution. |

**Synthèse légumineuses** : accord qualitatif globalement bon, mais **la confrontation
quantitative rigoureuse est freinée par le fait que la base locale donne systématiquement des
valeurs « cuites » alors qu'une bonne part de la littérature indépendante trouvée ici rapporte
des valeurs « sèches »**. C'est un point méthodologique à traiter en vague 2 : il faudrait soit
retrouver les facteurs de conversion sec→cuit utilisés par chaque étude, soit ne comparer que
des formes strictement identiques.

### 2.4 Céréales et dérivés

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Son de blé (wheat bran) | 200,0 (« Grain, Bran, Rice » — attention, c'est le son **de riz** dans la base locale, pas de blé isolé trouvé sous ce nom) | Son de blé : moyenne 220,8 mg/100g MS, soluble 60,8 mg/100g MS ; fourchette d'échantillons individuels 37,0–392,7 mg/100g MS [étude bran/bran products, HPLC] | Non comparable (produits différents dans la base locale) | Faible | **Point d'attention pour l'app** : la base locale ne semble pas avoir d'entrée « son de blé » isolée sous ce nom exact — à vérifier en vague 2, car c'est un ingrédient très cité en clinique (findings OHF le mentionnent en intro du CLAUDE.md du projet). |
| Riz brun, bouilli | 6,0 | 34,4 mg/100g **MS, cru** [étude bran products] | Modéré | Faible-Moyenne | Écart plausiblement expliqué par cru/sec vs bouilli (fort effet de dilution à la cuisson pour le riz), mais un seul point de comparaison. |
| Son de riz | 200,0 | 139,5 mg/100g MS (moyenne) [étude bran products] | Modéré | Moyenne | Écart notable (~40 %) mais même ordre de grandeur ; un seul point de comparaison indépendant. |
| Sarrasin (farine) | 280,0 | 269 mg/100g [source secondaire, citation sans accès au papier primaire] | Faible | Faible | Bon accord apparent mais la source trouvée est une citation de synthèse (blog/site tiers), pas un accès direct à l'étude primaire — **confiance dégradée à « faible » malgré l'accord numérique**, car je n'ai pas pu vérifier la référence primaire réelle. |
| Sarrasin (grain/céréale) | 123,0 | Pas de valeur indépendante distincte trouvée pour la forme grain (seulement farine, voir ci-dessus) | — | Faible | — |
| Quinoa, bouilli/cuit | 44,0–61,0 | Pas de valeur chiffrée trouvée dans les sources accessibles pour cette vague, malgré une recherche dédiée | — | **Aucune donnée** | Trou identifié explicitement — voir section 3. |

### 2.5 Thé, cacao, café

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Thé noir, infusé | 11,0 | Charrier & Savage 2002 : oxalate soluble ~4,68-5,11 mg/**g de feuilles sèches** (pas directement comparable à une boisson infusée en mg/100g liquide sans connaître le ratio feuilles/eau) ; étude comparative multi-types : thé noir 1,36–4,42 mg/g feuilles, le plus riche des types testés | Non directement comparable (feuilles sèches vs boisson infusée) | Faible-Moyenne | **Problème d'unité central pour le thé** : la quasi-totalité de la littérature rapporte l'oxalate en mg/g de **feuilles sèches**, alors que la base locale et l'usage réel (consommation) portent sur la **boisson infusée**. Le facteur de conversion dépend fortement du ratio feuilles/eau et du temps d'infusion (une étude dédiée existe : « Effect of different brewing times on soluble oxalate content », Springer/Urolithiasis — non exploitée en détail dans cette vague, à faire en vague 2/3). C'est probablement la source d'écart apparent la plus importante de toute cette revue, mais elle est méthodologique (unité), pas une vraie divergence de mesure. |
| Thé vert, infusé | 9,0 | Thé vert : 0,44–2,18 mg/g feuilles (étude comparative) ; étude chinoise dédiée : soluble 8,3–139,8 mg/**litre** infusé, avec effet origine géographique et saison de récolte marqué | Non directement comparable | Faible-Moyenne | Même problème d'unité ; la fourchette « 8,3-139,8 mg/L » ramenée à 100 mL donne 0,83-13,98 mg/100mL, ce qui **encadre effectivement la valeur base locale (9,0)** — c'est la comparaison la plus directe obtenue pour le thé dans cette vague, et l'accord est bon. |
| Cacao / cacao en poudre, chocolat noir | 656,0 (cacao/cacao powder dark chocolate) | Cacao en poudre : 322–1477,5 mg/100g selon origine bio/conventionnelle [étude organic vs conventional cocoa] ; autre étude commerciale : total 650-783 mg/100g MS, soluble 360-567 mg/100g MS | Large fourchette littérature, base locale dans la fourchette | Moyenne | Bon accord d'ordre de grandeur ; la fourchette littérature est large mais la base locale (656) tombe bien dedans. Point notable non lié à la teneur : une étude signale que la **biodisponibilité réelle** de l'oxalate du chocolat noir est très faible (~1,8 % d'après excrétion urinaire) — information cliniquement pertinente mais hors du périmètre strict « teneur », à noter pour une éventuelle fonctionnalité future de l'app. |
| Chocolat noir (candy bar) | 232,0 | 155–485 mg/100g **matière sèche**, 34 échantillons de 13 pays [étude dark chocolate] | Faible | **Haute** | Bon accord, base locale bien dans la fourchette d'une étude à large échantillon (34 produits, 13 pays) — un des cas les mieux confirmés de cette vague. |
| Café, noir | 1,0 | Pas de source indépendante trouvée pour le café en boisson dans cette vague | — | **Aucune donnée** | Trou identifié — voir section 3. |

### 2.6 Fruits

| Aliment | Base locale (OHF) | Littérature indépendante | Écart | Confiance | Notes |
|---|---|---|---|---|---|
| Figue, séchée | 76,0 | 95,1 mg/100g total [réf. 1] | Faible | Moyenne | Bon accord, écart <25 %. |
| Figue, fraîche | 30,0 | Pas de valeur fraîche isolée trouvée (la référence ci-dessus semble être pour la figue séchée) | — | Faible | — |
| Kiwi | 36,0 | 4,5–23 mg/100g total [réf. 1, 77] | **Important** (base locale au-dessus de toute la fourchette) | Faible-Moyenne | Divergence notable — base locale supérieure même à la borne haute de la fourchette trouvée. À vérifier en vague 2/3 : possible confusion de variété (kiwi vert vs jaune/gold, connus pour différer) ou d'unité dans une des deux sources. |
| Framboise | 17,0 | 18,9 mg/100g total [réf. 1] | Faible | **Haute** | Excellent accord (<10 % d'écart). |
| Mûre (blackberry) | 31,0 | 29,2 mg/100g total [réf. 1] | Faible | **Haute** | Excellent accord (<10 % d'écart). |
| Star fruit / carambole, crue | 295,0 | 160–295,4 mg/100g total [réf. 1, 35] ; étude Chine : 111,4 mg/100g FW | Modéré à important selon la source | Faible-Moyenne | La base locale coïncide avec la borne haute d'une fourchette (Savage et al.) mais diverge nettement de l'étude chinoise (111,4) — écart probablement lié à la variété/origine géographique du fruit, cohérent avec la nature très variable de cet aliment selon la littérature. |

---

## 3. Aliments sans confrontation multi-source possible (trous identifiés)

Liste établie par transparence — pour ces aliments, soit aucune étude indépendante de l'OHF
n'a été trouvée dans le temps imparti à cette vague, soit seul un résumé sans valeur chiffrée
était accessible :

- **Quinoa** (bouilli/cuit) — recherche dédiée infructueuse malgré plusieurs requêtes.
- **Café** (boisson) — aucune étude peer-reviewed sur la teneur en oxalate du café infusé
  trouvée dans cette vague (à distinguer du café vert en poudre/extrait, hors périmètre ici).
- **Patate douce** — pas de source indépendante directe malgré recherche ciblée.
- **Sésame, graines entières séchées** — la valeur base locale de 3800 mg/100g est un outlier
  frappant par rapport aux autres formes de sésame de la même base (216 et 146 mg/100g) ; aucune
  source indépendante trouvée pour trancher, priorité haute pour vague 2/3.
- **Tahini** — aucune source indépendante trouvée.
- **Edamame** (forme fraîche, distincte du soja sec/cuit) — aucune source indépendante trouvée.
- **Amarante en grain** (pseudo-céréale, à distinguer des feuilles d'amarante trouvées dans la
  littérature) — aucune source indépendante trouvée pour le grain spécifiquement.
- **Son de blé** — la base locale semble ne pas avoir d'entrée dédiée sous ce nom (seulement
  « Bran, Rice »), alors que c'est un ingrédient classique de la littérature clinique ; à
  vérifier si un mapping existe sous un autre nom dans la base.
- **Amande, cacahuète, cajou, noix — formes brutes non grillées** : la plupart des sources
  (base locale incluse) ne distinguent pas systématiquement cru/grillé, alors que le grillage
  peut modifier la teneur (concentration par perte d'eau) — non quantifié dans cette vague.

## 4. Constat majeur sur la source « USDA »

Le CLAUDE.md du projet mentionne « USDA/Harvard » comme bases de référence bien établies pour
les aliments bruts. Cette vague **n'a trouvé aucune preuve d'une base de données USDA dédiée à
l'oxalate** (FoodData Central ne référence pas ce nutriment). Toutes les mentions « USDA » sur
des sites tiers non académiques renvoient, quand elles sont vérifiables, à la base Harvard
(travaux de Massey et collaborateurs) ou à des compilations dérivées. Il serait utile de
corriger cette hypothèse dans la documentation du projet : la dichotomie pertinente n'est pas
« OHF vs USDA » mais plutôt **« compilations grand public (OHF, Harvard-dérivées) vs études
primaires peer-reviewed indépendantes (Chai & Liebman, Savage et al., Hönow & Hesse, études
chinoises/japonaises, etc.) »**, ces dernières étant la vraie source de confrontation utile pour
un travail de consensus.

## 5. Bibliographie consolidée

Références effectivement consultées (au moins en résumé) au cours de cette vague :

1. Noonan SC, Savage GP (1999). *Oxalate content of foods and its effect on humans.* Asia
   Pacific Journal of Clinical Nutrition, 8(1), 64-74. DOI: 10.1046/j.1440-6047.1999.00038.x.
   [Résumé/citations consultés, texte complet non accédé directement.]
2. Chai W, Liebman M (2005). *Oxalate content of legumes, nuts, and grain-based flours.*
   Journal of Food Composition and Analysis, 18(7), 723-729.
   [Valeurs obtenues via citations dans d'autres articles ; accès direct au PDF refusé (403).]
3. Holmes RP, Kennedy M (2000). *Estimation of the oxalate content of foods and daily oxalate
   intake.* Kidney International, 57, 1662-1667.
   [Existence et référence confirmées ; contenu chiffré non extrait — accès direct non obtenu
   dans cette vague.]
4. Savage GP et al. *Available oxalate content of nuts* (papier ResearchGate, auteur principal
   Geoffrey Savage — année précise non confirmée dans cette vague). [Accès direct refusé (403),
   valeurs obtenues via citations dans d'autres travaux.]
5. Étude non nommée précisément, citée comme comparant « present study » vs Hönow & Hesse
   (2002) pour les noix — *Soluble and insoluble oxalate content of nuts*, ScienceDirect/J Food
   Compos Anal. [Titre et existence confirmés, auteurs précis non vérifiés directement.]
6. Charrier MJ, Savage GP (2002). *Oxalate content and calcium binding capacity of tea and
   herbal teas.* Asia Pacific Journal of Clinical Nutrition. PMID: 12495262.
7. Étude sur les temps d'infusion : *Effect of different brewing times on soluble oxalate
   content of loose-packed black teas and tea bags*, Urolithiasis (Springer). [Existence
   confirmée, contenu non exploité en détail dans cette vague.]
8. Étude sur le thé vert chinois : *Oxalate content of green tea of different origin, quality,
   preparation and time of harvest*, Urolithiasis (Springer), PMID: 20204342.
9. Étude sur le cacao : *Oxalate content in commercially produced cocoa and dark chocolate*,
   Journal of Food Composition and Analysis (ScienceDirect). [Auteurs précis non confirmés dans
   cette vague.]
10. Étude sur le cacao bio/conventionnel : titre exact non confirmé, données obtenues via une
    figure ResearchGate (« The content of oxalate in organic and conventional cocoa »).
11. Étude sur le son : *Total, soluble and insoluble oxalate content of bran and bran products*
    (auteurs non confirmés dans cette vague).
12. Étude Chine : *Determination of total oxalate contents of a great variety of foods commonly
    available in Southern China using an oxalate oxidase prepared from wheat bran*, Journal of
    Food Composition and Analysis (ScienceDirect/ResearchGate, ID publication 259133570).
    [Auteurs non confirmés avec certitude — probablement Sun et al., à vérifier.]
13. Étude japonaise sur les aliments courants : *Oxalate content in common Japanese foods*
    (méthode radio-enzymatique), citée dans la revue MDPI 2023. [Auteurs et année non
    confirmés directement — accès ResearchGate refusé (403).]
14. Revue de synthèse principale : *Oxalate in Foods: Extraction Conditions, Analytical
    Methods, Occurrence, and Health Implications* (2023). Foods (MDPI), 12(17), 3201.
    PMC10486698. [Texte intégral consulté avec succès — source la plus exploitée de cette
    vague.]

**Avertissement bibliographique** : plusieurs références ci-dessus (2, 3, 4, 5, 9, 10, 11, 13)
n'ont pas pu être vérifiées par accès direct au texte intégral — leurs valeurs ont été obtenues
via des citations dans d'autres articles ou des résumés de moteur de recherche. Les auteurs,
années ou détails exacts de journal marqués « non confirmés » doivent être revérifiés avant
toute publication ou citation formelle de ce document. Ceci est un document de travail interne,
pas une synthèse prête à publication scientifique.

---

## 6. Recommandations pour la suite

1. **Vague 2** (couverture large des 737 entrées) devrait prioriser l'accès direct aux textes
   complets de Chai & Liebman (2005) et Holmes & Kennedy (2000) — actuellement bloqués par des
   paywalls/403 — car ce sont les deux études les plus systématiques et les plus citées comme
   indépendantes de l'OHF.
2. Clarifier en premier lieu **si l'OHF cite ses sources par aliment** quelque part
   (bibliographie du PDF complet, pas seulement les pages consultées ici) — si oui, cela
   permettrait de savoir directement quels aliments de la base locale sont déjà des
   compilations de Massey/Chai&Liebman/Holmes&Kennedy plutôt que des mesures indépendantes,
   évitant de "confronter" une source à elle-même par erreur.
3. Traiter en priorité les incohérences internes déjà repérées dans la base locale elle-même
   (sésame entier à 3800 mg/100g vs formes transformées à 146-216 mg/100g) avant même de
   chercher des sources externes — cela peut être une simple erreur de saisie/parsing du PDF.
4. Pour le thé, résoudre le problème d'unité (mg/g feuilles sèches vs mg/100mL infusé) avant
   toute comparaison quantitative fiable — c'est probablement l'écart le plus « faux » de cette
   revue, purement méthodologique.
