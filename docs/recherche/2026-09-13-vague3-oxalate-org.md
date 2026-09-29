# Revue de littérature — teneur en oxalate des aliments (Vague 3/3)

**Date** : 2026-09-13
**Périmètre** : examen de la base tierce `oxalate.org` (750+ aliments) comme source de
vérification croisée supplémentaire, avec extraction et confrontation ciblée de sa source
la plus prometteuse (FAO Bangladesh 2014).
**Objectif** : évaluer si `oxalate.org` apporte des données réellement indépendantes de
l'écosystème OHF/Harvard déjà couvert par les vagues 1 et 2, et exploiter la portion utile.

---

## 1. Le site oxalate.org

Site créé par un patient lithiasique (« kidney stone patient ») pour rendre les données
d'oxalate plus consultables. Structure technique : page quasi-statique (jQuery DataTables)
peuplée via un endpoint JSON `GET https://oxalate.org/data.php` — 757 entrées au format
`[Aliment, Quantité, "X mg", Source, valeur_numérique]`, avec **une source citée par ligne**
(contrairement à l'OHF qui n'expose qu'une valeur agrégée sans traçabilité par entrée).

Avertissement affiché sur le site : « Il ne contient pas de conseils médicaux et il n'y a
aucune garantie de précision. »

### 1.1 Répartition des 757 entrées par source

| Source | Entrées | % |
|---|---:|---:|
| Harvard 2008 | 500 | 66 % |
| Zarembski 1962 | 81 | 11 % |
| USDA Dr. Duke | 66 | 9 % |
| FAO Bangladesh 2014 | 40 | 5 % |
| USDA 1984 | 39 | 5 % |
| NUTTAB 2010 | 17 | 2 % |
| Savage 2001 | 14 | 2 % |

### 1.2 Évaluation par source

Le site est figé depuis sa création (~2015) : **tous les liens externes cités sont morts**
(Harvard `regepi.bwh.harvard.edu` ne résout même plus en DNS, USDA/NUTTAB renvoient 404).
Aucune mise à jour depuis.

- **Harvard 2008 (66 %)** — déjà identifiée en vague 1 comme une des sources largement
  reprises par l'OHF elle-même. **Pas une source indépendante** de la base locale actuelle :
  l'intégrer ferait probablement comparer l'OHF à ses propres sources sous-jacentes.
- **Zarembski 1962 (11 %)** — déjà repérée en vague 1. Étude britannique primaire mais
  pré-HPLC (méthode ancienne, écarts possibles pour raison méthodologique plutôt que produit).
- **USDA Dr. Duke (9 %)** — base de phytochimie USDA-ARS connue pour agréger des valeurs
  disparates de qualité inégale, pas des mesures de laboratoire propres. Lien mort, pas
  vérifiable directement. Fiabilité faible.
- **USDA 1984 (5 %)** — « Oxalic Acid Content of Selected Vegetables », ancienne, méthode non
  vérifiable (lien mort).
- **NUTTAB 2010 (2 %)** — ex-base officielle FSANZ (Australie/NZ), renommée depuis en
  Australian Food Composition Database (AFCD). Organisme sérieux, mais l'oxalate n'est pas un
  nutriment mesuré en routine par les tables de composition nationales ; ces valeurs sont
  vraisemblablement elles-mêmes importées de la littérature plutôt que mesurées par NUTTAB.
- **Savage 2001 (2 %)** — article peer-reviewed déjà cité dans notre propre vague 1
  (*Int. J. Food Sci. Nutr.*, champignons). Primaire, mais déjà dans le corpus existant.
- **FAO Bangladesh 2014 (5 %)** — **seule découverte réellement nouvelle et indépendante**,
  voir section 2.

### 1.3 Conclusion sur la valeur ajoutée d'oxalate.org

Sur les 757 entrées, l'écrasante majorité (Harvard, Zarembski, Savage ≈ 79 %) recoupe des
sources déjà connues des vagues 1-2. **Le seul apport net identifié est le sous-ensemble
FAO Bangladesh 2014** (40 entrées). Le reste (USDA Dr. Duke, USDA 1984, NUTTAB — 16 %) a une
fiabilité incertaine et des liens morts empêchant toute vérification de méthodologie.

---

## 2. FAO Bangladesh 2014 — source primaire confirmée

### 2.1 Nature du document

*Food Composition Table for Bangladesh*, Institute of Nutrition and Food Science / Centre for
Advanced Research in Sciences, **University of Dhaka**, avec le soutien de la FAO, USAID, UE et
du Ministère de l'Alimentation du Bangladesh, conforme au format **INFOODS**. PDF de 5,2 Mo,
~160 pages, auteurs : Nazma Shaheen, Abu Torab MA Rahim, Md. Mohiduzzaman, et al.

Récupéré depuis :
`http://www.fao.org/fileadmin/templates/food_composition/documents/FCT_10_2_14_final_version.pdf`

### 2.2 Méthodologie (confirmée dans le document, p.151)

> « Oxalates were estimated employing HPLC after extracting soluble and insoluble oxalates
> using water and 2M HCl, respectively. »

**Méthode HPLC** — la méthode de référence actuelle (vs. les méthodes enzymatiques/
colorimétriques plus anciennes utilisées par Zarembski 1962 ou probablement USDA 1984).
Extraction séparée soluble (eau) / insoluble (HCl 2M), donc valeur totale reconstituable.
C'est un vrai point fort : documentation méthodologique explicite, ce qui manquait pour la
plupart des sources examinées en vague 1.

**Limite d'applicabilité** : aliments et variétés propres au Bangladesh (légumes-feuilles
locaux, variétés de mangue/riz/banane spécifiques au sous-continent), donc transposition à des
produits occidentaux/belges à faire au cas par cas, pas systématiquement.

