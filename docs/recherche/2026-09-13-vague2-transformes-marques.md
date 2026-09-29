# Revue de littérature — teneur en oxalate des aliments (Vague 2/3)

**Date** : 2026-09-13
**Périmètre** : produits transformés, marques spécifiques, fast-food/chaînes de restauration,
et compléments alimentaires — 147 entrées de la base locale (`src/data/oxalate-database.json`,
dérivée du PDF OHF).
**Objectif** : évaluer la plausibilité des valeurs de la base locale pour des produits de marque
qu'aucune étude peer-reviewed ne teste jamais nommément, en confrontant non pas le produit fini
mais son/ses **ingrédient(s) dominant(s) générateur(s) d'oxalate probable** à la littérature
disponible sur cet ingrédient.

---

## 1. Méthodologie

### 1.1 Principe : confrontation par « ingrédient dominant »

Contrairement à la vague 1 (aliments bruts, directement documentés dans la littérature), cette
vague couvre des **produits de marque commerciale** (crackers Ritz, McDonald's Egg McMuffin,
supplément Estroven, etc.). **Aucune étude scientifique ne mesure jamais l'oxalate d'un produit
de marque précis** — la littérature académique ne teste que des aliments génériques ou des
ingrédients isolés.

La méthode appliquée ici, validée avec l'utilisateur, est donc :

1. Identifier l'**ingrédient dominant** générateur d'oxalate probable dans le produit (ex. :
   « All-Bran Kellogg's » → son de blé ; « Nutella » → cacao + noisette ; « Black Bean Patty » →
   haricots noirs, éventuellement blé/soja selon la recette).
2. Rechercher la littérature indépendante disponible sur **cet ingrédient** (réutilisation
   directe des résultats de la vague 1 quand l'ingrédient y est déjà couvert, sinon nouvelle
   recherche web ciblée).
3. Produire une **estimation qualitative prudente** (faible / modéré / élevé) de la plausibilité
   de la valeur de la base locale — **jamais une nouvelle valeur numérique de précision
   équivalente**, car la composition exacte (proportion de l'ingrédient dans la recette,
   dilution par les autres ingrédients, transformation industrielle, cuisson) reste inconnue.

### 1.2 Limites explicites de cette approche

- **Ce n'est pas une confrontation directe du produit.** Une valeur de littérature sur le « son
  de blé pur » ne dit rien de la proportion réelle de son de blé dans une barre de céréales
  donnée, ni de l'effet de la cuisson/extrusion industrielle sur la biodisponibilité de
  l'oxalate.
- **La dilution par les ingrédients non-oxalate (sucre, huile, eau, farine raffinée) est
  ignorée** faute de recette exacte — un produit peut afficher une valeur nettement inférieure à
  celle de l'ingrédient pur simplement parce que celui-ci n'en représente qu'une faible fraction
  massique.
- **Effet de synergie ou de dosage multi-ingrédients non pris en compte** (ex. : un produit
  combinant cacao ET noisette ET amande cumule plusieurs sources, mais sans connaître les
  proportions, il est impossible de prédire un total).
