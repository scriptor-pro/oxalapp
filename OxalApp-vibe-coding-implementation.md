# OxalApp — Instructions d’implémentation pour une IA de vibe-coding

**Date : 26-08-2026**  
**Objectif :** faire évoluer OxalApp pour maximiser la reconnaissance des produits scannés et fournir une estimation aussi rigoureuse que possible de leur charge réelle en oxalates, avec niveau d’incertitude explicite.

## 1. Mission

Faire évoluer **OxalApp**, une application Android qui scanne des codes-barres alimentaires, afin qu’elle puisse :

1. reconnaître le plus grand nombre possible de produits ;
2. récupérer les informations produit et la liste d’ingrédients depuis plusieurs sources ;
3. identifier les ingrédients susceptibles de contribuer à la charge en oxalates ;
4. tenir compte de la **proportion réelle ou estimée** de ces ingrédients dans le produit ;
5. tenir compte, lorsqu’elle est connue, de la **forme de l’aliment** et de son **mode de préparation** ;
6. estimer une **charge en oxalates par 100 g et par portion** lorsqu’une estimation quantitative est défendable ;
7. distinguer clairement mesure directe, valeur calculée, estimation et simple signal qualitatif ;
8. afficher la **confiance** et les **sources utilisées** ;
9. éviter toute fausse précision ;
10. rester utile même lorsqu’un code-barres est absent des bases principales.

L’objectif n’est **pas** de transformer OxalApp en outil médical ou diagnostique.

---

## 2. Architecture générale

Séparer strictement deux moteurs.

### A. Product Resolver

Responsable de :
- scanner le code-barres ;
- normaliser le code ;
- identifier le produit ;
- récupérer nom, marque, catégorie, quantité, portion, ingrédients, proportions d’ingrédients si disponibles, langue, pays et données nutritionnelles utiles.

### B. Oxalate Engine

Responsable de :
- normaliser les ingrédients ;
- les faire correspondre à une base canonique ;
- récupérer les valeurs d’oxalates documentées ;
- tenir compte de la forme et de la préparation ;
- calculer ou estimer la contribution de chaque ingrédient ;
- produire une estimation par 100 g, par portion, un intervalle plausible, un niveau de confiance et l’origine principale de la charge en oxalates.

Ne jamais coupler directement `code-barres → valeur d’oxalates`, sauf si une donnée analytique concerne réellement ce produit précis.

---

## 3. Formats de codes-barres à supporter

Supporter au minimum :
- EAN-8
- EAN-13
- UPC-A
- UPC-E
- GTIN-14
- GS1 DataBar
- GS1 DataMatrix
- QR contenant un GS1 Digital Link

Normaliser les identifiants en **GTIN-14** en interne, tout en conservant le code brut et la symbologie détectée.

Valider le chiffre de contrôle avant toute requête distante.

Exemple :

```json
{
  "raw_code": "5412345678901",
  "normalized_gtin14": "05412345678901",
  "symbology": "EAN_13"
}
```

---

## 4. Cascade de résolution produit

### Source 1 — Open Food Facts

Source principale pour Belgique, Europe et produits internationaux.

Récupérer si disponible :
- code-barres ;
- `product_name` ;
- `brands` ;
- `quantity` ;
- `serving_size` ;
- catégories ;
- pays ;
- `ingredients_text` ;
- ingrédients structurés ;
- `percent` ;
- `percent_min` ;
- `percent_max` ;
- `percent_estimate` ;
- nutriments ;
- langue.

Ne pas considérer une fiche comme complète simplement parce qu’elle existe. Attribuer un score de qualité aux données.

### Source 2 — USDA FoodData Central / Branded Foods

À utiliser surtout pour les produits américains.

Récupérer :
- GTIN/UPC ;
- description ;
- marque ;
- ingrédients ;
- portion ;
- catégorie ;
- nutriments disponibles.

### Source 3 — autres fournisseurs

Prévoir une interface permettant d’ajouter ultérieurement :
- GS1 / Verified by GS1 ;
- UPCitemdb ;
- bases régionales ;
- autres sources ouvertes.

Architecture recommandée :

```text
ProductDataSource
 ├── OpenFoodFactsSource
 ├── USDAFoodDataCentralSource
 ├── GS1Source
 └── OtherSource
```

Ne pas coder toute l’application autour d’une seule API.

---

## 5. Fusion des données produit

Un même code-barres peut exister dans plusieurs sources.

Créer un objet produit interne normalisé et conserver la provenance de chaque champ.

