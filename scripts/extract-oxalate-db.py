"""Parse the OHF oxalate PDF into a JSON database.

Usage: python3 extract-oxalate-db.py <input.pdf> <output.json>
"""
import json
import re
import sys

import pdfplumber

SKIP_PATTERNS = [
    re.compile(r"^Item Avg oxalate"),
    re.compile(r"^©"),
    re.compile(r"^\S+ Oxalate$"),
    re.compile(r"^π Avg oxalate"),
]

# Matches: <item text> <avg/100g> <serving size text> <serving grams> <oxalate/serving>
FULL_PATTERN = re.compile(
    r"^(?P<item>.+?)\s+"
    r"(?P<avg100>-?\d+(?:\.\d+)?)\s+"
    r"(?P<serving_size>.+?)\s+"
    r"(?P<serving_g>-?\d+(?:\.\d+)?)\s+"
    r"(?P<oxalate_serving>-?\d+(?:\.\d+)?)\s*$"
)

END_PATTERN = re.compile(r"(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$")


def classify(oxalate_per_serving: float) -> str:
    if oxalate_per_serving >= 300:
        return "très élevé"
    if oxalate_per_serving >= 100:
        return "élevé"
    if oxalate_per_serving >= 25:
        return "modéré"
    return "faible"


def is_skip(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    return any(p.search(stripped) for p in SKIP_PATTERNS)


def extract_lines(pdf_path: str) -> list[str]:
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page_index, page in enumerate(pdf.pages):
            if page_index == 0:
                continue  # cover page, no tabular data
            text += (page.extract_text() or "") + "\n"
    return text.split("\n")


def merge_wrapped_lines(lines: list[str]) -> list[str]:
    entries = []
    pending = ""
    for line in lines:
        if is_skip(line):
            continue
        candidate = (pending + " " + line).strip() if pending else line.strip()
        if END_PATTERN.search(candidate):
            entries.append(candidate)
            pending = ""
        else:
            pending = candidate
    return entries


def parse_entry(line: str) -> dict | None:
    match = FULL_PATTERN.match(line)
    if not match:
        return None
    oxalate_per_serving = float(match.group("oxalate_serving"))
    return {
        "item": match.group("item").strip(),
        "avgOxalatePer100g": float(match.group("avg100")),
        "servingSize": match.group("serving_size").strip(),
        "servingGrams": float(match.group("serving_g")),
        "oxalatePerServing": oxalate_per_serving,
        "level": classify(oxalate_per_serving),
    }


def main(pdf_path: str, output_path: str) -> None:
    lines = extract_lines(pdf_path)
    candidate_entries = merge_wrapped_lines(lines)

    parsed = []
    skipped = []
    for candidate in candidate_entries:
        entry = parse_entry(candidate)
        if entry:
            parsed.append(entry)
        else:
            skipped.append(candidate)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)

    print(f"Parsed {len(parsed)} entries, skipped {len(skipped)}.")
    for s in skipped:
        print(f"  SKIPPED: {s}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 extract-oxalate-db.py <input.pdf> <output.json>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