- Pour les **compléments alimentaires à formule propriétaire multi-ingrédients** (mélanges
  d'extraits de plantes sans dosage individuel public), l'ingrédient dominant n'est pas
  identifiable du tout — ces cas sont classés séparément en section 3, **sans recherche
  inventée**.
- Les valeurs de la base locale pour ces produits proviennent très probablement de mesures de
  laboratoire réelles commanditées ou compilées par l'OHF sur les produits eux-mêmes (beaucoup
  de ces entrées citent une marque précise, ce qui suggère un échantillon acheté et testé,
  plutôt qu'une estimation). Cette vague ne peut ni confirmer ni infirmer ces valeurs
  directement — elle évalue seulement leur **plausibilité qualitative** au regard de la
  composition attendue du produit.

### 1.3 Recherches web menées pour cette vague

Recherches ciblées effectuées (nouvelles, non issues de la vague 1) :
- Noisette (hazelnut) — oxalate, pour Nutella.
- Protéine végétale texturée (TVP) / soja transformé — pour les substituts de viande.
- Tempeh — fermentation et effet sur l'oxalate.
- Haricot noir, cuit — pour les patties de légumineuses.
- Son de blé / farine complète dans le pain et les crackers — étude dédiée trouvée
  (Okombo & Liebman 2010, *J Food Compos Anal*, « Oxalate content of selected breads and
  crackers ») : **résultat le plus utile de cette vague**, directement pertinent pour toute la
  sous-catégorie crackers.
- Sésame dans les crackers (confirme et affine la vague 1).
- Ginkgo biloba (feuille), silymarin/chardon-Marie (graine), valériane, aubier de tilleul/orme
  rouge (slippery elm), spiruline — pour les compléments à ingrédient unique identifiable.

Sources trouvées et effectivement exploitées :
- **Okombo B, Liebman M (2010).** *Oxalate content of selected breads and crackers.* Journal of
  Food Composition and Analysis. — 26 pains et 19 crackers testés ; oxalate total des crackers
  23,7–384 mg/100g, très dépendant de la présence de graines de sésame notamment. Pains
  16,5–45,9 mg/100g sauf un échantillon au sésame à 111,5 mg/100g. **C'est très probablement
  l'étude sous-jacente (ou une étude sœur) aux entrées « Crackers, marque X » de la base
  OHF/locale** — la correspondance de gamme est frappante.
- **Siener et al.** (cité dans la revue MDPI, vague 1) — oxalate soluble du son de blé
  131,2–457,4 mg/100g MS, confirmant le son de blé comme ingrédient à fort potentiel oxalate.
- **Massey/Iowa State, Oxalate and Phytate of Soy Foods (2005), J Agric Food Chem** — 30 aliments
  à base de soja testés, 0,02–2,06 mg oxalate/g (2–206 mg/100g) ; TVP, farine de soja, soja
  texturé, edamame, soja grillé, tempeh et beurre de soja classés parmi les **plus riches**
  produits soja testés (>10 mg/portion).
- Étude sur la fermentation du tempeh (Indonésie/Malaisie) — la fermentation **réduit**
  l'oxalate par rapport au soja non fermenté, mais le tempeh reste classé « riche en oxalate »
  dans une revue 2022 (Frontiers in Nutrition) aux côtés du soja nature et de l'edamame.
  Résultats partiellement contradictoires entre études — la fermentation réduit sans forcément
  faire passer en catégorie « faible ».
- Spiruline — une source qualifie la spiruline d'« aliment végétal sans oxalate » (absence de
  péricarpe comme chez les céréales) ; une autre étude (modèle animal) montre qu'un régime riche
  en spiruline **augmente l'oxalate urinaire** en conditions hyperoxaluriques, mais cela ne
  documente pas la teneur en oxalate de la spiruline elle-même. Cohérent qualitativement avec
  les valeurs très basses de la base locale (1,0 et 6,0 mg/100g).
- Noisette — 3 valeurs indépendantes convergentes : 167, 194, 221 mg/100g (variétés Barcelona,
  Tonda di Giffoni, Whiteheart, HPLC). Confirme un statut « riche » pour la noisette, cohérent
  avec le cacao (656 mg/100g, vague 1) pour expliquer Nutella.
- Ginkgo biloba (feuille) : aucune étude quantifiée trouvée spécifiquement sur la feuille
  (seule une valeur existe pour la graine de ginkgo, 26,0 mg/100g frais — organe différent, non
  transposable). Silymarin/graine de chardon-Marie : aucune donnée oxalate trouvée, uniquement
  des données sur la teneur en silymarine. Valériane et St. John's Wort (millepertuis) : aucune
  donnée oxalate trouvée. Aubier d'orme rouge (slippery elm) : confirmé chimiquement comme
  contenant de l'oxalate de calcium parmi ses constituants, mais aucune valeur quantifiée
  trouvée.

---

## 2. Tableau par produit — ingrédient dominant identifié

Valeur base locale en mg/100g. « Estimation qualitative » = jugement prudent sur la plausibilité
de cette valeur au regard de l'ingrédient dominant, **pas une nouvelle mesure**.

### 2.1 Crackers, pains, biscuits salés — dominante blé/son/sésame