Exemple :

```json
{
  "gtin": "...",
  "product_name": "...",
  "brand": "...",
  "ingredients": [],
  "serving_size_g": null,
  "net_weight_g": null,
  "categories": [],
  "sources": [],
  "data_quality": {}
}
```

Pour chaque donnée importante, conserver sa source. Ne jamais écraser silencieusement une valeur provenant d’une autre base.

---

## 6. Fallback pour produit inconnu

Si aucun fournisseur ne reconnaît le code-barres :

1. proposer à l’utilisateur de photographier la face avant ;
2. demander une photo de la liste d’ingrédients ;
3. faire de l’OCR ;
4. extraire nom, marque, ingrédients, quantité et portion si disponible ;
5. analyser le produit malgré l’absence de fiche distante.

Message recommandé :

> Produit absent de nos bases. OxalApp peut tenter une analyse à partir de l’étiquette.

Ne pas s’arrêter à « produit inconnu ».

---

## 7. Base canonique des aliments

Créer une base indépendante des langues.

Exemples d’identifiants :
- `SPINACH`
- `HAZELNUT`
- `COCOA_POWDER`
- `ALMOND`
- `POTATO`
- `RHUBARB`
- `BEETROOT`

Créer une table d’alias multilingues.

Exemple :

```text
SPINACH
- épinard
- épinards
- spinach
- Spinat
- spinaci
```

Le moteur doit reconnaître variantes linguistiques, pluriels, accents, formes et préparations.

---

## 8. Forme et préparation

Ne pas assimiler automatiquement :
- épinards crus ;
- épinards bouillis ;
- épinards égouttés ;
- épinards surgelés ;
- épinards hachés ;
- poudre d’épinards.

Créer une taxonomie de préparation, par exemple :

```text
RAW
FROZEN
BOILED
STEAMED
BAKED
ROASTED
DRIED
POWDERED
DRAINED
FERMENTED
UNKNOWN
```

La forme et la préparation doivent faire partie du matching vers les valeurs d’oxalates.

---

## 9. Base des valeurs d’oxalates

Créer une base distincte des bases de produits commerciaux.

### Source prioritaire A — FSANZ / Australian Food Composition Database

Importer les données pertinentes de l’AFCD.

Ne pas scraper l’interface web. Utiliser les fichiers officiels téléchargeables et produire un import reproductible.

Examiner en particulier :
- Food details ;
- Nutrient profiles ;
- Nutrient details ;
- Recipes ;
- références et métadonnées analytiques.

Rechercher le nutriment `Oxalic acid`.

Conserver les valeurs originales et leurs unités.

### Source prioritaire B — publications scientifiques

Permettre l’ajout de valeurs issues d’articles scientifiques.

Chaque valeur doit avoir une référence bibliographique et, si possible, une méthode analytique.

### Source C — autres bases

Prévoir l’ajout futur de données Harvard si leur licence le permet, et d’autres datasets publics.

---

## 10. Schéma recommandé pour les mesures d’oxalates

```text
oxalate_measurement
-------------------
id
canonical_food_id
preparation
total_oxalate_mg_per_100g
soluble_oxalate_mg_per_100g
insoluble_oxalate_mg_per_100g
min_value
max_value
mean_value
median_value
sample_count
measurement_method
source_name
source_reference
source_url
country
year
derivation_type
confidence
notes
```

`derivation_type` doit au minimum accepter :

```text
MEASURED
CALCULATED
ESTIMATED
BORROWED
UNKNOWN
```

Ne jamais convertir une donnée affichée comme `0 g` en `0 mg` sans vérifier la précision et la méthode d’arrondi de la source.

Distinguer :
- zéro analytique ;
- sous limite de détection ;
- valeur arrondie ;
- donnée absente ;
- donnée inconnue.

---

## 11. Proportions d’ingrédients

### Cas A — proportion déclarée

Exemple :

```text
épinards 55 %
crème 20 %
```

Utiliser directement le pourcentage déclaré.

### Cas B — proportion estimée par une source

Si Open Food Facts fournit :
- `percent_min` ;
- `percent_max` ;
- `percent_estimate` ;

les conserver séparément.

Ne jamais transformer une estimation en donnée certaine.

### Cas C — proportion inconnue

Utiliser :
- l’ordre décroissant des ingrédients ;
- les pourcentages connus des ingrédients voisins ;
- des contraintes mathématiques plausibles.

Produire une fourchette.

Ne jamais demander à un LLM d’inventer un pourcentage.

---