### 2.3 Vérification d'intégrité des données

Les 40 valeurs listées par oxalate.org pour cette source ont été confrontées directement à
l'Annexe 4 du PDF original (« Antinutrients of selected foods », colonne OXALAC). **Toutes les
valeurs vérifiées correspondent exactement** — aucune erreur de recopie détectée sur
l'échantillon contrôlé (Cashew nuts 318, Emblic 296, Jambolan 89, Coconut water 318, etc.).

### 2.4 Tableau — 40 entrées FAO Bangladesh 2014

Toutes en mg oxalate / 100 g, portion comestible, poids frais, **cru** sauf indication contraire.

| Aliment (FAO) | mg/100g |
|---|---:|
| Apple, with skin, raw | 10 |
| Banana, Sagar, ripe, raw | 3 |
| Barley, whole-grain, raw | 2 |
| Beans, seeds and pods, raw | 25 |
| Carrot, raw | 6 |
| Cashew nuts, raw | 318 |
| Chilli, green, with seeds, raw | 29 |
| Chilli, red, dry | 67 |
| Coconut water | 318 |
| Coriander leaves, raw | 47 |
| Custard apple, raw | 30 |
| Emblic, raw | 296 |
| Guava, green, raw | 14 |
| Jackfruit, ripe, raw | 10 |
| Jambolan, raw | 89 |
| Lychee, raw | 19 |
| Maize/corn, yellow, dried, raw | 6 |
| Mango, Fazli, orange flesh, ripe, raw | 3 |
| Mango, Langra, yellow flesh, ripe, raw | 3 |
| Melon, Futi, orange flesh, ripe, raw | 2 |
| Muskmelon, Bangee, light orange flesh, ripe, raw | 2 |
| Onion, raw | 3 |
| Orange, raw | 10 |
| Papaya, ripe, raw | 1 |
| Pear millet, whole-grain, raw | 21 |
| Pineapple, Joldugee, ripe, raw | 5 |
| Pineapple, ripe, raw | 5 |
| Pomegranate, ripe, with seed, raw | 14 |
| Potato, Diamond, raw | 12 |
| Rice flaked | 0 |
| Rice, BR-28, parboiled, milled, raw | 1 |
| Rice, white, sunned, aromatic, raw | 1 |
| Rice, white, sunned, polished, milled, raw | 1 |
| Sorghum, raw | 10 |
| Spearmint leaves, fresh | 33 |
| Tomato, red, ripe, raw | 4 |
| Watermelon, ripe, raw | 11 |
| Wheat flour, brown, whole grain, raw | 8 |
| Wheat, whole, raw | 8 |
| Yam, tuber, raw | 15 |

### 2.5 Confrontation avec la base locale (`oxalate-database.json`)

Correspondances identifiées (matching par nom, forme comparable cru/cru quand possible) :

