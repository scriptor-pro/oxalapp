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
    if (normalized.includes(normalizedKeyword)) {
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
