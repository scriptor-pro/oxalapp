import type { MatchLevel, OxalateLevel } from "../lib/oxalate-matcher";

interface LevelBadgeProps {
  level: MatchLevel;
}

const LEVEL_LABEL: Record<MatchLevel, string> = {
  "faible": "Faible",
  "modéré": "Modéré",
  "élevé": "Élevé",
  "très élevé": "Très élevé",
  "non déterminable": "Non déterminable",
};

const LEVEL_CLASS: Record<MatchLevel, string> = {
  "faible": "level-low",
  "modéré": "level-mod",
  "élevé": "level-high",
  "très élevé": "level-vhigh",
  "non déterminable": "level-unknown",
};

const CRYSTAL_COUNT: Record<OxalateLevel, number> = {
  "faible": 1,
  "modéré": 2,
  "élevé": 3,
  "très élevé": 4,
};

function Crystal() {
  return (
    <svg className="crystal" viewBox="0 0 9 12" data-testid="crystal" aria-hidden="true">
      <path d="M4.5 0 L8 4 L6.5 12 L2.5 12 L1 4 Z" />
    </svg>
  );
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const crystalCount = level === "non déterminable" ? 0 : CRYSTAL_COUNT[level];

  return (
    <span className={`level-badge ${LEVEL_CLASS[level]}`} data-testid="level-badge">
      {crystalCount > 0 && (
        <span className="crystals">
          {Array.from({ length: crystalCount }, (_, i) => (
            <Crystal key={i} />
          ))}
        </span>
      )}
      {LEVEL_LABEL[level]}
    </span>
  );
}