## 12. Calcul de la charge en oxalates

Pour chaque ingrédient disposant d’une valeur quantitative :

```text
contribution = concentration_oxalate_ingrédient × fraction_massique
```

Puis :

```text
oxalate_total_produit = somme(contributions)
```

Toujours conserver :
- estimation basse ;
- estimation centrale ;
- estimation haute.

### Cas critique 1 — épinards à la crème

Si les épinards représentent, par exemple, 55 % du produit, la charge finale doit refléter cette proportion importante.

### Cas critique 2 — fragments de noisettes

Pour un biscuit contenant 0,8 % de noisettes, leur contribution doit être calculée proportionnellement à 0,8 %.

La simple présence d’un ingrédient riche en oxalates ne doit jamais suffire à classer le produit entier comme riche en oxalates.

---

## 13. Mentions « traces »

Distinguer strictement :
- contient ;
- peut contenir ;
- traces possibles ;
- fabriqué dans un atelier utilisant…

Une mention comme :

> peut contenir des traces de noisettes

ne doit générer **aucune contribution quantitative** à la charge en oxalates.

---

## 14. Interdire la logique binaire présence/absence

Interdire toute logique métier de type :

```text
if ingredient in HIGH_OXALATE_LIST:
    product = HIGH
```

La classification finale doit dériver de la charge estimée du produit, pas seulement de la présence d’un ingrédient.

---

## 15. Incertitude

Ne jamais afficher une fausse précision.

Préférer :

> Estimation : 25–50 mg / 100 g

à :

> 37,2 mg / 100 g

si les proportions ou les données analytiques sont incertaines.

Créer quatre niveaux de confiance :

### Niveau A — mesuré
Le produit précis ou une préparation quasiment identique a été analysé.

### Niveau B — calculé
Les proportions sont connues et les valeurs analytiques sont solides.

### Niveau C — estimé
Une ou plusieurs proportions sont estimées.

### Niveau D — qualitatif
Les ingrédients sont identifiés mais le calcul quantitatif n’est pas défendable.

---

## 16. Résultat utilisateur

Exemple :

```text
Oxalates estimés
ÉLEVÉS

80–130 mg / 100 g
40–65 mg par portion

Confiance : moyenne
```

Puis :

```text
Principales sources estimées d’oxalates
1. Épinards — ~92 %
2. Autres ingrédients — ~8 %
```

Puis :

```text
Pourquoi cette estimation ?
- Produit identifié via Open Food Facts
- Épinards déclarés à 55 %
- Valeur de référence issue de FSANZ
```

Ajouter :

`Voir les sources et le détail du calcul`

---

## 17. Calcium et biodisponibilité

Ne pas soustraire automatiquement le calcium de la charge en oxalates.

La présence de calcium peut être signalée séparément, avec une formulation prudente.

Ne pas calculer une « teneur corrigée » arbitraire.

---

## 18. Rôle autorisé du LLM

Le LLM peut être utilisé pour :
- mapper des synonymes ;
- reconnaître des ingrédients canoniques ;
- traduire ;
- interpréter des formulations d’étiquette ;
- proposer une catégorisation ;
- identifier une préparation ;
- générer des tests ;
- expliquer le résultat en langage clair.

Exemple :

```text
éclats de noisettes
hazelnut pieces
Haselnussstückchen
```

peuvent être mappés vers :

`HAZELNUT`

---

## 19. Rôle interdit du LLM

Le LLM ne doit jamais :
- inventer une valeur d’oxalates ;
- inventer une proportion ;
- inventer une analyse chimique ;
- fabriquer une référence scientifique ;
- convertir une absence de donnée en zéro ;
- affirmer qu’un produit est « sûr » ;
- fabriquer une précision numérique.

Toute valeur quantitative doit être traçable à une source ou à un calcul transparent.

---

## 20. Provenance

Chaque résultat doit conserver sa provenance.

Exemple :

```json
{
  "product_source": ["open_food_facts"],
  "ingredient_source": ["open_food_facts"],
  "oxalate_sources": [
    {
      "name": "FSANZ AFCD",
      "food": "spinach",
      "reference": "..."
    }
  ],
  "calculation_method": "ingredient_weighted_estimate"
}
```

L’utilisateur doit pouvoir consulter ces informations.

---

## 21. Licences et datasets

Conserver les datasets séparés par source :

```text
data/
├── openfoodfacts/
├── usda/
├── fsanz/
└── oxalapp_curated/
```

