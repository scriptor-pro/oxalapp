import type { StructuredIngredient } from "./off-client";
import { KNOWN_INGREDIENTS } from "../data/known-ingredients";
import type { KnownIngredient, OxalateLevel } from "../data/known-ingredients";

export { KNOWN_INGREDIENTS };
export type { KnownIngredient, OxalateLevel };

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
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/-/g, " "); // treat hyphens as spaces (e.g. "chardon-marie")
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

// Language-independent lookup: Open Food Facts resolves each structured
// ingredient's text against its own taxonomy and returns a canonical id
// (e.g. "en:hazelnut") regardless of the product's declared language.
// Built once from the entries that carry an `offId`, so a Dutch/German/
// whatever-language product whose text isn't in KNOWN_INGREDIENTS can
// still match via this id instead of falling through to "non déterminable".
const KNOWN_INGREDIENTS_BY_OFF_ID: Record<string, KnownIngredient> =
  Object.fromEntries(
    KNOWN_INGREDIENTS.filter(
      (known): known is KnownIngredient & { offId: string } => !!known.offId
    ).map((known) => [known.offId, known])
  );

function matchKnownIngredientByOffId(
  offId: string | null | undefined
): MatchedIngredient | null {
  if (!offId) return null;
  const known = KNOWN_INGREDIENTS_BY_OFF_ID[offId];
  if (!known) return null;
  return { ingredientText: known.keyword, dbItem: known.dbItem, level: known.level };
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
    // Prefer the OFF taxonomy id when available: it's language-independent
    // (always "en:"-prefixed) and authoritative, so it wins over regex text
    // matching, which only understands French/Dutch/English. Falls back to
    // the text path when OFF didn't resolve an id, or it isn't one of ours.
    const idMatch = matchKnownIngredientByOffId(ingredient.offId);
    const matches = idMatch
      ? [idMatch]
      : dedupeMatches(
          matchKnownIngredientsInText(normalize(ingredient.text))
        );
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
