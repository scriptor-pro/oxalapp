// Ingrédients à risque connus : mots-clés et identifiants de la taxonomie
// Open Food Facts. Extrait de src/lib/oxalate-matcher.ts pour que
// scripts/generate-oxalate-tables.ts puisse le lire sans charger
// le matcher (qui importe la table générée). Réexporté par le matcher.

export type OxalateLevel = "faible" | "modéré" | "élevé" | "très élevé";

export interface KnownIngredient {
  keyword: string; // matched as a normalized substring
  // Open Food Facts ingredient taxonomy id (e.g. "en:hazelnut"), matched
  // against the `id` field OFF returns per structured ingredient. Always
  // an "en:"-prefixed canonical id regardless of the product's own
  // language — language-independent, unlike `keyword`. Optional: not
  // every OHF item maps cleanly onto one taxonomy node.
  offId?: string;
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
  { keyword: "cacao", offId: "en:cocoa", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé" },
  { keyword: "cocoa", offId: "en:cocoa", dbItem: "Cocoa or Cacao Powder, Dark Chocolate", level: "très élevé" },
  { keyword: "epinard", offId: "en:spinach", dbItem: "Spinach", level: "très élevé" },
  { keyword: "rhubarbe", offId: "en:rhubarb", dbItem: "Rhubarb, stewed or canned", level: "très élevé" },
  { keyword: "amande", offId: "en:almond", dbItem: "Almonds", level: "très élevé" },
  { keyword: "son de ble", offId: "en:wheat-bran", dbItem: "Wheat Bran", level: "très élevé" },
  { keyword: "betterave", offId: "en:beetroot", dbItem: "Beets, boiled, steamed or pickled", level: "très élevé" },
  { keyword: "patate douce", offId: "en:sweet-potato", dbItem: "Sweet Potato, Orange", level: "très élevé" },
  { keyword: "the noir", offId: "en:black-tea", dbItem: "Tea, Black", level: "très élevé" },
  { keyword: "the vert", offId: "en:green-tea", dbItem: "Tea, Green", level: "élevé" },

  // Élargissement 2026-08-20 : céréales/légumineuses/fruits à coque/épices,
  // filtré sur les entrées élevé/très élevé de oxalate-database.json
  // (lui-même dérivé du PDF OHF), en excluant les marques US non
  // pertinentes pour le marché belge/français et les mots-clés jugés trop
  // génériques pour éviter les faux positifs (ex: "blé", "noix" seuls).
  { keyword: "piment de la jamaique", offId: "en:allspice", dbItem: "Allspice", level: "élevé" },
  { keyword: "anis", offId: "en:aniseed", dbItem: "Anise", level: "élevé" },
  { keyword: "basilic", offId: "en:basil", dbItem: "Basil, Sweet, Fresh", level: "élevé" },
  { keyword: "noix du bresil", offId: "en:brazil-nut", dbItem: "Brazil Nuts", level: "très élevé" },
  { keyword: "sarrasin", offId: "en:buckwheat", dbItem: "Cereals, Buckwheat", level: "très élevé" },
  { keyword: "noix de cajou", offId: "en:cashew-nuts", dbItem: "Nuts, Cashew", level: "très élevé" },
  { keyword: "graines de celeri", offId: "en:celery-seed", dbItem: "Celery Seeds", level: "très élevé" },
  { keyword: "chataigne", offId: "en:chestnut", dbItem: "Chestnut, roasted", level: "élevé" },
  { keyword: "piment en poudre", offId: "en:chili-powder", dbItem: "Chili Powder", level: "élevé" },
  { keyword: "cannelle", offId: "en:cinnamon", dbItem: "Cinnamon, ground", level: "très élevé" },
  { keyword: "clou de girofle", offId: "en:clove", dbItem: "Cloves, dried, ground", level: "très élevé" },
  { keyword: "graines de coriandre", offId: "en:coriander-seed", dbItem: "Coriander seed, dried", level: "élevé" },
  { keyword: "cumin", offId: "en:cumin", dbItem: "Cumin, ground", level: "élevé" },
  { keyword: "curry", offId: "en:curry", dbItem: "Curry Powder", level: "élevé" },
  { keyword: "edamame", offId: "en:edamame", dbItem: "Legumes, Edamame", level: "élevé" },
  { keyword: "graines de fenouil", offId: "en:fennel-seed", dbItem: "Fennel seed, dried", level: "élevé" },
  { keyword: "gingembre", offId: "en:ginger", dbItem: "Ginger, Ground", level: "élevé" },
  { keyword: "noisette", offId: "en:hazelnut", dbItem: "Hazelnut or filberts, Raw", level: "très élevé" },
  { keyword: "myrte citronne", dbItem: "Lemon Myrtle, dried, ground", level: "très élevé" },
  { keyword: "zeste de citron", offId: "en:lemon-peel", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "lentille", offId: "en:lentils", dbItem: "Legumes, Lentils, variety", level: "élevé" },
  { keyword: "macadamia", offId: "en:macadamia-nut", dbItem: "Nuts, Macadamia", level: "élevé" },
  { keyword: "millet", offId: "en:millet", dbItem: "Grains, Millet", level: "très élevé" },
  { keyword: "zeste d'orange", offId: "en:orange-zest", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "zeste d orange", offId: "en:orange-zest", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "origan", offId: "en:oregano", dbItem: "Oregano, ground", level: "élevé" },
  { keyword: "beurre de cacahuete", offId: "en:peanut-butter", dbItem: "Peanut Butter", level: "très élevé" },
  { keyword: "cacahuete", offId: "en:peanut", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "arachide", offId: "en:peanut", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "noix de pecan", offId: "en:pecan-nut", dbItem: "Pecans raw or roasted", level: "élevé" },
  { keyword: "pignon de pin", offId: "en:pine-nuts", dbItem: "Nuts, Pine, raw or roasted", level: "très élevé" },
  { keyword: "pistache", offId: "en:pistachio-nuts", dbItem: "Nuts, Pistachio", level: "élevé" },
  { keyword: "haricots frits", dbItem: "Legumes, Refried beans", level: "très élevé" },
  { keyword: "sarriette", offId: "en:summer-savory", dbItem: "Savory, ground", level: "élevé" },
  { keyword: "noix de soja", dbItem: "Nuts, Soynuts", level: "élevé" },
  { keyword: "tempeh", offId: "en:tempeh", dbItem: "Legumes, Tempeh", level: "très élevé" },
  { keyword: "curcuma", offId: "en:turmeric", dbItem: "Turmeric", level: "très élevé" },
  { keyword: "noix de grenoble", offId: "en:walnut", dbItem: "Nuts, Walnuts", level: "élevé" },
  { keyword: "ble en grains", offId: "en:wheat", dbItem: "Grains, Wheat berries", level: "élevé" },
  { keyword: "ble concasse", offId: "en:wheat", dbItem: "Grains, Wheat berries", level: "élevé" },

  // Élargissement légumes 2026-08-20, même méthode et même source
  // (oxalate-database.json, niveaux élevé/très élevé) que l'élargissement
  // céréales/légumineuses/fruits à coque/épices ci-dessus. "tomate" et
  // "pomme de terre" sont volontairement gardés malgré leur fréquence
  // très élevée dans les produits transformés (choix explicite de
  // l'utilisateur — préférer alerter souvent plutôt que jamais, à la
  // différence de "blé"/"riz" exclus plus haut pour la raison inverse).
  { keyword: "algue seche", offId: "en:algae", dbItem: "Algae, dried", level: "très élevé" },
  { keyword: "artichaut", offId: "en:artichoke", dbItem: "Artichoke, boiled", level: "élevé" },
  { keyword: "pousse de bambou", offId: "en:bamboo-shoot", dbItem: "Bamboo shoots", level: "très élevé" },
  { keyword: "margose", dbItem: "Bitter Gourd, Fresh", level: "très élevé" },
  { keyword: "chou de bruxelles", offId: "en:brussels-sprouts", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "nopal", offId: "en:nopales", dbItem: "Cactus, Nopal, Raw", level: "très élevé" },
  { keyword: "carotte", offId: "en:carrot", dbItem: "Carrots, raw", level: "très élevé" },
  { keyword: "celeri", offId: "en:celery", dbItem: "Celery, raw, stem only, diced", level: "très élevé" },
  { keyword: "pissenlit", offId: "en:dandelion", dbItem: "Dandelion greens, red rib, raw or boiled", level: "élevé" },
  { keyword: "aubergine", offId: "en:aubergine", dbItem: "Eggplant, raw, boiled, baked or roasted", level: "très élevé" },
  { keyword: "fenouil", offId: "en:fennel", dbItem: "Fennel, boiled", level: "élevé" },
  { keyword: "coeur de palmier", offId: "en:heart-of-palm", dbItem: "Hearts of Palm, whole", level: "très élevé" },
  { keyword: "poireau", offId: "en:leek", dbItem: "Leeks, raw", level: "élevé" },
  { keyword: "blette", offId: "en:chard", dbItem: "Mangold or Spinach beet", level: "très élevé" },
  { keyword: "gombo", offId: "en:okra", dbItem: "Okra, Boiled, simmered", level: "très élevé" },
  { keyword: "panais", offId: "en:parsnip", dbItem: "Parsnips, boiled", level: "élevé" },
  { keyword: "pomme de terre", offId: "en:potato", pluralOverride: "pommes de terre", dbItem: "Potato, White, deep fried", level: "très élevé" },
  { keyword: "pourpier", offId: "en:purslane", dbItem: "Purslane, leaves", level: "très élevé" },
  { keyword: "oseille", offId: "en:sorrel", dbItem: "Sorrel, raw", level: "très élevé" },
  { keyword: "tomate", offId: "en:tomato", dbItem: "Tomato, Variety, All Colors, Raw", level: "élevé" },
  { keyword: "igname", offId: "en:yam", dbItem: "Yam, flesh only, baked", level: "très élevé" },

  // Élargissement fruits 2026-08-20, même méthode/source que les passes
  // précédentes. Le sureau, le cassis et la groseille (baies) n'ont pas
  // de synonyme NL ici — traduction NL trop ambiguë/composée pour être
  // sûre sans revue native (voir principe déjà appliqué : mieux vaut
  // omettre qu'un mot-clé faux). "mure" et "orange" ont été retirés après
  // revue de code : "mure" collide (une fois désaccentué) avec l'adjectif
  // très courant "mûr/mûre" ("banane mûre"), et "orange" est un mot
  // générique de couleur/arôme fréquent hors contexte du fruit
  // ("colorant orange") — même risque que "blé"/"noix" déjà exclus.
  { keyword: "abricot", offId: "en:apricot", dbItem: "Apricots, Fresh", level: "élevé" },
  { keyword: "myrtille", offId: "en:blueberry", dbItem: "Berries, Blueberries, fresh or frozen", level: "très élevé" },
  { keyword: "canneberge", offId: "en:cranberry", dbItem: "Berries, Cranberries", level: "élevé" },
  { keyword: "sureau", offId: "en:elderberry", dbItem: "Berries, Elderberries, raw, black", level: "très élevé" },
  { keyword: "framboise", offId: "en:raspberry", dbItem: "Berries, Raspberries, raw", level: "élevé" },
  { keyword: "fraise", offId: "en:strawberry", dbItem: "Berries, Strawberries, canned", level: "élevé" },
  { keyword: "cassis", offId: "en:blackcurrant", dbItem: "Currants, Black, raw", level: "élevé" },
  { keyword: "groseille", offId: "en:redcurrant", dbItem: "Currants, Red, raw", level: "élevé" },
  { keyword: "figue", offId: "en:fig", dbItem: "Figs, fresh", level: "élevé" },
  { keyword: "goyave", offId: "en:guava", dbItem: "Guava", level: "très élevé" },
  { keyword: "kiwi", offId: "en:kiwifruit", dbItem: "Kiwi, fresh, raw", level: "très élevé" },
  { keyword: "grenade", offId: "en:pomegranate", dbItem: "Pomegranate, seed and juice sacs", level: "très élevé" },
  { keyword: "pruneau", offId: "en:prune", dbItem: "Prunes, pitted", level: "très élevé" },
  { keyword: "carambole", offId: "en:carambola", dbItem: "Star Fruit or Carambola, raw", level: "très élevé" },

  // Élargissement laitiers/boissons 2026-08-20. La plupart des entrées
  // OHF de ces catégories (laits/yaourts végétaux à base d'amande,
  // cajou, noisette, soja) sont déjà couvertes par les mots-clés de
  // fruits à coque ci-dessus — seuls les 3 ingrédients ci-dessous
  // n'avaient pas d'équivalent déjà présent.
  { keyword: "lait d'avoine", offId: "en:oat-milk", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "lait d avoine", offId: "en:oat-milk", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "eau de coco", offId: "en:coconut-water", dbItem: "Coconut Water", level: "élevé" },
  { keyword: "the mate", offId: "en:mate", dbItem: "Tea, Herbal, Mate", level: "élevé" },

  // Synonymes néerlandais 2026-08-20 : de nombreux produits sur Open Food
  // Facts pour le marché belge sont étiquetés uniquement en néerlandais
  // (ex: "Kurkuma" plutôt que "curcuma"). Traductions non revues par un
  // locuteur natif — entrées omises quand le traducteur n'était pas
  // confiant plutôt que de risquer une correspondance fausse (voir
  // discussion en session : piment de la Jamaïque, myrte citronné,
  // haricots frits, noix de soja et blé concassé n'ont pas de synonyme NL
  // ici pour cette raison).
  { keyword: "spinazie", offId: "en:spinach", dbItem: "Spinach", level: "très élevé" },
  { keyword: "rabarber", offId: "en:rhubarb", dbItem: "Rhubarb, stewed or canned", level: "très élevé" },
  { keyword: "amandel", offId: "en:almond", dbItem: "Almonds", level: "très élevé" },
  { keyword: "tarwezemelen", offId: "en:wheat-bran", dbItem: "Wheat Bran", level: "très élevé" },
  { keyword: "biet", offId: "en:beetroot", dbItem: "Beets, boiled, steamed or pickled", level: "très élevé" },
  { keyword: "zoete aardappel", offId: "en:sweet-potato", dbItem: "Sweet Potato, Orange", level: "très élevé" },
  { keyword: "zwarte thee", offId: "en:black-tea", dbItem: "Tea, Black", level: "très élevé" },
  { keyword: "groene thee", offId: "en:green-tea", dbItem: "Tea, Green", level: "élevé" },
  { keyword: "anijs", offId: "en:aniseed", dbItem: "Anise", level: "élevé" },
  { keyword: "basilicum", offId: "en:basil", dbItem: "Basil, Sweet, Fresh", level: "élevé" },
  { keyword: "paranoot", offId: "en:brazil-nut", pluralOverride: "paranoten", dbItem: "Brazil Nuts", level: "très élevé" },
  { keyword: "boekweit", offId: "en:buckwheat", dbItem: "Cereals, Buckwheat", level: "très élevé" },
  { keyword: "cashewnoot", offId: "en:cashew-nuts", pluralOverride: "cashewnoten", dbItem: "Nuts, Cashew", level: "très élevé" },
  { keyword: "selderijzaad", offId: "en:celery-seed", dbItem: "Celery Seeds", level: "très élevé" },
  { keyword: "kastanje", offId: "en:chestnut", dbItem: "Chestnut, roasted", level: "élevé" },
  { keyword: "chilipoeder", offId: "en:chili-powder", dbItem: "Chili Powder", level: "élevé" },
  { keyword: "kaneel", offId: "en:cinnamon", dbItem: "Cinnamon, ground", level: "très élevé" },
  { keyword: "kruidnagel", offId: "en:clove", dbItem: "Cloves, dried, ground", level: "très élevé" },
  { keyword: "korianderzaad", offId: "en:coriander-seed", dbItem: "Coriander seed, dried", level: "élevé" },
  { keyword: "komijn", offId: "en:cumin", dbItem: "Cumin, ground", level: "élevé" },
  { keyword: "kerrie", offId: "en:curry", dbItem: "Curry Powder", level: "élevé" },
  { keyword: "venkelzaad", offId: "en:fennel-seed", dbItem: "Fennel seed, dried", level: "élevé" },
  { keyword: "gember", offId: "en:ginger", dbItem: "Ginger, Ground", level: "élevé" },
  { keyword: "hazelnoot", offId: "en:hazelnut", pluralOverride: "hazelnoten", dbItem: "Hazelnut or filberts, Raw", level: "très élevé" },
  { keyword: "citroenschil", offId: "en:lemon-peel", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "linze", offId: "en:lentils", pluralOverride: "linzen", dbItem: "Legumes, Lentils, variety", level: "élevé" },
  { keyword: "macadamianoot", offId: "en:macadamia-nut", pluralOverride: "macadamianoten", dbItem: "Nuts, Macadamia", level: "élevé" },
  { keyword: "gierst", offId: "en:millet", dbItem: "Grains, Millet", level: "très élevé" },
  { keyword: "sinaasappelschil", offId: "en:orange-zest", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "oregano", offId: "en:oregano", dbItem: "Oregano, ground", level: "élevé" },
  { keyword: "pindakaas", offId: "en:peanut-butter", dbItem: "Peanut Butter", level: "très élevé" },
  { keyword: "pinda", offId: "en:peanut", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "pecannoot", offId: "en:pecan-nut", pluralOverride: "pecannoten", dbItem: "Pecans raw or roasted", level: "élevé" },
  { keyword: "pijnboompit", offId: "en:pine-nuts", dbItem: "Nuts, Pine, raw or roasted", level: "très élevé" },
  { keyword: "pistachenoot", offId: "en:pistachio-nuts", pluralOverride: "pistachenoten", dbItem: "Nuts, Pistachio", level: "élevé" },
  { keyword: "bonenkruid", offId: "en:summer-savory", dbItem: "Savory, ground", level: "élevé" },
  { keyword: "tempeh", offId: "en:tempeh", dbItem: "Legumes, Tempeh", level: "très élevé" },
  { keyword: "kurkuma", offId: "en:turmeric", dbItem: "Turmeric", level: "très élevé" },
  { keyword: "walnoot", offId: "en:walnut", pluralOverride: "walnoten", dbItem: "Nuts, Walnuts", level: "élevé" },
  { keyword: "tarwekorrels", offId: "en:wheat", dbItem: "Grains, Wheat berries", level: "élevé" },

  // Synonymes néerlandais pour l'élargissement légumes ci-dessus (même
  // 2026-08-20). "nopal" et "coeur de palmier" n'ont pas de synonyme NL
  // ici faute de confiance suffisante dans la traduction (mêmes critères
  // que les 5 entrées omises plus haut).
  { keyword: "artisjok", offId: "en:artichoke", pluralOverride: "artisjokken", dbItem: "Artichoke, boiled", level: "élevé" },
  { keyword: "bamboescheut", offId: "en:bamboo-shoot", pluralOverride: "bamboescheuten", dbItem: "Bamboo shoots", level: "très élevé" },
  { keyword: "bittere meloen", dbItem: "Bitter Gourd, Fresh", level: "très élevé" },
  { keyword: "spruitje", offId: "en:brussels-sprouts", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "wortel", offId: "en:carrot", pluralOverride: "wortelen", dbItem: "Carrots, raw", level: "très élevé" },
  { keyword: "selderij", offId: "en:celery", dbItem: "Celery, raw, stem only, diced", level: "très élevé" },
  { keyword: "paardenbloem", offId: "en:dandelion", dbItem: "Dandelion greens, red rib, raw or boiled", level: "élevé" },
  // "aubergine" is spelled identically in Dutch, so no separate entry is
  // needed — the French keyword above (line 106) already matches it.
  { keyword: "venkel", offId: "en:fennel", dbItem: "Fennel, boiled", level: "élevé" },
  { keyword: "prei", offId: "en:leek", dbItem: "Leeks, raw", level: "élevé" },
  { keyword: "snijbiet", offId: "en:chard", dbItem: "Mangold or Spinach beet", level: "très élevé" },
  { keyword: "okra", offId: "en:okra", dbItem: "Okra, Boiled, simmered", level: "très élevé" },
  { keyword: "pastinaak", offId: "en:parsnip", dbItem: "Parsnips, boiled", level: "élevé" },
  { keyword: "aardappel", offId: "en:potato", pluralOverride: "aardappelen", dbItem: "Potato, White, deep fried", level: "très élevé" },
  { keyword: "postelein", offId: "en:purslane", dbItem: "Purslane, leaves", level: "très élevé" },
  { keyword: "zuring", offId: "en:sorrel", dbItem: "Sorrel, raw", level: "très élevé" },
  { keyword: "tomaat", offId: "en:tomato", pluralOverride: "tomaten", dbItem: "Tomato, Variety, All Colors, Raw", level: "élevé" },
  { keyword: "yam", offId: "en:yam", dbItem: "Yam, flesh only, baked", level: "très élevé" },

  // Synonymes néerlandais pour l'élargissement fruits ci-dessus (même
  // 2026-08-20). Canneberge, cassis, groseille, pruneau et carambole
  // n'ont pas de synonyme NL ici faute de confiance suffisante.
  { keyword: "abrikoos", offId: "en:apricot", pluralOverride: "abrikozen", dbItem: "Apricots, Fresh", level: "élevé" },
  { keyword: "braam", offId: "en:blackberry", pluralOverride: "bramen", dbItem: "Berries, Blackberries, fresh", level: "très élevé" },
  { keyword: "bosbes", offId: "en:blueberry", pluralOverride: "bosbessen", dbItem: "Berries, Blueberries, fresh or frozen", level: "très élevé" },
  { keyword: "framboos", offId: "en:raspberry", pluralOverride: "frambozen", dbItem: "Berries, Raspberries, raw", level: "élevé" },
  { keyword: "aardbei", offId: "en:strawberry", pluralOverride: "aardbeien", dbItem: "Berries, Strawberries, canned", level: "élevé" },
  { keyword: "vijg", offId: "en:fig", pluralOverride: "vijgen", dbItem: "Figs, fresh", level: "élevé" },
  { keyword: "guave", offId: "en:guava", dbItem: "Guava", level: "très élevé" },
  { keyword: "sinaasappel", offId: "en:orange", pluralOverride: "sinaasappelen", dbItem: "Oranges, fresh, variety", level: "élevé" },
  { keyword: "granaatappel", offId: "en:pomegranate", pluralOverride: "granaatappels", dbItem: "Pomegranate, seed and juice sacs", level: "très élevé" },

  // Synonymes néerlandais pour l'élargissement laitiers/boissons ci-dessus.
  { keyword: "havermelk", offId: "en:oat-milk", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "kokoswater", offId: "en:coconut-water", dbItem: "Coconut Water", level: "élevé" },

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
  { keyword: "spinach", offId: "en:spinach", dbItem: "Spinach", level: "très élevé" },
  { keyword: "rhubarb", offId: "en:rhubarb", dbItem: "Rhubarb, stewed or canned", level: "très élevé" },
  { keyword: "almond", offId: "en:almond", dbItem: "Almonds", level: "très élevé" },
  { keyword: "wheat bran", offId: "en:wheat-bran", dbItem: "Wheat Bran", level: "très élevé" },
  { keyword: "beet", offId: "en:beetroot", pluralOverride: "beets", dbItem: "Beets, boiled, steamed or pickled", level: "très élevé" },
  { keyword: "sweet potato", offId: "en:sweet-potato", dbItem: "Sweet Potato, Orange", level: "très élevé" },
  { keyword: "black tea", offId: "en:black-tea", dbItem: "Tea, Black", level: "très élevé" },
  { keyword: "green tea", offId: "en:green-tea", dbItem: "Tea, Green", level: "élevé" },
  { keyword: "allspice", offId: "en:allspice", dbItem: "Allspice", level: "élevé" },
  { keyword: "anise", offId: "en:aniseed", dbItem: "Anise", level: "élevé" },
  { keyword: "basil", offId: "en:basil", dbItem: "Basil, Sweet, Fresh", level: "élevé" },
  { keyword: "brazil nut", offId: "en:brazil-nut", pluralOverride: "brazil nuts", dbItem: "Brazil Nuts", level: "très élevé" },
  { keyword: "buckwheat", offId: "en:buckwheat", dbItem: "Cereals, Buckwheat", level: "très élevé" },
  { keyword: "cashew", offId: "en:cashew-nuts", dbItem: "Nuts, Cashew", level: "très élevé" },
  { keyword: "celery seed", offId: "en:celery-seed", pluralOverride: "celery seeds", dbItem: "Celery Seeds", level: "très élevé" },
  { keyword: "chestnut", offId: "en:chestnut", dbItem: "Chestnut, roasted", level: "élevé" },
  { keyword: "chili powder", offId: "en:chili-powder", dbItem: "Chili Powder", level: "élevé" },
  { keyword: "cinnamon", offId: "en:cinnamon", dbItem: "Cinnamon, ground", level: "très élevé" },
  { keyword: "clove", offId: "en:clove", pluralOverride: "cloves", dbItem: "Cloves, dried, ground", level: "très élevé" },
  { keyword: "coriander seed", offId: "en:coriander-seed", pluralOverride: "coriander seeds", dbItem: "Coriander seed, dried", level: "élevé" },
  { keyword: "cumin", offId: "en:cumin", dbItem: "Cumin, ground", level: "élevé" },
  { keyword: "edamame", offId: "en:edamame", dbItem: "Legumes, Edamame", level: "élevé" },
  { keyword: "fennel seed", offId: "en:fennel-seed", pluralOverride: "fennel seeds", dbItem: "Fennel seed, dried", level: "élevé" },
  { keyword: "ginger", offId: "en:ginger", dbItem: "Ginger, Ground", level: "élevé" },
  { keyword: "hazelnut", offId: "en:hazelnut", dbItem: "Hazelnut or filberts, Raw", level: "très élevé" },
  { keyword: "lemon myrtle", dbItem: "Lemon Myrtle, dried, ground", level: "très élevé" },
  { keyword: "lemon peel", offId: "en:lemon-peel", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "lemon zest", offId: "en:lemon-zest", dbItem: "Lemon Peel", level: "élevé" },
  { keyword: "lentil", offId: "en:lentils", pluralOverride: "lentils", dbItem: "Legumes, Lentils, variety", level: "élevé" },
  { keyword: "macadamia", offId: "en:macadamia-nut", dbItem: "Nuts, Macadamia", level: "élevé" },
  { keyword: "millet", offId: "en:millet", dbItem: "Grains, Millet", level: "très élevé" },
  { keyword: "orange peel", offId: "en:orange-zest", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "orange zest", offId: "en:orange-zest", dbItem: "Orange Peel", level: "élevé" },
  { keyword: "peanut butter", offId: "en:peanut-butter", dbItem: "Peanut Butter", level: "très élevé" },
  { keyword: "peanut", offId: "en:peanut", pluralOverride: "peanuts", dbItem: "Peanuts, roasted", level: "très élevé" },
  { keyword: "pecan", offId: "en:pecan-nut", pluralOverride: "pecans", dbItem: "Pecans raw or roasted", level: "élevé" },
  { keyword: "pine nut", offId: "en:pine-nuts", pluralOverride: "pine nuts", dbItem: "Nuts, Pine, raw or roasted", level: "très élevé" },
  { keyword: "pistachio", offId: "en:pistachio-nuts", dbItem: "Nuts, Pistachio", level: "élevé" },
  { keyword: "refried beans", dbItem: "Legumes, Refried beans", level: "très élevé" },
  { keyword: "savory", offId: "en:summer-savory", dbItem: "Savory, ground", level: "élevé" },
  { keyword: "soynut", pluralOverride: "soynuts", dbItem: "Nuts, Soynuts", level: "élevé" },
  { keyword: "tempeh", offId: "en:tempeh", dbItem: "Legumes, Tempeh", level: "très élevé" },
  { keyword: "turmeric", offId: "en:turmeric", dbItem: "Turmeric", level: "très élevé" },
  { keyword: "walnut", offId: "en:walnut", pluralOverride: "walnuts", dbItem: "Nuts, Walnuts", level: "élevé" },
  { keyword: "wheat berries", offId: "en:wheat", dbItem: "Grains, Wheat berries", level: "élevé" },
  { keyword: "dried algae", offId: "en:algae", dbItem: "Algae, dried", level: "très élevé" },
  { keyword: "artichoke", offId: "en:artichoke", dbItem: "Artichoke, boiled", level: "élevé" },
  { keyword: "bamboo shoot", offId: "en:bamboo-shoot", pluralOverride: "bamboo shoots", dbItem: "Bamboo shoots", level: "très élevé" },
  { keyword: "bitter gourd", dbItem: "Bitter Gourd, Fresh", level: "très élevé" },
  { keyword: "brussel sprout", offId: "en:brussels-sprouts", pluralOverride: "brussel sprouts", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "brussels sprout", offId: "en:brussels-sprouts", pluralOverride: "brussels sprouts", dbItem: "Brussel Sprouts, raw", level: "élevé" },
  { keyword: "nopal", offId: "en:nopales", dbItem: "Cactus, Nopal, Raw", level: "très élevé" },
  { keyword: "carrot", offId: "en:carrot", pluralOverride: "carrots", dbItem: "Carrots, raw", level: "très élevé" },
  { keyword: "celery", offId: "en:celery", dbItem: "Celery, raw, stem only, diced", level: "très élevé" },
  { keyword: "dandelion greens", offId: "en:dandelion", dbItem: "Dandelion greens, red rib, raw or boiled", level: "élevé" },
  { keyword: "eggplant", offId: "en:aubergine", dbItem: "Eggplant, raw, boiled, baked or roasted", level: "très élevé" },
  { keyword: "fennel", offId: "en:fennel", dbItem: "Fennel, boiled", level: "élevé" },
  { keyword: "hearts of palm", offId: "en:heart-of-palm", dbItem: "Hearts of Palm, whole", level: "très élevé" },
  { keyword: "leek", offId: "en:leek", pluralOverride: "leeks", dbItem: "Leeks, raw", level: "élevé" },
  { keyword: "okra", offId: "en:okra", dbItem: "Okra, Boiled, simmered", level: "très élevé" },
  { keyword: "parsnip", offId: "en:parsnip", pluralOverride: "parsnips", dbItem: "Parsnips, boiled", level: "élevé" },
  { keyword: "potato", offId: "en:potato", pluralOverride: "potatoes", dbItem: "Potato, White, deep fried", level: "très élevé", excludeFollowedBy: ["starch", "flour", "protein"] },
  { keyword: "purslane", offId: "en:purslane", dbItem: "Purslane, leaves", level: "très élevé" },
  { keyword: "sorrel", offId: "en:sorrel", dbItem: "Sorrel, raw", level: "très élevé" },
  { keyword: "tomato", offId: "en:tomato", pluralOverride: "tomatoes", dbItem: "Tomato, Variety, All Colors, Raw", level: "élevé" },
  { keyword: "yam", offId: "en:yam", dbItem: "Yam, flesh only, baked", level: "très élevé" },
  { keyword: "apricot", offId: "en:apricot", pluralOverride: "apricots", dbItem: "Apricots, Fresh", level: "élevé" },
  { keyword: "blueberry", offId: "en:blueberry", pluralOverride: "blueberries", dbItem: "Berries, Blueberries, fresh or frozen", level: "très élevé" },
  { keyword: "cranberry", offId: "en:cranberry", pluralOverride: "cranberries", dbItem: "Berries, Cranberries", level: "élevé" },
  { keyword: "elderberry", offId: "en:elderberry", pluralOverride: "elderberries", dbItem: "Berries, Elderberries, raw, black", level: "très élevé" },
  { keyword: "raspberry", offId: "en:raspberry", pluralOverride: "raspberries", dbItem: "Berries, Raspberries, raw", level: "élevé" },
  { keyword: "strawberry", offId: "en:strawberry", pluralOverride: "strawberries", dbItem: "Berries, Strawberries, canned", level: "élevé" },
  { keyword: "black currant", offId: "en:blackcurrant", pluralOverride: "black currants", dbItem: "Currants, Black, raw", level: "élevé" },
  { keyword: "red currant", offId: "en:redcurrant", pluralOverride: "red currants", dbItem: "Currants, Red, raw", level: "élevé" },
  { keyword: "fig", offId: "en:fig", pluralOverride: "figs", dbItem: "Figs, fresh", level: "élevé" },
  { keyword: "guava", offId: "en:guava", dbItem: "Guava", level: "très élevé" },
  { keyword: "kiwi", offId: "en:kiwifruit", dbItem: "Kiwi, fresh, raw", level: "très élevé" },
  { keyword: "pomegranate", offId: "en:pomegranate", dbItem: "Pomegranate, seed and juice sacs", level: "très élevé" },
  { keyword: "prune", offId: "en:prune", pluralOverride: "prunes", dbItem: "Prunes, pitted", level: "très élevé" },
  { keyword: "star fruit", offId: "en:carambola", dbItem: "Star Fruit or Carambola, raw", level: "très élevé" },
  { keyword: "carambola", offId: "en:carambola", dbItem: "Star Fruit or Carambola, raw", level: "très élevé" },
  { keyword: "oat milk", offId: "en:oat-milk", dbItem: "Milk, plant-based, Oat milk", level: "élevé" },
  { keyword: "coconut water", offId: "en:coconut-water", dbItem: "Coconut Water", level: "élevé" },
  { keyword: "yerba mate", offId: "en:mate", dbItem: "Tea, Herbal, Mate", level: "élevé" },

  // Élargissement 2026-09-29 : ingrédients génériques fréquents dans les
  // produits transformés (céréales/graines de petit-déjeuner, compléments,
  // pains spéciaux) repérés dans oxalate-database.json mais absents des
  // mots-clés jusqu'ici. Marques et plats préparés (ex: "McCormick",
  // "Wendy's Chili") volontairement exclus, cohérent avec la méthode déjà
  // suivie ci-dessus. Sésame classé "modéré" (pas "très élevé") car
  // l'immense majorité du sésame utilisé en agroalimentaire transformé est
  // décortiqué ("faible", 146 mg/100g) plutôt qu'entier ("très élevé", 3800
  // mg/100g) — voir docs/recherche/2026-09-13-synthese-recommandations.md
  // §2.2 ; "modéré" reste une estimation prudente entre les deux extrêmes
  // plutôt qu'un pari sur l'un ou l'autre.
  { keyword: "sesame", offId: "en:sesame-seeds", dbItem: "Seeds, Sesame, toasted", level: "modéré" },
  { keyword: "quinoa", offId: "en:quinoa", dbItem: "Grain, Quinoa, cooked", level: "très élevé" },
  // Pas de noeud générique "amaranth seed/grain" dans la taxonomie OFF
  // (seulement des variétés de feuilles/farine) — mot-clé texte seul.
  { keyword: "amarante", dbItem: "Grain, Amaranth, uncooked", level: "très élevé" },
  { keyword: "amaranth", dbItem: "Grain, Amaranth, uncooked", level: "très élevé" },
  { keyword: "teff", offId: "en:teff", dbItem: "Flour, Teff, Brown", level: "très élevé" },
  { keyword: "graines de pavot", offId: "en:poppyseed", dbItem: "Seeds, Poppy", level: "très élevé" },
  { keyword: "poppy seed", offId: "en:poppyseed", pluralOverride: "poppy seeds", dbItem: "Seeds, Poppy", level: "très élevé" },
  { keyword: "chardon marie", dbItem: "Milk Thistle, Seed", level: "très élevé" },
  { keyword: "milk thistle", dbItem: "Milk Thistle, Seed", level: "très élevé" },
  // Pas de noeud "moringa" (feuille/plante) dans la taxonomie OFF — mot-clé
  // texte seul.
  { keyword: "moringa", dbItem: "Moringa, Leaf Powder", level: "élevé" },
  { keyword: "dulse", dbItem: "Seaweed, Dulse flakes", level: "élevé" },
  { keyword: "nori", offId: "en:nori", dbItem: "Seaweed, Nori, dry roasted", level: "élevé" },
  { keyword: "graines de tournesol", offId: "en:sunflower-seed", dbItem: "Seeds, Sunflower, raw or roasted", level: "élevé" },
  { keyword: "sunflower seed", offId: "en:sunflower-seed", pluralOverride: "sunflower seeds", dbItem: "Seeds, Sunflower, raw or roasted", level: "élevé" },
  { keyword: "zonnebloempit", offId: "en:sunflower-seed", pluralOverride: "zonnebloempitten", dbItem: "Seeds, Sunflower, raw or roasted", level: "élevé" },
  { keyword: "sesamzaad", offId: "en:sesame-seeds", dbItem: "Seeds, Sesame, toasted", level: "modéré" },
  { keyword: "papaverzaad", offId: "en:poppyseed", dbItem: "Seeds, Poppy", level: "très élevé" },
  { keyword: "melkdistel", dbItem: "Milk Thistle, Seed", level: "très élevé" },
];
