import type { StructuredIngredient } from "./off-client";
import { KNOWN_INGREDIENTS } from "../data/known-ingredients";
import type { KnownIngredient, OxalateLevel } from "../data/known-ingredients";
import lowOxalateTable from "../data/low-oxalate-ingredients.json";
import riskyOxalateTable from "../data/risky-oxalate-ingredients.json";

export { KNOWN_INGREDIENTS };
export type { KnownIngredient, OxalateLevel };

export type MatchLevel = OxalateLevel | "non déterminable";

export interface MatchedIngredient {
  ingredientText: string; // mot-clé interne de KNOWN_INGREDIENTS (normalisé, parfois anglais)
  // Nom à afficher, tel qu'il figure sur l'étiquette ou dans la saisie
  // (accents, pluriel, langue du produit). Absent quand on ne peut pas le
  // retrouver : l'affichage retombe alors sur ingredientText.
  labelText?: string;
  dbItem: string;
  level: OxalateLevel;
  // Proportion retenue : le plus grand du déclaré et de l'estimé.
  percentEstimate?: number;
  levelBeforeAdjustment?: OxalateLevel;
}

export interface UnknownIngredient {
  text: string;
  offId: string | null;
  // Proportion retenue : le plus grand du déclaré et de l'estimé.
  percentEstimate: number | null;
}

export interface MatchResult {
  level: MatchLevel;
  matchedIngredients: MatchedIngredient[];
  // Ingrédients structurés ni à risque ni reconnus faibles, présents à 2 %
  // ou plus (ou de proportion inconnue), dans l'ordre de la liste. Toujours
  // vide pour le texte brut.
  unknownIngredients: UnknownIngredient[];
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

// Étape 5 (spec 2026-10-01) : un ingrédient inconnu présent à moins de ce
// pourcentage est ignoré, de même qu'un ingrédient à risque sous 2 % est
// déjà ramené à « faible » par degradeByProportion.
const NEGLIGIBLE_PERCENT = 2;
// Garde-fou : si les inconnus ignorés totalisent plus que ce pourcentage,
// plus aucun n'est ignoré, pour que plusieurs petits inconnus ne finissent
// pas par peser lourd.
const MAX_IGNORED_PERCENT = 5;

// Open Food Facts renvoie parfois des estimations absurdes (ex. -359 %) :
// on les traite comme une proportion inconnue plutôt que comme une trace.
function sanitizePercent(percent: number | null): number | null {
  if (percent === null || !Number.isFinite(percent)) return null;
  if (percent < 0 || percent > 100) return null;
  return percent;
}

// Proportion retenue (spec 2026-10-01-pourcentages-declares) : le plus
// grand du pourcentage déclaré sur l'étiquette et de l'estimation d'OFF.
// OFF découpe parfois mal une liste (« PETIT BEURRE 52 % : farine… ») et
// estime alors le chocolat déclaré à 48 % à 1 % : retenir le plus grand
// ne peut que surestimer un ingrédient, jamais le minimiser.
function retainedPercent(ingredient: StructuredIngredient): number | null {
  const declared = sanitizePercent(ingredient.percentDeclared ?? null);
  const estimated = sanitizePercent(ingredient.percentEstimate);
  if (declared === null) return estimated;
  if (estimated === null) return declared;
  return Math.max(declared, estimated);
}

// Ingrédients pauvres en oxalate, générés à partir de la taxonomie OFF par
// scripts/generate-oxalate-tables.ts (familles et exceptions dans
// scripts/low-oxalate-roots.json).
const LOW_OXALATE_IDS: Record<string, string> = lowOxalateTable.ids;

function isLowOxalateId(offId: string | null | undefined): boolean {
  return !!offId && Object.hasOwn(LOW_OXALATE_IDS, offId);
}

// Ingrédients à risque hérités de la taxonomie OFF (blé en paliers,
// chocolat, cacao), générés par scripts/generate-oxalate-tables.ts.
const RISKY_INHERITED_IDS = riskyOxalateTable.ids as Record<
  string,
  { level: OxalateLevel; label: string; family: string }
>;

function matchInheritedRiskyId(offId: string | null | undefined): MatchedIngredient | null {
  if (!offId || !Object.hasOwn(RISKY_INHERITED_IDS, offId)) return null;
  const entry = RISKY_INHERITED_IDS[offId];
  return { ingredientText: entry.label, dbItem: entry.label, level: entry.level };
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/-/g, " "); // treat hyphens as spaces (e.g. "chardon-marie")
}

