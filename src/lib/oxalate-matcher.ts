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

interface KnownIngredient {
  keyword: string; // matched as a normalized substring
  dbItem: string;
  level: OxalateLevel;
}

// Curated high-signal keywords. Sourced from CLAUDE.md's list of known
// risk ingredients, reclassified per the Mayo Clinic Oxalate Diet
// Handbook thresholds (faible<5/modéré5-8/élevé8-25/très élevé>25
// mg/portion — see docs/superpowers/specs/2026-07-30-oxalate-scoring-recalibration-design.md).
// Deliberately excludes short/generic PDF item names (e.g. "Salt") that
// would false-positive against unrelated ingredient text.
const KNOWN_INGREDIENTS: KnownIngredient[] = [
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
];

function normalize(text: string): string {
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
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Trailing "s?" tolerates simple French plurals (amande/amandes,
    // lentille/lentilles) while \b on both ends still blocks the keyword
    // from matching as a mere substring of an unrelated word (anis inside
    // "organismes").
    const keywordPattern = new RegExp(`\\b${escapedKeyword}s?\\b`);
    if (keywordPattern.test(normalized)) {
      matched.push({
        ingredientText: known.keyword,
        dbItem: known.dbItem,
        level: known.level,
      });
    }
  }

  if (matched.length === 0) {
    return { level: "non déterminable", matchedIngredients: [] };
  }

  const levelRank: Record<OxalateLevel, number> = {
    "faible": 0,
    "modéré": 1,
    "élevé": 2,
    "très élevé": 3,
  };

  const highest = matched.reduce((max, m) =>
    levelRank[m.level] > levelRank[max.level] ? m : max
  );

  return { level: highest.level, matchedIngredients: matched };
}
