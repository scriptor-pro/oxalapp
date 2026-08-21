import { KNOWN_INGREDIENTS, normalize, type OxalateLevel, type MatchLevel } from "./oxalate-matcher";
import { FOOD_NAME_PREFIXES } from "../data/food-name-prefixes";
import oxalateDatabase from "../data/oxalate-database.json";

export interface FoodMatch {
  label: string;
  level: OxalateLevel;
}

export interface FoodSearchResult {
  level: MatchLevel;
  matches: FoodMatch[];
}

const levelRank: Record<OxalateLevel, number> = {
  "faible": 0,
  "modéré": 1,
  "élevé": 2,
  "très élevé": 3,
};

function highestLevel(matches: FoodMatch[]): OxalateLevel {
  return matches.reduce((max, m) =>
    levelRank[m.level] > levelRank[max.level] ? m : max
  ).level;
}

export function searchFoodByName(name: string): FoodSearchResult {
  const normalized = normalize(name.trim());

  const prefixEntry = FOOD_NAME_PREFIXES.find(
    (p) => normalize(p.name) === normalized
  );
  if (prefixEntry) {
    const matches: FoodMatch[] = oxalateDatabase
      .filter((entry) =>
        prefixEntry.itemPrefixes.some((prefix) => entry.item.startsWith(prefix))
      )
      .map((entry) => ({ label: entry.item, level: entry.level as OxalateLevel }));
    if (matches.length > 0) {
      return { level: highestLevel(matches), matches };
    }
  }

  const known = KNOWN_INGREDIENTS.find(
    (k) => normalize(k.keyword) === normalized
  );
  if (known) {
    return {
      level: known.level,
      matches: [{ label: known.keyword, level: known.level }],
    };
  }

  return { level: "non déterminable", matches: [] };
}