| Aliment | FAO (mg) | Base locale (mg) | Écart | Remarque |
|---|---:|---:|---:|---|
| Apple (cru) | 10 | 2,0 | x5 | Base locale nettement plus basse |
| Beans, seeds/pods (cru) vs Beans, Green boiled | 25 | 24,0 | ~1x | Cohérent, mais comparaison cru vs cuit |
| **Coconut water** | **318** | **7,0** | **x45** | **Anomalie majeure — même produit, voir 2.6** |
| Guava (green, cru) vs Guava | 14 | 70,0 | x5 | Sens inverse — variété/maturité probablement différente |
| Lychee (cru) | 19 | 0,0 | — | Écart qualitatif net |
| Mango (cru) | 3 | 4,0 | ~1x | Cohérent |
| Onion (cru) | 3 | 5,0 | ~1x | Cohérent |
| Orange (cru) vs Mandarine/Clémentine | 10 | 17,0 | x1,7 | Espèces différentes, non strictement comparable |
| Papaya (cru) | 1 | 1,0 | 0x | Identique |
| Pineapple (cru) | 5 | 6,0 | ~1x | Cohérent |
| Pomegranate (avec graines) | 14 | 78,0 | x5,5 | Écart net, sens inverse de Guava |
| Rice flaked (cru) vs Rice White boiled | 0 | 2,0 | — | Cohérent (faible dans les deux cas) |
| Tomato (cru) | 4 | 9,0 | x2,2 | Base locale plus haute |
| Yam (cru) vs Yam baked | 15 | 68,0 | x4,5 | Sens surprenant : la cuisson devrait réduire l'oxalate soluble, pas l'augmenter autant |

**Observations générales** :
- Pas de biais systématique dans un sens : tantôt FAO > local (Apple, Tomato), tantôt
  local > FAO (Guava, Pomegranate, Yam). Cohérent avec la vague 1 : la variabilité
  intrinsèque du produit (variété, sol, maturité) domine largement l'écart inter-sources pour
  la plupart des aliments bruts.
- Aucun de ces écarts, pris isolément, ne remet en cause l'incertitude ±35 % déjà appliquée
  par la base — sauf le cas Coconut water.

### 2.6 Anomalie à signaler : eau de coco

La valeur FAO Bangladesh pour l'eau de coco (**318 mg/100g**) a été vérifiée directement dans
le PDF source (Annexe 4, code `14_0001`, ligne confirmée deux fois dans le document) — ce
n'est pas une erreur de recopie d'oxalate.org. Elle placerait l'eau de coco parmi les boissons
les **plus riches en oxalate** de tout le jeu de données, ce qui contredit la réputation
généralement admise de l'eau de coco comme boisson pauvre en oxalate (souvent recommandée aux
patients lithiasiques dans la littérature grand public et certaines fiches cliniques).

**Recommandation : ne pas intégrer cette valeur telle quelle dans la base locale sans
recoupement supplémentaire.** Hypothèses possibles, non tranchées ici : erreur d'unité dans
la publication FAO d'origine (mg vs valeur pour une portion non ramenée à 100 g), variété
locale de noix de coco (Bangladesh) réellement atypique, ou contamination/erreur
méthodologique isolée sur cet échantillon. À traiter comme signal isolé nécessitant une
troisième source avant toute décision.

---

## 3. Recommandations pour la suite

1. **Ne pas utiliser oxalate.org comme source de masse** — 79 % de son contenu recoupe des
   sources déjà connues (Harvard, Zarembski, Savage), sans indépendance statistique réelle.
2. **Exploiter ponctuellement les 40 valeurs FAO Bangladesh 2014** pour les aliments bruts où
   une variété occidentale comparable existe (mangue, ananas, tomate, oignon, papaye, riz,
   pastèque) — méthode HPLC documentée, bonne fiabilité relative.
3. **Écarter Coconut water = 318 mg** de toute intégration en l'état ; si la base locale doit
   être révisée sur ce point, chercher une quatrième source avant de trancher.
4. **Ne pas poursuivre l'examen de USDA Dr. Duke / USDA 1984 / NUTTAB via oxalate.org** — liens
   morts, pas de méthodologie vérifiable, apport marginal (16 % des entrées à fiabilité
   incertaine pour un gain d'indépendance quasi nul).
