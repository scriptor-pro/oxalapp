# scripts/extract-oxalate-db.test.py
import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent / "extract-oxalate-db.py"
PDF = Path(__file__).parent.parent / "Oxalate-List-022724.pdf"
OUTPUT = Path(__file__).parent.parent / "src" / "data" / "oxalate-database.json"


def test_extraction_produces_valid_json():
    assert PDF.exists(), f"PDF not found at {PDF} — required for extraction"
    subprocess.run(
        [sys.executable, str(SCRIPT), str(PDF), str(OUTPUT)], check=True
    )
    data = json.loads(OUTPUT.read_text())
    assert len(data) > 700, f"expected >700 entries, got {len(data)}"


def test_entries_have_expected_shape():
    data = json.loads(OUTPUT.read_text())
    entry = data[0]
    assert set(entry.keys()) == {
        "item", "avgOxalatePer100g", "servingSize",
        "servingGrams", "oxalatePerServing", "level",
    }
    assert isinstance(entry["item"], str) and entry["item"]
    assert isinstance(entry["avgOxalatePer100g"], (int, float))
    assert isinstance(entry["oxalatePerServing"], (int, float))
    assert entry["level"] in {"faible", "modéré", "élevé", "très élevé"}


def test_known_high_oxalate_item_is_present():
    data = json.loads(OUTPUT.read_text())
    rhubarb = next(
        (e for e in data if "Rhubarb, stewed or canned" in e["item"]), None
    )
    assert rhubarb is not None, "expected Rhubarb, stewed or canned in output"
    assert rhubarb["oxalatePerServing"] == 799
    assert rhubarb["level"] == "très élevé"


def test_wrapped_line_item_is_merged_correctly():
    data = json.loads(OUTPUT.read_text())
    creasy = next((e for e in data if "Creasy greens" in e["item"]), None)
    assert creasy is not None, "expected wrapped-line item 'Creasy greens' to be merged"
    assert creasy["oxalatePerServing"] == 4


if __name__ == "__main__":
    test_extraction_produces_valid_json()
    test_entries_have_expected_shape()
    test_known_high_oxalate_item_is_present()
    test_wrapped_line_item_is_merged_correctly()
    print("All tests passed.")
