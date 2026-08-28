import type { StructuredIngredient } from "./off-client";

export type OxalateLevel = "faible" | "modéré" | "élevé" | "très élevé";
export type MatchLevel = OxalateLevel | "non déterminable";

export interface MatchedIngredient {
  ingredientText: string;
  dbItem: string;
  level: OxalateLevel;
  percentEstimate?: number;
  levelBeforeAdjustment?: OxalateLevel;
}

export interface MatchResult {
  level: MatchLevel;
  matchedIngredients: MatchedIngredient[];
}

export interface KnownIngredient {
  keyword: string; // matched as a normalized substring
  dbItem: string;
  level: OxalateLevel;
  // Set when the keyword's plural isn't a simple trailing "s" (e.g. Dutch
  // stem-change plurals like "hazelnoot" -> "hazelnoten", "linze" ->
  // "linzen"). When present, this exact form is matched instead of
  // appending "s?" to the keyword.
  pluralOverride?: string;
  // Words that must NOT immediately follow the keyword for a match to
  // count (e.g. "potato" alone shouldn't match "potato starch"/"potato
  // flour", which OHF rates far lower than whole potato).
  excludeFollowedBy?: string[];
}

// Curated high-signal keywords. Sourced from CLAUDE.md's list of known
// risk ingredients, reclassified per the Mayo Clinic Oxalate Diet
// Handbook thresholds (faible<5/modéré5-8/élevé8-25/très élevé>25
// mg/portion — see docs/superpowers/specs/2026-07-30-oxalate-scoring-recalibration-design.md).
// Deliberately excludes short/generic PDF item names (e.g. "Salt") that
// would false-positive against unrelated ingredient text.
export const KNOWN_INGREDIENTS: KnownIngredient[] = [
  { keyword: "cacao", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé" },
  { keyword: "cocoa", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé" },
  { keyword: "epinard", dbItem: "Spinach", level: "très élevé" },
  { keyword: "rhubarbe", dbItem: "Rhubarb, stewed or canned", level: "très élevé" },
  { keyword: "amande", dbItem: "Almonds", level: "très élevé" },
  { keyword: "son de ble", dbItem: "Wheat Bran", level: "très élevé" },
  { keyword: "betterave", dbItem: "Beets, boiled, steamed or pickled", level: "très élevé" },
  { keyword: "patate douce", dbItem: "Sweet Potato, Orange", level: "très élevé" },
  { keyword: "the noir", dbItem: "Tea, Black", level: "très élevé" },
  { keyword: "the vert", dbItem: "Tea, Green", level: "élevé" },

  // Élargissement 2026-08-20 : céréales/légumineuses/fruits à coque/épices,
  // filtré sur les entrées élevé/très élevé de oxalate-database.json
  // (lui-même dérivé du PDF OHF), en excluant les marques US non
  // pertinentes pour le marché belge/français et les mots-clés jugés trop
  // génériques pour éviter les faux positifs (ex: "blé", "noix" seuls).
  { keyword: "piment de la jamaique", dbItem: "Allspice", level: "élevé" },
  { keyword: "anis", dbItem: "Anise", level: "élevé" },
  { keyword: "basilic", dbItem: "Basil, Sweet, Fresh", level: "élevé" },
  { keyword: "noix du bresil", dbItem: "Brazil Nuts", level: "très élevé" },
  { keyword: "sarrasin", dbItem: "Cereals, Buckwheat", level: "très élevé" },
  { keyword: "noix de cajou", dbItem: "Nuts, Cashew", level: "très élevé" },
  { keyword: "graines de celeri", dbItem: "Celery Seeds", level: "très élevé" },
  { keyword: "chataigne", dbItem: "Chestnut, roasted", level: "élevé" },
  { keyword: "piment en poudre", dbItem: "Chili Powder", level: "élevé" },
  { keyword: "cannelle", dbItem: "Cinnamon, ground", level: "très élevé" },
  { keyword: "clou de girofle", dbItem: "Cloves, dried, ground", level: "très élevé" },
  { keyword: "graines de coriandre", dbItem: "Coriander seed, dried", level: "élevé" },
  { keyword: "cumin", dbItem: "Cumin, ground", level: "élevé" },
  { keyword: "curry", dbItem: "Curry Powder", level: "élevé" },
  { keyword: "edamame", dbItem: "Legumes, Edamame", level: "élevé" },
  { keyword: "graines de fenouil", dbItem: "Fennel seed, dried", level: "élevé" },
  { keyword: "gingembre", dbItem: "Ginger, Ground", level: "élevé" },
  { keyword: "noisette", dbItem: "Hazelnut or filberts, Raw", level: "très élevé" },
  { keyword: "myrte citronne", dbItem: "Lemon Myrtle, dried, ground", level: "très élevé" },
  { keyword: "zeste de citron", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "lentille", dbItem: "Legumes, Lentils, variety", level: "élevé" },
  { keyword: "macadamia", dbItem: "Nuts, Macadamia", level: "élevé" },
  { keyword: "millet", dbItem: "Grains, Millet", level: "très élevé" },
  { keyword: "zeste d'orange", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "zeste d orange", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "origan", dbItem: "Oregano, ground", level: "élevé" },
  { keyword: "beurre de cacahuete", dbItem: "Peanut Butter", level: "très élevé" },
  { keyword: "cacahuete", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "arachide", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "noix de pecan", dbItem: "Pecans raw or roasted", level: "élevé" },
  { keyword: "pignon de pin", dbItem: "Nuts, Pine, raw or roasted", level: "très élevé" },
  { keyword: "pistache", dbItem: "Nuts, Pistachio", level: "élevé" },
  { keyword: "haricots frits", dbItem: "Legumes, Refried beans", level: "très élevé" },
  { keyword: "sarriette", dbItem: "Savory, ground", level: "élevé" },
  { keyword: "noix de soja", dbItem: "Nuts, Soynuts", level: "élevé" },
  { keyword: "tempeh", dbItem: "Legumes, Tempeh", level: "très élevé" },
  { keyword: "curcuma", dbItem: "Turmeric", level: "très élevé" },
  { keyword: "noix de grenoble", dbItem: "Nuts, Walnuts", level: "élevé" },
  { keyword: "ble en grains", dbItem: "Grains, Wheat berries", level: "élevé" },
  { keyword: "ble concasse", dbItem: "Grains, Wheat berries", level: "élevé" },

  // Élargissement légumes 2026-08-20, même méthode et même source
  // (oxalate-database.json, niveaux élevé/très élevé) que l'élargissement
  // céréales/légumineuses/fruits à coque/épices ci-dessus. "tomate" et
  // "pomme de terre" sont volontairement gardés malgré leur fréquence
  // très élevée dans les produits transformés (choix explicite de
  // l'utilisateur — préférer alerter souvent plutôt que jamais, à la
  // différence de "blé"/"riz" exclus plus haut pour la raison inverse).
  { keyword: "algue seche", dbItem: "Algae, dried", level: "très élevé" },
  { keyword: "artichaut", dbItem: "Artichoke, boiled", level: "élevé" },
  { keyword: "pousse de bambou", dbItem: "Bamboo shoots", level: "très élevé" },
  { keyword: "margose", dbItem: "Bitter Gourd, Fresh", level: "très élevé" },
  { keyword: "chou de bruxelles", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "nopal", dbItem: "Cactus, Nopal, Raw", level: "très élevé" },
  { keyword: "carotte", dbItem: "Carrots, raw", level: "très élevé" },
  { keyword: "celeri", dbItem: "Celery, raw, stem only, diced", level: "très élevé" },
  { keyword: "pissenlit", dbItem: "Dandelion greens, red rib, raw or boiled", level: "élevé" },
  { keyword: "aubergine", dbItem: "Eggplant, raw, boiled, baked or roasted", level: "très élevé" },
  { keyword: "fenouil", dbItem: "Fennel, boiled", level: "élevé" },
  { keyword: "coeur de palmier", dbItem: "Hearts of Palm, whole", level: "très élevé" },
  { keyword: "poireau", dbItem: "Leeks, raw", level: "élevé" },
  { keyword: "blette", dbItem: "Mangold or Spinach beet", level: "très élevé" },
  { keyword: "gombo", dbItem: "Okra, Boiled, simmered", level: "très élevé" },
  { keyword: "panais", dbItem: "Parsnips, boiled", level: "élevé" },
  { keyword: "pomme de terre", pluralOverride: "pommes de terre", dbItem: "Potato, White, deep fried", level: "très élevé" },
  { keyword: "pourpier", dbItem: "Purslane, leaves", level: "très élevé" },
  { keyword: "oseille", dbItem: "Sorrel, raw", level: "très élevé" },
  { keyword: "tomate", dbItem: "Tomato, Variety, All Colors, Raw", level: "élevé" },
  { keyword: "igname", dbItem: "Yam, flesh only, baked", level: "très élevé" },

  // Élargissement fruits 2026-08-20, même méthode/source que les passes
  // précédentes. Le sureau, le cassis et la groseille (baies) n'ont pas
  // de synonyme NL ici — traduction NL trop ambiguë/composée pour être
  // sûre sans revue native (voir principe déjà appliqué : mieux vaut
  // omettre qu'un mot-clé faux). "mure" et "orange" ont été retirés après
  // revue de code : "mure" collide (une fois désaccentué) avec l'adjectif
  // très courant "mûr/mûre" ("banane mûre"), et "orange" est un mot
  // générique de couleur/arôme fréquent hors contexte du fruit
  // ("colorant orange") — même risque que "blé"/"noix" déjà exclus.
  { keyword: "abricot", dbItem: "Apricots, Fresh", level: "élevé" },
  { keyword: "myrtille", dbItem: "Berries, Blueberries, fresh or frozen", level: "très élevé" },
  { keyword: "canneberge", dbItem: "Berries, Cranberries", level: "élevé" },
  { keyword: "sureau", dbItem: "Berries, Elderberries, raw, black", level: "très élevé" },
  { keyword: "framboise", dbItem: "Berries, Raspberries, raw", level: "élevé" },
  { keyword: "fraise", dbItem: "Berries, Strawberries, canned", level: "élevé" },
  { keyword: "cassis", dbItem: "Currants, Black, raw", level: "élevé" },
  { keyword: "groseille", dbItem: "Currants, Red, raw", level: "élevé" },
  { keyword: "figue", dbItem: "Figs, fresh", level: "élevé" },
  { keyword: "goyave", dbItem: "Guava", level: "très élevé" },
  { keyword: "kiwi", dbItem: "Kiwi, fresh, raw", level: "très élevé" },
  { keyword: "grenade", dbItem: "Pomegranate, seed and juice sacs", level: "très élevé" },
  { keyword: "pruneau", dbItem: "Prunes, pitted", level: "très élevé" },
  { keyword: "carambole", dbItem: "Star Fruit or Carambola, raw", level: "très élevé" },

  // Élargissement laitiers/boissons 2026-08-20. La plupart des entrées
  // OHF de ces catégories (laits/yaourts végétaux à base d'amande,
  // cajou, noisette, soja) sont déjà couvertes par les mots-clés de
  // fruits à coque ci-dessus — seuls les 3 ingrédients ci-dessous
  // n'avaient pas d'équivalent déjà présent.
  { keyword: "lait d'avoine", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "lait d avoine", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "eau de coco", dbItem: "Coconut Water", level: "élevé" },
  { keyword: "the mate", dbItem: "Tea, Herbal, Mate", level: "élevé" },

  // Synonymes néerlandais 2026-08-20 : de nombreux produits sur Open Food
  // Facts pour le marché belge sont étiquetés uniquement en néerlandais
  // (ex: "Kurkuma" plutôt que "curcuma"). Traductions non revues par un
  // locuteur natif — entrées omises quand le traducteur n'était pas
  // confiant plutôt que de risquer une correspondance fausse (voir
  // discussion en session : piment de la Jamaïque, myrte citronné,
  // haricots frits, noix de soja et blé concassé n'ont pas de synonyme NL
  // ici pour cette raison).
  { keyword: "spinazie", dbItem: "Spinach", level: "très élevé" },
  { keyword: "rabarber", dbItem: "Rhubarb, stewed or canned", level: "très élevé" },
  { keyword: "amandel", dbItem: "Almonds", level: "très élevé" },
  { keyword: "tarwezemelen", dbItem: "Wheat Bran", level: "très élevé" },
  { keyword: "biet", dbItem: "Beets, boiled, steamed or pickled", level: "très élevé" },
  { keyword: "zoete aardappel", dbItem: "Sweet Potato, Orange", level: "très élevé" },
  { keyword: "zwarte thee", dbItem: "Tea, Black", level: "très élevé" },
  { keyword: "groene thee", dbItem: "Tea, Green", level: "élevé" },
  { keyword: "anijs", dbItem: "Anise", level: "élevé" },
  { keyword: "basilicum", dbItem: "Basil, Sweet, Fresh", level: "élevé" },
  { keyword: "paranoot", pluralOverride: "paranoten", dbItem: "Brazil Nuts", level: "très élevé" },
  { keyword: "boekweit", dbItem: "Cereals, Buckwheat", level: "très élevé" },
  { keyword: "cashewnoot", pluralOverride: "cashewnoten", dbItem: "Nuts, Cashew", level: "très élevé" },
  { keyword: "selderijzaad", dbItem: "Celery Seeds", level: "très élevé" },
  { keyword: "kastanje", dbItem: "Chestnut, roasted", level: "élevé" },
  { keyword: "chilipoeder", dbItem: "Chili Powder", level: "élevé" },
  { keyword: "kaneel", dbItem: "Cinnamon, ground", level: "très élevé" },
  { keyword: "kruidnagel", dbItem: "Cloves, dried, ground", level: "très élevé" },
  { keyword: "korianderzaad", dbItem: "Coriander seed, dried", level: "élevé" },
  { keyword: "komijn", dbItem: "Cumin, ground", level: "élevé" },
  { keyword: "kerrie", dbItem: "Curry Powder", level: "élevé" },
  { keyword: "venkelzaad", dbItem: "Fennel seed, dried", level: "élevé" },
  { keyword: "gember", dbItem: "Ginger, Ground", level: "élevé" },
  { keyword: "hazelnoot", pluralOverride: "hazelnoten", dbItem: "Hazelnut or filberts, Raw", level: "très élevé" },
  { keyword: "citroenschil", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "linze", pluralOverride: "linzen", dbItem: "Legumes, Lentils, variety", level: "élevé" },
  { keyword: "macadamianoot", pluralOverride: "macadamianoten", dbItem: "Nuts, Macadamia", level: "élevé" },
  { keyword: "gierst", dbItem: "Grains, Millet", level: "très élevé" },
  { keyword: "sinaasappelschil", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "oregano", dbItem: "Oregano, ground", level: "élevé" },
  { keyword: "pindakaas", dbItem: "Peanut Butter", level: "très élevé" },
  { keyword: "pinda", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "pecannoot", pluralOverride: "pecannoten", dbItem: "Pecans raw or roasted", level: "élevé" },
  { keyword: "pijnboompit", dbItem: "Nuts, Pine, raw or roasted", level: "très élevé" },
  { keyword: "pistachenoot", pluralOverride: "pistachenoten", dbItem: "Nuts, Pistachio", level: "élevé" },
  { keyword: "bonenkruid", dbItem: "Savory, ground", level: "élevé" },
  { keyword: "tempeh", dbItem: "Legumes, Tempeh", level: "très élevé" },
  { keyword: "kurkuma", dbItem: "Turmeric", level: "très élevé" },
  { keyword: "walnoot", pluralOverride: "walnoten", dbItem: "Nuts, Walnuts", level: "élevé" },
  { keyword: "tarwekorrels", dbItem: "Grains, Wheat berries", level: "élevé" },

  // Synonymes néerlandais pour l'élargissement légumes ci-dessus (même
  // 2026-08-20). "nopal" et "coeur de palmier" n'ont pas de synonyme NL
  // ici faute de confiance suffisante dans la traduction (mêmes critères
  // que les 5 entrées omises plus haut).
  { keyword: "artisjok", pluralOverride: "artisjokken", dbItem: "Artichoke, boiled", level: "élevé" },
  { keyword: "bamboescheut", pluralOverride: "bamboescheuten", dbItem: "Bamboo shoots", level: "très élevé" },
  { keyword: "bittere meloen", dbItem: "Bitter Gourd, Fresh", level: "très élevé" },
  { keyword: "spruitje", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "wortel", pluralOverride: "wortelen", dbItem: "Carrots, raw", level: "très élevé" },
  { keyword: "selderij", dbItem: "Celery, raw, stem only, diced", level: "très élevé" },
  { keyword: "paardenbloem", dbItem: "Dandelion greens, red rib, raw or boiled", level: "élevé" },
  // "aubergine" is spelled identically in Dutch, so no separate entry is
  // needed — the French keyword above (line 106) already matches it.
  { keyword: "venkel", dbItem: "Fennel, boiled", level: "élevé" },
  { keyword: "prei", dbItem: "Leeks, raw", level: "élevé" },
  { keyword: "snijbiet", dbItem: "Mangold or Spinach beet", level: "très élevé" },
  { keyword: "okra", dbItem: "Okra, Boiled, simmered", level: "très élevé" },
  { keyword: "pastinaak", dbItem: "Parsnips, boiled", level: "élevé" },
  { keyword: "aardappel", pluralOverride: "aardappelen", dbItem: "Potato, White, deep fried", level: "très élevé" },
  { keyword: "postelein", dbItem: "Purslane, leaves", level: "très élevé" },
  { keyword: "zuring", dbItem: "Sorrel, raw", level: "très élevé" },
  { keyword: "tomaat", pluralOverride: "tomaten", dbItem: "Tomato, Variety, All Colors, Raw", level: "élevé" },
  { keyword: "yam", dbItem: "Yam, flesh only, baked", level: "très élevé" },

  // Synonymes néerlandais pour l'élargissement fruits ci-dessus (même
  // 2026-08-20). Canneberge, cassis, groseille, pruneau et carambole
  // n'ont pas de synonyme NL ici faute de confiance suffisante.
  { keyword: "abrikoos", pluralOverride: "abrikozen", dbItem: "Apricots, Fresh", level: "élevé" },
  { keyword: "braam", pluralOverride: "bramen", dbItem: "Berries, Blackberries, fresh", level: "très élevé" },
  { keyword: "bosbes", pluralOverride: "bosbessen", dbItem: "Berries, Blueberries, fresh or frozen", level: "très élevé" },
  { keyword: "framboos", pluralOverride: "frambozen", dbItem: "Berries, Raspberries, raw", level: "élevé" },
  { keyword: "aardbei", pluralOverride: "aardbeien", dbItem: "Berries, Strawberries, canned", level: "élevé" },
  { keyword: "vijg", pluralOverride: "vijgen", dbItem: "Figs, fresh", level: "élevé" },
  { keyword: "guave", dbItem: "Guava", level: "très élevé" },
  { keyword: "sinaasappel", pluralOverride: "sinaasappelen", dbItem: "Oranges, fresh, variety", level: "élevé" },
  { keyword: "granaatappel", pluralOverride: "granaatappels", dbItem: "Pomegranate, seed and juice sacs", level: "très élevé" },

  // Synonymes néerlandais pour l'élargissement laitiers/boissons ci-dessus.
  { keyword: "havermelk", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "kokoswater", dbItem: "Coconut Water", level: "élevé" },

  // Synonymes anglais 2026-08-21 : plusieurs produits sur Open Food Facts
  // (notamment des marques italiennes/scandinaves/internationales vendues
  // en Belgique) n'ont d'ingrédients qu'en anglais, sans équivalent FR/NL.
  // Même méthode que les passes NL précédentes : traduction directe des
  // mots-clés FR déjà présents, en omettant les entrées où la traduction
  // anglaise serait un mot trop générique hors contexte alimentaire (ex:
  // "curry" existe déjà identique en anglais donc pas de doublon; "mate"
  // seul collide avec "mate" = ami/partenaire, gardé en tant que "yerba
  // mate" pour rester spécifique). "cocoa" et "oregano" existent déjà tels
  // quels dans le bloc français ci-dessus.
  { keyword: "spinach", dbItem: "Spinach", level: "très élevé" },
  { keyword: "rhubarb", dbItem: "Rhubarb, stewed or canned", level: "très élevé" },
  { keyword: "almond", dbItem: "Almonds", level: "très élevé" },
  { keyword: "wheat bran", dbItem: "Wheat Bran", level: "très élevé" },
  { keyword: "beet", pluralOverride: "beets", dbItem: "Beets, boiled, steamed or pickled", level: "très élevé" },
  { keyword: "sweet potato", dbItem: "Sweet Potato, Orange", level: "très élevé" },
  { keyword: "black tea", dbItem: "Tea, Black", level: "très élevé" },
  { keyword: "green tea", dbItem: "Tea, Green", level: "élevé" },
  { keyword: "allspice", dbItem: "Allspice", level: "élevé" },
  { keyword: "anise", dbItem: "Anise", level: "élevé" },
  { keyword: "basil", dbItem: "Basil, Sweet, Fresh", level: "élevé" },
  { keyword: "brazil nut", pluralOverride: "brazil nuts", dbItem: "Brazil Nuts", level: "très élevé" },
  { keyword: "buckwheat", dbItem: "Cereals, Buckwheat", level: "très élevé" },
  { keyword: "cashew", dbItem: "Nuts, Cashew", level: "très élevé" },
  { keyword: "celery seed", pluralOverride: "celery seeds", dbItem: "Celery Seeds", level: "très élevé" },
  { keyword: "chestnut", dbItem: "Chestnut, roasted", level: "élevé" },
  { keyword: "chili powder", dbItem: "Chili Powder", level: "élevé" },
  { keyword: "cinnamon", dbItem: "Cinnamon, ground", level: "très élevé" },
  { keyword: "clove", pluralOverride: "cloves", dbItem: "Cloves, dried, ground", level: "très élevé" },
  { keyword: "coriander seed", pluralOverride: "coriander seeds", dbItem: "Coriander seed, dried", level: "élevé" },
  { keyword: "cumin", dbItem: "Cumin, ground", level: "élevé" },
  { keyword: "edamame", dbItem: "Legumes, Edamame", level: "élevé" },
  { keyword: "fennel seed", pluralOverride: "fennel seeds", dbItem: "Fennel seed, dried", level: "élevé" },
  { keyword: "ginger", dbItem: "Ginger, Ground", level: "élevé" },
  { keyword: "hazelnut", dbItem: "Hazelnut or filberts, Raw", level: "très élevé" },
  { keyword: "lemon myrtle", dbItem: "Lemon Myrtle, dried, ground", level: "très élevé" },
  { keyword: "lemon peel", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "lemon zest", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "lentil", pluralOverride: "lentils", dbItem: "Legumes, Lentils, variety", level: "élevé" },
  { keyword: "macadamia", dbItem: "Nuts, Macadamia", level: "élevé" },
  { keyword: "millet", dbItem: "Grains, Millet", level: "très élevé" },
  { keyword: "orange peel", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "orange zest", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "peanut butter", dbItem: "Peanut Butter", level: "très élevé" },
  { keyword: "peanut", pluralOverride: "peanuts", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "pecan", pluralOverride: "pecans", dbItem: "Pecans raw or roasted", level: "élevé" },
  { keyword: "pine nut", pluralOverride: "pine nuts", dbItem: "Nuts, Pine, raw or roasted", level: "très élevé" },
  { keyword: "pistachio", dbItem: "Nuts, Pistachio", level: "élevé" },
  { keyword: "refried beans", dbItem: "Legumes, Refried beans", level: "très élevé" },
  { keyword: "savory", dbItem: "Savory, ground", level: "élevé" },
  { keyword: "soynut", pluralOverride: "soynuts", dbItem: "Nuts, Soynuts", level: "élevé" },
  { keyword: "tempeh", dbItem: "Legumes, Tempeh", level: "très élevé" },
  { keyword: "turmeric", dbItem: "Turmeric", level: "très élevé" },
  { keyword: "walnut", pluralOverride: "walnuts", dbItem: "Nuts, Walnuts", level: "élevé" },
  { keyword: "wheat berries", dbItem: "Grains, Wheat berries", level: "élevé" },
  { keyword: "dried algae", dbItem: "Algae, dried", level: "très élevé" },
  { keyword: "artichoke", dbItem: "Artichoke, boiled", level: "élevé" },
  { keyword: "bamboo shoot", pluralOverride: "bamboo shoots", dbItem: "Bamboo shoots", level: "très élevé" },
  { keyword: "bitter gourd", dbItem: "Bitter Gourd, Fresh", level: "très élevé" },
  { keyword: "brussel sprout", pluralOverride: "brussel sprouts", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "brussels sprout", pluralOverride: "brussels sprouts", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "nopal", dbItem: "Cactus, Nopal, Raw", level: "très élevé" },
  { keyword: "carrot", pluralOverride: "carrots", dbItem: "Carrots, raw", level: "très élevé" },
  { keyword: "celery", dbItem: "Celery, raw, stem only, diced", level: "très élevé" },
  { keyword: "dandelion greens", dbItem: "Dandelion greens, red rib, raw or boiled", level: "élevé" },
  { keyword: "eggplant", dbItem: "Eggplant, raw, boiled, baked or roasted", level: "très élevé" },
  { keyword: "fennel", dbItem: "Fennel, boiled", level: "élevé" },
  { keyword: "hearts of palm", dbItem: "Hearts of Palm, whole", level: "très élevé" },
  { keyword: "leek", pluralOverride: "leeks", dbItem: "Leeks, raw", level: "élevé" },
  { keyword: "okra", dbItem: "Okra, Boiled, simmered", level: "très élevé" },
  { keyword: "parsnip", pluralOverride: "parsnips", dbItem: "Parsnips, boiled", level: "élevé" },
  { keyword: "potato", pluralOverride: "potatoes", dbItem: "Potato, White, deep fried", level: "très élevé", excludeFollowedBy: ["starch", "flour", "protein"] },
  { keyword: "purslane", dbItem: "Purslane, leaves", level: "très élevé" },
  { keyword: "sorrel", dbItem: "Sorrel, raw", level: "très élevé" },
  { keyword: "tomato", pluralOverride: "tomatoes", dbItem: "Tomato, Variety, All Colors, Raw", level: "élevé" },
  { keyword: "yam", dbItem: "Yam, flesh only, baked", level: "très élevé" },
  { keyword: "apricot", pluralOverride: "apricots", dbItem: "Apricots, Fresh", level: "élevé" },
  { keyword: "blueberry", pluralOverride: "blueberries", dbItem: "Berries, Blueberries, fresh or frozen", level: "très élevé" },
  { keyword: "cranberry", pluralOverride: "cranberries", dbItem: "Berries, Cranberries", level: "élevé" },
  { keyword: "elderberry", pluralOverride: "elderberries", dbItem: "Berries, Elderberries, raw, black", level: "très élevé" },
  { keyword: "raspberry", pluralOverride: "raspberries", dbItem: "Berries, Raspberries, raw", level: "élevé" },
  { keyword: "strawberry", pluralOverride: "strawberries", dbItem: "Berries, Strawberries, canned", level: "élevé" },
  { keyword: "black currant", pluralOverride: "black currants", dbItem: "Currants, Black, raw", level: "élevé" },
  { keyword: "red currant", pluralOverride: "red currants", dbItem: "Currants, Red, raw", level: "élevé" },
  { keyword: "fig", pluralOverride: "figs", dbItem: "Figs, fresh", level: "élevé" },
  { keyword: "guava", dbItem: "Guava", level: "très élevé" },
  { keyword: "kiwi", dbItem: "Kiwi, fresh, raw", level: "très élevé" },
  { keyword: "pomegranate", dbItem: "Pomegranate, seed and juice sacs", level: "très élevé" },
  { keyword: "prune", pluralOverride: "prunes", dbItem: "Prunes, pitted", level: "très élevé" },
  { keyword: "star fruit", dbItem: "Star Fruit or Carambola, raw", level: "très élevé" },
  { keyword: "carambola", dbItem: "Star Fruit or Carambola, raw", level: "très élevé" },
  { keyword: "oat milk", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "coconut water", dbItem: "Coconut Water", level: "élevé" },
  { keyword: "yerba mate", dbItem: "Tea, Herbal, Mate", level: "élevé" },
];

const LEVEL_RANK: Record<OxalateLevel, number> = {
  "faible": 0,
  "modéré": 1,
  "élevé": 2,
  "très élevé": 3,
};

const LEVELS_BY_RANK: OxalateLevel[] = ["faible", "modéré", "élevé", "très élevé"];

// Proportion-based degradation: an ingredient's raw OHF-derived level
// assumes it's the dominant component. When Open Food Facts tells us the
// ingredient is actually a small fraction of the product, its contribution
// to overall oxalate content is proportionally smaller, so the level is
// stepped down. Thresholds per the plan: >=10% no change, 2-10% one tier
// down, <2% floored straight to "faible" regardless of starting tier (a
// trace-level ingredient's oxalate contribution is negligible no matter
// how concentrated the ingredient itself is).
function degradeByProportion(level: OxalateLevel, percent: number): OxalateLevel {
  if (percent >= 10) return level;
  if (percent < 2) return "faible";
  const currentRank = LEVEL_RANK[level];
  const newRank = Math.max(0, currentRank - 1);
  return LEVELS_BY_RANK[newRank];
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip accents
}

function matchKnownIngredientsInText(normalized: string): MatchedIngredient[] {
  const matched: MatchedIngredient[] = [];

  for (const known of KNOWN_INGREDIENTS) {
    const normalizedKeyword = normalize(known.keyword);
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedKeyword = escapeRegex(normalizedKeyword);
    // Trailing "s?" tolerates simple French/English plurals
    // (amande/amandes, lentille/lentilles) while \b on both ends still
    // blocks the keyword from matching as a mere substring of an
    // unrelated word (anis inside "organismes"). Dutch stem-change
    // plurals (hazelnoot/hazelnoten) don't fit this pattern, hence
    // pluralOverride for an exact alternate form instead.
    const pluralAlternative = known.pluralOverride
      ? `|\\b${escapeRegex(normalize(known.pluralOverride))}\\b`
      : "";
    // Negative lookahead so a keyword doesn't match when immediately
    // followed by a word that changes the ingredient into something OHF
    // rates very differently (e.g. "potato" alone is très élevé, but
    // "potato starch"/"potato flour" are faible).
    const exclusionLookahead = known.excludeFollowedBy?.length
      ? `(?! (?:${known.excludeFollowedBy.map((w) => escapeRegex(normalize(w))).join("|")})\\b)`
      : "";
    const keywordPattern = new RegExp(`\\b${escapedKeyword}${exclusionLookahead}s?\\b${pluralAlternative}`);
    if (keywordPattern.test(normalized)) {
      matched.push({
        ingredientText: known.keyword,
        dbItem: known.dbItem,
        level: known.level,
      });
    }
  }

  return matched;
}

// Drop a match whose keyword is a substring of another match's keyword
// (e.g. "fenouil" inside "graines de fenouil") so a single mention of
// the more specific ingredient doesn't render as two duplicate bullets
// in ResultView for what is really one occurrence in the text.
function dedupeMatches(matched: MatchedIngredient[]): MatchedIngredient[] {
  return matched.filter(
    (m) =>
      !matched.some(
        (other) =>
          other !== m &&
          normalize(other.ingredientText).includes(normalize(m.ingredientText))
      )
  );
}

function aggregateResult(deduped: MatchedIngredient[]): MatchResult {
  if (deduped.length === 0) {
    return { level: "non déterminable", matchedIngredients: [] };
  }

  const highest = deduped.reduce((max, m) =>
    LEVEL_RANK[m.level] > LEVEL_RANK[max.level] ? m : max
  );

  return { level: highest.level, matchedIngredients: deduped };
}

export function matchIngredients(ingredientsText: string): MatchResult {
  const trimmed = ingredientsText.trim();
  if (!trimmed) {
    return { level: "non déterminable", matchedIngredients: [] };
  }

  const normalized = normalize(trimmed);
  const matched = matchKnownIngredientsInText(normalized);
  const deduped = dedupeMatches(matched);

  return aggregateResult(deduped);
}

export function matchStructuredIngredients(
  structuredIngredients: StructuredIngredient[]
): MatchResult {
  const allMatches: MatchedIngredient[] = [];

  for (const ingredient of structuredIngredients) {
    const normalized = normalize(ingredient.text);
    // Dedup within this entry's own matches only (e.g. "fenouil" inside
    // "graines de fenouil" from the same entry's text) BEFORE mixing them
    // into allMatches. Matches from different structured entries must not
    // be deduped against each other: each entry is an independent
    // ingredient-list item, so one entry's keyword being a substring of
    // another entry's text (e.g. "cacao" vs. "beurre de cacao" as two
    // separate OFF ingredients) is coincidental, not a duplicate detection
    // of the same mention.
    const matches = dedupeMatches(matchKnownIngredientsInText(normalized));
    for (const match of matches) {
      if (ingredient.percentEstimate === null) {
        allMatches.push(match);
        continue;
      }
      const adjustedLevel = degradeByProportion(match.level, ingredient.percentEstimate);
      allMatches.push({
        ...match,
        level: adjustedLevel,
        percentEstimate: ingredient.percentEstimate,
        ...(adjustedLevel !== match.level ? { levelBeforeAdjustment: match.level } : {}),
      });
    }
  }

  return aggregateResult(allMatches);
}