Pour chaque source, stocker :
- `LICENSE`
- `SOURCE`
- `VERSION`
- `IMPORT_DATE`
- `ATTRIBUTION`

Ne jamais fusionner les données sans conserver leur provenance et leur licence.

---

## 22. Import FSANZ

Créer un import reproductible :

```text
FSANZ Excel/CSV
    ↓
validation
    ↓
normalisation unités
    ↓
mapping aliments
    ↓
oxalapp.db
```

Le script doit :
1. conserver le fichier source intact ;
2. enregistrer sa version et sa date ;
3. convertir les unités sans perdre la valeur originale ;
4. journaliser les erreurs ;
5. signaler les aliments impossibles à mapper ;
6. ne jamais résoudre automatiquement une ambiguïté sans trace.

---

## 23. Base locale

Si l’architecture actuelle le permet, utiliser SQLite pour les données de référence côté Android.

Tables minimales :

```text
products_cache
canonical_food
food_alias
food_form
oxalate_measurement
source
ingredient_mapping
analysis_result
```

Prévoir les migrations de schéma.

---

## 24. Cache et versionnage

Mettre en cache les produits déjà analysés.

Clé principale : `GTIN`.

Stocker :
- données produit ;
- date ;
- sources ;
- version du moteur ;
- version des datasets.

Chaque résultat doit contenir :

```text
analysis_engine_version
oxalate_dataset_version
product_data_timestamp
```

Permettre un recalcul lorsqu’un dataset change.

---

## 25. Accessibilité

Exigences minimales :
- contraste WCAG AA ;
- ne jamais utiliser uniquement la couleur ;
- compatibilité TalkBack ;
- labels accessibles ;
- respect des tailles de texte Android ;
- zones tactiles suffisantes ;
- messages d’erreur explicites ;
- langage simple.

Ne pas afficher uniquement un cercle rouge. Afficher explicitement `Élevé`.

---

## 26. Catégories de résultat

Prévoir :

```text
VERY_LOW
LOW
MODERATE
HIGH
VERY_HIGH
UNKNOWN
```

Ne pas inventer les seuils. Ils doivent être documentés, configurables et indépendants du code de calcul.

---

## 27. Tests unitaires obligatoires

### Barcode
- EAN-13 valide ;
- UPC valide ;
- GTIN-14 ;
- checksum incorrect ;
- code invalide.

### Ingrédients
- pourcentage explicite ;
- absence de pourcentage ;
- « traces de noisettes » ;
- ingrédient composé ;
- plusieurs langues.

### Oxalates
- valeur mesurée ;
- intervalle ;
- valeur absente ;
- valeur arrondie ;
- préparation différente.

### Calcul
- ingrédient à 55 % ;
- ingrédient à 0,8 % ;
- plusieurs sources d’oxalates ;
- aucun ingrédient mappable ;
- valeurs contradictoires.

### Confiance
- A ;
- B ;
- C ;
- D.

---

## 28. Tests fonctionnels obligatoires

### Cas A — épinards à la crème surgelés

Attendu :
- produit reconnu ;
- épinard identifié ;
- proportion utilisée ;
- préparation détectée si possible ;
- charge élevée si les données la justifient ;
- intervalle si nécessaire ;
- source visible.

### Cas B — biscuit avec fragments de noisettes

Attendu :
- noisette reconnue ;
- faible proportion prise en compte ;
- absence d’alerte disproportionnée ;
- autres ingrédients riches en oxalates également analysés.

### Cas C — « peut contenir des traces de noisettes »

Attendu :
- aucune contribution numérique ajoutée ;
- mention de trace ignorée pour le calcul.

### Cas D — code inconnu

Attendu :
- proposer OCR ;
- analyser l’étiquette ;
- ne pas bloquer l’utilisateur.

---

## 29. Performance et mode hors ligne

Objectif :
- résultat initial rapide ;
- enrichissement progressif.

Ordre recommandé :
1. cache local ;
2. Open Food Facts ;
3. autres sources en parallèle lorsque pertinent ;
4. Oxalate Engine local ;
5. enrichissement de provenance ensuite.

Prévoir au minimum hors ligne :
- base locale des oxalates ;
- cache des produits déjà scannés ;
- résultats précédents.

---

## 30. Écran de détail technique

Ajouter un écran facultatif `Détails de l’analyse` contenant :
- produit ;
- GTIN ;
- sources produit ;
- liste d’ingrédients ;
- proportions ;
- correspondances alimentaires ;
- valeurs d’oxalates utilisées ;
- calcul ;
- intervalle ;
- confiance ;
- références ;
- version des données.

