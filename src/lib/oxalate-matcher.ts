export type OxalateLevel = "faible" | "modéré" | "élevé" | "très élevé";
export type MatchLevel = OxalateLevel | "non déterminable";

export interface MatchedIngredient {
  ingredientText: string;
  dbItem: string;
  level: OxalateLevel;
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
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip accents
}

export function matchIngredients(ingredientsText: string): MatchResult {
  const trimmed = ingredientsText.trim();
  if (!trimmed) {
    return { level: "non déterminable", matchedIngredients: [] };
  }

  const normalized = normalize(trimmed);
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
    const keywordPattern = new RegExp(`\\b${escapedKeyword}s?\\b${pluralAlternative}`);
    if (keywordPattern.test(normalized)) {
      matched.push({
        ingredientText: known.keyword,
        dbItem: known.dbItem,
        level: known.level,
      });
    }
  }

  // Drop a match whose keyword is a substring of another match's keyword
  // (e.g. "fenouil" inside "graines de fenouil") so a single mention of
  // the more specific ingredient doesn't render as two duplicate bullets
  // in ResultView for what is really one occurrence in the text.
  const deduped = matched.filter(
    (m) =>
      !matched.some(
        (other) =>
          other !== m &&
          normalize(other.ingredientText).includes(normalize(m.ingredientText))
      )
  );

  if (deduped.length === 0) {
    return { level: "non déterminable", matchedIngredients: [] };
  }

  const levelRank: Record<OxalateLevel, number> = {
    "faible": 0,
    "modéré": 1,
    "élevé": 2,
    "très élevé": 3,
  };

  const highest = deduped.reduce((max, m) =>
    levelRank[m.level] > levelRank[max.level] ? m : max
  );

  return { level: highest.level, matchedIngredients: deduped };
}
