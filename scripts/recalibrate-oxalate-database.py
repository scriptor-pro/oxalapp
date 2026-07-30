#!/usr/bin/env python3
"""Reclassify oxalate-database.json against the Mayo Clinic thresholds
and add a ±35% uncertainty range per entry. Idempotent: safe to re-run.
"""
import json
import math
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "src" / "data" / "oxalate-database.json"


def classify(mg_per_serving: float) -> str:
    if mg_per_serving < 5:
        return "faible"
    if mg_per_serving < 8:
        return "modéré"
    if mg_per_serving < 25:
        return "élevé"
    return "très élevé"


def js_round(value: float, decimals: int = 0) -> float:
    """Emulate JavaScript Math.round behavior (round half away from zero)."""
    multiplier = 10 ** decimals
    return math.floor(value * multiplier + 0.5) / multiplier


def main() -> None:
    with DB_PATH.open(encoding="utf-8") as f:
        entries = json.load(f)

    for entry in entries:
        mg = entry["oxalatePerServing"]
        entry["level"] = classify(mg)
        entry["oxalatePerServingMin"] = js_round(mg * 0.65, 1)
        entry["oxalatePerServingMax"] = js_round(mg * 1.35, 1)

    with DB_PATH.open("w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    main()