---

## 31. Gestion des valeurs contradictoires

Si plusieurs études donnent des valeurs différentes :
- ne pas choisir arbitrairement ;
- conserver les mesures ;
- comparer les préparations ;
- produire une plage ou un agrégat défendable ;
- afficher la variabilité lorsqu’elle est importante.

---

## 32. Architecture logicielle recommandée

```text
Scanner
  ↓
BarcodeNormalizer
  ↓
ProductResolver
  ├── OpenFoodFacts
  ├── USDA
  ├── Other providers
  └── OCR fallback
  ↓
ProductNormalizer
  ↓
IngredientParser
  ↓
IngredientCanonicalizer
  ↓
OxalateKnowledgeBase
  ↓
OxalateCalculator
  ↓
UncertaintyEngine
  ↓
ResultPresenter
```

Chaque composant doit être testable indépendamment.

---

## 33. Critères de Done

- [ ] Plusieurs formats de codes-barres sont supportés.
- [ ] Les GTIN sont normalisés.
- [ ] Open Food Facts fonctionne.
- [ ] USDA Branded Foods peut être interrogé ou importé.
- [ ] Un fallback OCR existe ou est préparé.
- [ ] Les ingrédients sont normalisés.
- [ ] Les proportions sont prises en compte.
- [ ] Les mentions de traces sont exclues du calcul.
- [ ] FSANZ peut être importé.
- [ ] Les valeurs d’oxalates sont sourcées.
- [ ] Les préparations différentes sont distinguées.
- [ ] Les résultats utilisent des intervalles quand nécessaire.
- [ ] Le niveau de confiance est affiché.
- [ ] L’utilisateur peut consulter la provenance.
- [ ] L’UI reste accessible.
- [ ] Les cas épinards/noisettes passent les tests.
- [ ] Aucune valeur chimique n’est inventée par un LLM.

---

## 34. Plan d’implémentation recommandé

### Phase 1 — Refactor
- isoler le scanner ;
- créer `ProductResolver` ;
- normaliser GTIN ;
- encapsuler Open Food Facts.

### Phase 2 — Multi-source
- ajouter USDA Branded Foods ;
- fusionner les sources ;
- ajouter le cache.

### Phase 3 — Base canonique
- `canonical_food` ;
- alias ;
- formes ;
- préparations.

### Phase 4 — FSANZ
- importer AFCD ;
- vérifier les unités ;
- mapper `Oxalic acid` ;
- conserver la provenance.

### Phase 5 — Moteur quantitatif
- proportions ;
- contributions ;
- intervalles ;
- confiance.

### Phase 6 — UI
- écran résultat ;
- explication des contributions ;
- provenance ;
- accessibilité.

### Phase 7 — Fallback
- OCR ;
- analyse d’étiquette ;
- gestion des produits absents.

### Phase 8 — Validation
- tests unitaires ;
- tests fonctionnels ;
- comparaison avec cas réels ;
- documentation.

---

## 35. Consigne de travail pour l’IA de vibe-coding

À chaque étape :

1. inspecter le code existant avant de modifier quoi que ce soit ;
2. identifier les fichiers concernés ;
3. proposer les modifications minimales cohérentes ;
4. implémenter sans casser les fonctions existantes ;
5. ajouter ou mettre à jour les tests ;
6. exécuter les tests ;
7. corriger les régressions ;
8. résumer :
   - fichiers modifiés,
   - comportement ajouté,
   - limites restantes ;
9. ne jamais inventer une API, un endpoint ou un champ sans vérifier la documentation de la source ;
10. ne jamais supprimer une fonctionnalité existante pour simplifier l’implémentation sans autorisation explicite.

---

## 36. Règles de sécurité pour le vibe-coding

L’IA doit demander validation avant :
- migration destructive de base ;
- suppression de données ;
- changement de licence ;
- ajout d’un service payant ;
- ajout d’une API nécessitant une clé secrète dans l’APK ;
- modification majeure de l’architecture ;
- transmission de données utilisateur à un tiers.

Aucune clé API privée ne doit être hardcodée dans l’APK.

---

## 37. Résultat attendu

OxalApp doit répondre à une question plus utile que :

> Cet aliment contient-il des oxalates ?

La question cible est :

> **Quelle charge en oxalates ce produit est-il susceptible d’apporter dans la quantité réellement consommée, quels ingrédients y contribuent, et à quel point cette estimation est-elle fiable ?**

Cette question doit guider les décisions produit, architecture, données et interface.