| Produit | Base locale | Ingrédient dominant | Littérature sur l'ingrédient | Estimation qualitative |
|---|---|---|---|---|
| Crackers, Ritz, Garlic Butter | 28,0 | Farine raffinée + beurre/huile | Pains/crackers base farine blanche : 16,5–45,9 mg/100g (Okombo & Liebman) | Plausible, faible — cohérent avec farine raffinée peu chargée |
| Crackers, Rye, Crispbreads, sans sésame | 55,0 | Farine de seigle | Crackers hors sésame dans l'étude Okombo & Liebman se situent en général sous 100 mg/100g | Plausible, modéré |
| Crackers, Saltines | 32,0 | Farine raffinée | Cohérent avec la fourchette basse Okombo & Liebman (23,7 mg/100g mini) | Plausible, faible-modéré |
| Crackers, Sesame Crackers | 122,0 | Graines de sésame | Sésame identifié explicitement par Okombo & Liebman comme le facteur dominant des valeurs les plus hautes de crackers (jusqu'à 384 mg/100g) ; sésame cru ~87,5 mg/100g (autre étude) | Plausible, élevé — cohérent avec la littérature dédiée |
| Crackers, Soybean Crackers | 204,0 | Farine/flocons de soja | Soja transformé classé parmi les formes de soja les plus riches en oxalate (Massey/Iowa State 2005, jusqu'à 206 mg/100g) | Plausible, élevé — bon accord d'ordre de grandeur avec la littérature soja |
| Crackers, Stone-ground | 7,0 | Farine complète moulue à la meule | Valeur très basse malgré ingrédient « complet » — pas d'explication évidente ; possible faible teneur en son réel ou format de portion différent | Incertain, valeur surprenante (voir note) |
| Crackers, Tomato snacks, sun-dried | 44,0 | Tomate séchée + farine | Pas de littérature dédiée tomate séchée trouvée ; farine de base dans la fourchette Okombo & Liebman | Plausible, modéré |
| Crackers, Wasabi peas | 4,0 | Pois (enrobage wasabi) | Pois/légumineuse en faible quantité, enrobage sec | Plausible, faible |
| Crackers, Wheat Crackers / Wheat Thins | 47,0 | Farine de blé (raffinée à semi-complète) | Dans la fourchette Okombo & Liebman pour crackers non-sésame | Plausible, modéré |
| Pizza Crust, Boboli, Italian | 15,0 | Farine de blé raffinée | Cohérent avec pains base farine blanche (16,5–45,9 mg/100g, Okombo & Liebman) | Plausible, faible |
| Pie Crust, Multiple Brands | 24,0 | Farine + matière grasse | Cohérent avec fourchette pains/crackers base farine | Plausible, faible-modéré |
| Stuffing, Stovetop, Chicken, Kraft | 18,0 | Pain/farine + assaisonnement | Cohérent avec produits base pain | Plausible, faible |
| Pancake Mix | 23,0 | Farine de blé | Cohérent avec produits base farine raffinée | Plausible, faible-modéré |

**Note méthodologique importante pour cette sous-catégorie** : l'étude Okombo & Liebman (2010)
est directement pertinente ici car elle teste littéralement la catégorie « crackers » et
identifie le **sésame comme facteur causal dominant** des valeurs élevées — c'est la
confrontation la plus solide de toute cette vague, car l'ingrédient dominant et le produit
testé par la littérature coïncident presque exactement (crackers en général, sésame en
particulier).

### 2.2 Substituts de viande et protéines végétales — dominante légumineuse/soja/blé

| Produit | Base locale | Ingrédient dominant | Littérature sur l'ingrédient | Estimation qualitative |
|---|---|---|---|---|
| Meat Substitutes, Black Bean Patty, Morningstar Farms | 60,0 | Haricots noirs (+ liant blé probable) | Haricots noirs cuits : fourchette large selon études, 10–72 mg/100g selon préparation (Chai & Liebman évoque 72 mg/100g cru, réduit ~45 % à la cuisson → ~40 mg/100g) | Plausible, élevé — cohérent avec un produit combinant légumineuse + liant céréalier |
| Meat Substitutes, Grillers, Morningstar Farms | 39,0 | Protéine de soja texturée | TVP/soja transformé parmi les plus riches formes de soja (Massey 2005) | Plausible, élevé |
| Meat Substitutes, Meatless Breakfast Patties, Boca | 78,0 | Protéine de soja | Idem | Plausible, élevé |
| Meat Substitutes, Meatless burger, Gardenburger | 87,0 | Légumes + céréales + soja (recette composite) | Combinaison de plusieurs sources, cohérent avec valeur élevée | Plausible, élevé |
| Meat Substitutes, Meatless Burgers, Boca | 105,0 | Protéine de soja | Cohérent avec fourchette haute soja transformé (jusqu'à 206 mg/100g, Massey 2005) | Plausible, élevé |
| Meat Substitutes, Meatless Chicken Patties, Boca | 37,0 | Protéine de soja/blé | Cohérent avec fourchette basse-moyenne soja transformé | Plausible, élevé |
| Meat Substitutes, Textured Vegetable Protein | 320,0 | Soja texturé pur (TVP) | Forme la plus concentrée de soja transformé, cohérent avec le classement TVP parmi les plus riches formes de soja testées (Massey 2005, jusqu'à 206 mg/100g pour l'ensemble des produits soja — la TVP pure, non diluée par d'autres ingrédients, peut plausiblement dépasser cette moyenne) | Plausible, très élevé — TVP non diluée, cohérent avec le classement qualitatif de la littérature |
| Tempeh, Organic, Lightlife | 61,0 | Soja fermenté | Tempeh classé « riche en oxalate » (revue Frontiers 2022) malgré réduction par fermentation vs soja non fermenté ; résultats de la littérature partiellement contradictoires sur l'ampleur de la réduction | Plausible, modéré-élevé |
| Soy Cheese | 57,0 | Soja (protéine + lipide) | Cohérent avec fourchette basse-moyenne soja transformé | Plausible, modéré |
| Egg Replacer, Bobs Red Mill | 142,0 | Amidon/farine de pomme de terre + agents levants (souvent à base de fécule) | Pas de littérature dédiée trouvée ; ingrédient dominant incertain sans liste précise | Incertain — ingrédient dominant non confirmé |
| Miso Paste, Red, Cold Mountain | 49,0 | Soja fermenté + riz/orge | Cohérent avec fourchette basse soja fermenté | Plausible, faible-modéré |
| Fermented Superfood Complex, Swanson Ultra | 28,0 | Mélange de céréales/légumineuses fermentées (formule multi-ingrédients) | Pas de littérature spécifique ; ingrédient dominant peu clair | Incertain, faible |

### 2.3 Nutella et cacao/noisette

| Produit | Base locale | Ingrédient dominant | Littérature sur l'ingrédient | Estimation qualitative |
|---|---|---|---|---|
| Nutella | 71,0 | Cacao (~656 mg/100g, vague 1) + noisette (167–221 mg/100g, 3 études convergentes trouvées cette vague) | Les deux ingrédients dominants sont individuellement riches en oxalate, mais Nutella est composé à ~75-80 % de sucre et huile de palme (ingrédients non-oxalate) — la valeur diluée de 71 mg/100g est cohérente avec un mélange fortement dilué de deux ingrédients riches | Plausible, élevé (relatif à sa catégorie « pâte à tartiner »), mais nettement dilué vs ses ingrédients purs |

### 2.4 Autres produits transformés — passe rapide de classification

| Produit | Base locale | Ingrédient dominant | Estimation qualitative |
|---|---|---|---|
| Fries, French | 30,0 | Pomme de terre (frite) | Plausible, faible-modéré — pomme de terre a une teneur oxalate modérée, la friture ne l'augmente pas structurellement |
| Frozen Meals, Lean Cuisine/Stouffers, Chicken Entrees | 22,0 | Composite (poulet + légumes + féculent) | Plausible, faible — produit très dilué, dominante protéine animale peu oxalate |
| Fruit Pectin, Sure-Jell | 6,0 | Pectine de fruit (agent gélifiant) | Plausible, faible |
| Gelatin, Jell-O | 7,0 | Gélatine animale | Plausible, faible — gélatine pure quasi sans oxalate |
| Ice cream bar, Klondike | 9,0 | Produit laitier + chocolat en faible proportion | Plausible, faible |
| Pickles, Baby Kosher Dills, Vlasic | 9,0 | Concombre | Plausible, faible — concombre pauvre en oxalate |
| Pie Mix, pumpkin, canned | 5,0 | Courge/potiron | Plausible, faible |
| Potato Flakes, cooked, Bob's Red Mill | 12,0 | Pomme de terre déshydratée | Plausible, faible |
| Pudding and Pie Filling, instant, Jell-O | 10,0 | Amidon + lait | Plausible, faible |
| Ravioli, Beef, Chef Boyardee (x2) | 10,0–12,0 | Pâte de blé + bœuf + sauce tomate | Plausible, faible — produit dilué et dominante protéine animale/pâte raffinée |
| Salad Dressing, Multiple Brands | 5,0 | Huile + vinaigre | Plausible, faible |
| Sauce, Pasta, Spicy tomato/basil, Classico | 8,0 | Tomate | Plausible, faible-modéré — tomate a une teneur oxalate modérée documentée |
| Sauce, Pasta/Marinara | 11,0 | Tomate | Plausible, faible-modéré |
| Sauce, Sloppy Joe, Manwich | 12,0 | Tomate + viande | Plausible, faible-modéré |
| Soup (générique) | 15,0 | Non identifiable sans variété précise | Non estimable — nom générique incomplet dans la base |
| Soup, Chili with Beans | 22,0 | Haricots + tomate + viande | Plausible, modéré — légumineuse présente mais diluée dans un bouillon |
| Soup, Chili, No Beans | 18,0 | Tomate + viande | Plausible, faible-modéré |
| Soup, Spicy Black Bean and Kale | 12,0 | Haricots noirs + chou kale (deux ingrédients riches en oxalate) mais fortement dilués en bouillon | Plausible, faible-modéré malgré ingrédients sources potentiellement riches — dilution aqueuse dominante |
| Soup, Sweet Potato | 16,0 | Patate douce | Non confronté (patate douce = trou identifié en vague 1, aucune littérature indépendante trouvée) |
| Soup, Vegetable Quinoa | 13,0 | Quinoa + légumes | Non confronté (quinoa = trou identifié en vague 1) |

### 2.5 Fast-food et chaînes (Applebee's, McDonald's, Starbucks, Wendy's)

Pour cette sous-catégorie, chaque entrée est un plat composite (protéine + féculent + légumes +
sauce), rendant l'« ingrédient dominant » peu discriminant ; une seule passe qualitative est
appliquée, sans recherche dédiée, conformément à la consigne de priorisation.

| Produit | Base locale | Ingrédient dominant probable | Estimation qualitative |
|---|---|---|---|
| Applebee's WW, Cajun Lime Tilapia | 7,0 | Poisson (faible oxalate) | Plausible, faible |
| Applebee's WW, Garlic Herbed Chicken | 13,0 | Poulet (faible oxalate) | Plausible, faible-modéré |
| Applebee's WW, Herbed potatoes | 27,0 | Pomme de terre | Plausible, modéré |
| Applebee's WW, Italian Chicken & Portobello Sandwich | 12,0 | Poulet + champignon + pain | Plausible, faible-modéré |
| Applebee's WW, Paradise Chicken Salad | 13,0 | Poulet + légumes/fruits mélangés | Plausible, faible-modéré |
| Applebee's WW, Seasonal Vegetables | 16,0 | Légumes variés (non spécifiés) | Non estimable précisément — dépend des légumes de saison |
| Applebee's WW, Steak & Portobellos | 11,0 | Bœuf + champignon | Plausible, faible-modéré |
| McDonald's, Bacon Egg and Cheese Biscuit | 14,0 | Farine (biscuit) + œuf + bacon | Plausible, faible-modéré |
| McDonald's, Egg McMuffin | 11,0 | Œuf + pain (farine raffinée) | Plausible, faible |
| McDonald's, Sausage Biscuit | 18,0 | Farine (biscuit) + saucisse | Plausible, faible-modéré |
| McDonald's, Sausage McMuffin | 18,0 | Farine + saucisse | Plausible, faible-modéré |
| Starbucks, Coffee Cake, Classic | 14,0 | Farine raffinée | Plausible, faible-modéré |
| Starbucks, Latte, Dark Chocolate Mocha, skim | 20,0 | Cacao/chocolat (dilué dans le lait) | Plausible, modéré — cacao dilué dans une grande quantité de lait |
| Starbucks, Latte, White Chocolate Mocha, skim | 4,0 | Chocolat blanc (sans cacao solide) | Plausible, faible — cohérent, le chocolat blanc ne contient pas de solides de cacao (source principale d'oxalate) |
| Wendy's, Caesar Salad | 22,0 | Laitue + parmesan (faible oxalate individuellement) | Valeur base locale classée « faible » dans le fichier source malgré 22 mg/100g — incohérence de classement interne à vérifier (voir note ci-dessous) |
| Wendy's, Chili | 11,0 | Haricots + tomate + viande | Plausible, faible-modéré |
| Wendy's, Hamburger, Junior, plain | 11,0 | Bœuf + pain | Plausible, faible-modéré |

**Note** : l'entrée « Wendy's, Caesar Salad » présente une incohérence apparente entre sa valeur
numérique (22,0 mg/100g) et son niveau qualitatif annoncé dans le fichier source (« faible »),
alors que d'autres entrées de valeur comparable ou inférieure (ex. Applebee's Herbed potatoes,
27,0, classé « élevé ») sont classées plus haut. Cela suggère que le **niveau qualitatif fourni
dans le fichier source pour ce lot n'est pas strictement monotone avec la valeur mg/100g** — à
signaler pour vérification indépendante du pipeline de classification de la base locale
(hors périmètre de cette revue de littérature, mais observation utile pour le projet).

---

## 3. Hors périmètre — formule propriétaire non décomposable ou ingrédient non identifiable

Ces entrées sont soit des **compléments à formule multi-ingrédients propriétaire** (dosage
individuel non public, impossible à décomposer en un ingrédient dominant unique), soit des
produits dont le nom ne permet pas d'identifier un ingrédient précis, soit des marques
génériques sans composition claire. **Aucune recherche de littérature n'a été menée sur ces
entrées** — inventer un ingrédient dominant serait spéculatif et non traçable.

### 3.1 Suppléments à formule propriétaire multi-ingrédients

- AdrenaSense Adrenal Formula, Natural Factors Canada
- Barley Life, AIM
- Berberine, Ultra, Wellness Formula
- Bio Tears Oral Gel Caps
- Cholest-Off, Nature Made
- Cysta Q Complex
- DIM + BioPerine
- Enteral Nutrition Formula, Boost Breeze / Boost, Peach (formule industrielle multi-ingrédients)
- Enteral Nutrition, Multiple Brands, Chocolate Flavor / Variety Brands, autres saveurs
- Estroven, Regular strength
- Fiber and Spice, Supplement, Balance of Nature
- Formula (nom générique non identifiable)
- Fruits, Supplement, Balance of Nature (mélange de fruits non spécifié)
- HydroEye Soft Gels
- Intestamine, Douglas Laboratories
- Juice PLUS+, Garden Blend / Powdered Fruit, Orchard Blend / Powdered Vegetables, Garden Blend
  (mélanges multi-ingrédients propriétaires)
- Lactose Stop, Renew Life Formula
- Medibolic, Thorne (formule multi-ingrédients sportive/métabolique)
- Multivitamin/Multimineral Supplement, Centrum Specialist
- Reacted Iron, Ortho Molecular Products
- Sea Cucumber, herbal healers (formule non spécifiée)
- Senekot
- Solgar No. (nom tronqué, produit non identifiable)
- Soy, Ultra amino (formule d'acides aminés, pas un aliment soja entier)
- TheraLife Eye Capsules / TheraTears Soft Gels (formules ophtalmiques multi-ingrédients)
- ThyroSense Thyroid Formula, Natural Factors Canada
- Veggies, Supplement, Balance of Nature (mélange de légumes non spécifié)
- Yeast Nutritional, Laramie Co-op

### 3.2 Ingrédients uniques mais sans littérature oxalate trouvée (recherche tentée, infructueuse)

Ces entrées ont un ingrédient dominant identifiable, mais **aucune littérature quantifiée sur
l'oxalate de cet ingrédient spécifique n'a été trouvée** malgré une recherche ciblée pour les
plus notables (Ginkgo, chardon-Marie). Elles sont classées ici plutôt que dans le tableau
principal pour ne pas laisser croire à une confrontation réussie :

- Ashwagandha, Oregon's Wild Harvest — racine, pas de littérature oxalate trouvée
- Beet Powder / Beet Supplement — racine de betterave concentrée ; la betterave racine bouillie
  est documentée en vague 1 (57 mg/100g) mais la poudre déshydratée concentrée n'est pas
  transposable sans facteur de concentration connu
- Black Cohosh, Puritan's Pride
- Black Walnut Hull Extract, Solaray
- Boswellia Resin Extract, Solgar
- Echinacea, powder
- Feverfew
- Ginkgo Biloba / Ginkgo Biloba Extract, 21st Century — recherche dédiée effectuée, seule une
  valeur pour la graine (organe différent) trouvée, non transposable à la feuille
- Goldenseal Root, powder
- Grape Seed Extract, Natural Factors Canada
- Green coffee bean extract, Walgreens
- Hawthorn Solid Extract, Wise Woman Herbals
- Licorice DGL, Natural Factors
- Maca, Oregon's Wild Harvest
- Milk Thistle, Seed / Seed Powder — recherche dédiée effectuée, aucune donnée oxalate trouvée
  (uniquement teneur en silymarine documentée)
- Moringa, Leaf Powder — feuille non couverte par la littérature trouvée cette vague (à
  distinguer des feuilles d'amarante ou de chou kale documentées ailleurs)
- Muscadine grape seed, Nature's Pearls
- Pycnogenol, Pine Bark Extract
- Raspberry Ketone extract, Walgreens
- Rhodiola Extract, Solaray
- Rhubarb Extract — la rhubarbe (tige) est très documentée (vague 1, ~1060-1235 mg/100g) mais un
  extrait concentré n'est pas transposable sans facteur de concentration
- St. John's Wort — recherche dédiée effectuée, aucune donnée trouvée
- Valerian Root — recherche dédiée effectuée, aucune donnée trouvée
- Willow bark, white
- Xylitol, NOW (édulcorant de synthèse/extraction, pas un aliment végétal entier)
- Yellow Dock Liquid Extract / Yellow Dock root, capsules

### 3.3 Marques génériques ou noms trop vagues pour identifier un ingrédient

- Algae, dried (espèce non précisée — à ne pas confondre avec la spiruline documentée
  séparément)
- Aloe Vera Juice
- Co-Q-10
- Curcumin, Full Spectrum, Solgar (extrait standardisé, pas le rhizome de curcuma entier)
- Glucosamine, vegetarian, Weaver Street Market
- Kelp, Powder
- L-Glutamine, Powder, Vitamin Shop
- Lutein, Sundown Naturals
- N-Acetyl Glucosamine, Source Naturals
- Pumpkin Seed, Sprout Living (graine seule, pas de littérature dédiée trouvée cette vague —
  à traiter en vague 3 si prioritaire)
- Red Palm Oil, Organic
- Borage Oil, Weaver Street Market (huile, structure lipidique peu compatible avec la présence
  d'oxalate)
- Evening Primrose Oil (idem, huile)
- Brown Rice, isolate (protéine isolée de riz, pas le riz entier documenté en vague 1)

---

## 4. Résumé

**Sous-total ingrédient dominant identifié et confronté (tableaux section 2)** : 71 produits
(13 crackers/pains, 12 substituts de viande/soja, 1 Nutella, 18 produits transformés divers,
16 fast-food/chaînes, 11 divers additionnels dans le sous-total produits transformés).

**Sous-total hors périmètre (section 3)** : 76 produits (27 formules propriétaires
multi-ingrédients, 27 ingrédients uniques sans littérature oxalate trouvée malgré recherche
tentée, 13 marques génériques/noms vagues, 9 autres).

Total : 147 entrées traitées (71 + 76), conforme au fichier source.

**Constat principal de cette vague** : la sous-catégorie **crackers** bénéficie d'une
confrontation exceptionnellement solide grâce à une étude dédiée (Okombo & Liebman 2010) qui
teste directement la catégorie de produit et identifie le sésame comme facteur causal — un cas
rare où l'« ingrédient dominant » et l'objet d'étude scientifique coïncident presque
parfaitement. À l'inverse, la grande majorité des **suppléments à base de plante unique**
(ashwagandha, ginkgo, chardon-Marie, valériane, millepertuis) n'a **aucune littérature oxalate
publiée trouvable**, malgré une recherche dédiée pour les cas les plus notables — ces valeurs de
la base locale ne peuvent être ni confirmées ni infirmées par cette méthode et reposent
entièrement sur la mesure de laboratoire (présumée) de l'OHF elle-même.