function matchKnownIngredientsInText(text: string): MatchedIngredient[] {
  const matched: MatchedIngredient[] = [];
  const normalized = normalize(text);
  // normalize() garde la longueur d'un texte latin en NFC (un caractère
  // accentué devient une lettre nue) : les positions trouvées dans le texte
  // normalisé valent alors dans l'original, ce qui permet d'afficher le
  // passage tel qu'écrit. Sinon (écritures qui se décomposent autrement),
  // pas de passage plutôt qu'un passage décalé.
  const positionsAligned = normalized.length === text.length;

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
    // Lookbehind négatif : le mot-clé ne compte pas s'il suit l'un de ces
    // mots (« beurre de cacao », « white chocolate », « arôme chocolat »).
    const exclusionLookbehind = known.excludePrecededBy?.length
      ? `(?<!(?:${known.excludePrecededBy.map((w) => escapeRegex(normalize(w))).join("|")}) )`
      : "";
    const keywordPattern = new RegExp(
      `${exclusionLookbehind}(?:\\b${escapedKeyword}${exclusionLookahead}s?\\b${pluralAlternative})`
    );
    const match = keywordPattern.exec(normalized);
    if (match) {
      matched.push({
        ingredientText: known.keyword,
        ...(positionsAligned
          ? { labelText: text.slice(match.index, match.index + match[0].length) }
          : {}),
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

function highestLevel(matches: MatchedIngredient[]): OxalateLevel | null {
  if (matches.length === 0) return null;
  return matches.reduce((max, m) =>
    LEVEL_RANK[m.level] > LEVEL_RANK[max.level] ? m : max
  ).level;
}

function aggregateResult(deduped: MatchedIngredient[]): MatchResult {
  return {
    level: highestLevel(deduped) ?? "non déterminable",
    matchedIngredients: deduped,
    unknownIngredients: [],
  };
}

export function matchIngredients(ingredientsText: string): MatchResult {
  const trimmed = ingredientsText.trim();
  if (!trimmed) {
    return { level: "non déterminable", matchedIngredients: [], unknownIngredients: [] };
  }

  const matched = matchKnownIngredientsInText(trimmed);
  const deduped = dedupeMatches(matched);

  return aggregateResult(deduped);
}

type StructuredClassification =
  | { kind: "risky"; matches: MatchedIngredient[] }
  | { kind: "low" }
  | { kind: "unknown" };

// Ordre : identifiant à risque connu, identifiant faible, identifiant à
// risque hérité de la taxonomie, puis mots-clés du texte. L'identifiant OFF
// fait foi avant le texte : « beurre de cacao » (en:cocoa-butter) est
// faible même si son texte contient « cacao ».
function classifyStructuredIngredient(
  ingredient: StructuredIngredient
): StructuredClassification {
  // Une entrée structurée est un ingrédient de l'étiquette : on affiche son
  // texte entier (« pâte de cacao »), sauf quand plusieurs mots-clés y sont
  // reconnus (« noisettes et amandes »), où chaque passage reste distinct.
  const labelText = ingredient.text.trim() || undefined;
  const idMatch = matchKnownIngredientByOffId(ingredient.offId);
  if (idMatch) {
    return { kind: "risky", matches: [labelText ? { ...idMatch, labelText } : idMatch] };
  }
  if (isLowOxalateId(ingredient.offId)) return { kind: "low" };
  const inherited = matchInheritedRiskyId(ingredient.offId);
  if (inherited) {
    return { kind: "risky", matches: [labelText ? { ...inherited, labelText } : inherited] };
  }
  const textMatches = dedupeMatches(matchKnownIngredientsInText(ingredient.text));
  if (textMatches.length === 0) return { kind: "unknown" };
  if (textMatches.length === 1 && labelText) {
    return { kind: "risky", matches: [{ ...textMatches[0], labelText }] };
  }
  return { kind: "risky", matches: textMatches };
}

export function matchStructuredIngredients(
  structuredIngredients: StructuredIngredient[]
): MatchResult {
  const riskyMatches: MatchedIngredient[] = [];
  const unknowns: UnknownIngredient[] = [];
  let recognizedCount = 0;

  for (const ingredient of structuredIngredients) {
    const percent = retainedPercent(ingredient);
    const classification = classifyStructuredIngredient(ingredient);
    if (classification.kind === "unknown") {
      unknowns.push({
        text: ingredient.text,
        offId: ingredient.offId ?? null,
        percentEstimate: percent,
      });
      continue;
    }
    recognizedCount++;
    if (classification.kind === "low") continue;
    for (const match of classification.matches) {
      if (percent === null) {
        riskyMatches.push(match);
        continue;
      }
      const adjustedLevel = degradeByProportion(match.level, percent);
      riskyMatches.push({
        ...match,
        level: adjustedLevel,
        percentEstimate: percent,
        ...(adjustedLevel !== match.level ? { levelBeforeAdjustment: match.level } : {}),
      });
    }
  }

  const isNegligible = (unknown: UnknownIngredient) =>
    unknown.percentEstimate !== null && unknown.percentEstimate < NEGLIGIBLE_PERCENT;
  const ignoredPercent = unknowns
    .filter(isNegligible)
    .reduce((sum, unknown) => sum + (unknown.percentEstimate ?? 0), 0);
  const unknownIngredients =
    ignoredPercent > MAX_IGNORED_PERCENT
      ? unknowns
      : unknowns.filter((unknown) => !isNegligible(unknown));

  // Règle stricte (spec 2026-10-01, décision A) : un niveau au-dessus de
  // « faible » est un minimum que les inconnus ne pourraient qu'augmenter ;
  // « faible » exige en revanche qu'aucun inconnu significatif ne reste.
  const highest = highestLevel(riskyMatches);
  let level: MatchLevel;
  if (highest !== null && highest !== "faible") {
    level = highest;
  } else if (recognizedCount > 0 && unknownIngredients.length === 0) {
    level = "faible";
  } else {
    level = "non déterminable";
  }

  return { level, matchedIngredients: riskyMatches, unknownIngredients };
}
