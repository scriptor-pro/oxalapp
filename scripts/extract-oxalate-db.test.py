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


def test_corrupted_entries_with_cooking_annotations_are_fixed():
    """Verify that entries with cooking time/method annotations are properly parsed.
    This catches the corruption where cooking annotations (e.g., "10 min in",
    "160g = X cups") were misparsed as data values."""
    data = json.loads(OUTPUT.read_text())

    # Sorrel should have high oxalate (582), not the cooking time (15)
    sorrel = next((e for e in data if e["item"] == "Sorrel, boiled"), None)
    assert sorrel is not None, "expected Sorrel, boiled in output"
    assert sorrel["avgOxalatePer100g"] == 582, f"Sorrel avg100 should be 582, got {sorrel['avgOxalatePer100g']}"
    assert sorrel["servingSize"] == "1/2 cup, chopped", f"Sorrel serving size corrupted: {sorrel['servingSize']}"
    assert sorrel["oxalatePerServing"] == 303

    # Almond milk should have proper avg100 (68), not truncated/corrupted
    almond = next((e for e in data if "Almond Milk, Homemade" in e["item"]), None)
    assert almond is not None, "expected Almond Milk, Homemade in output"
    assert almond["avgOxalatePer100g"] == 68, f"Almond avg100 should be 68, got {almond['avgOxalatePer100g']}"
    assert almond["servingSize"] == "1 cup", f"Almond serving size should be '1 cup', got {almond['servingSize']}"
    assert almond["oxalatePerServing"] == 165

    # Sautéed peppers should have reasonable avg100 (not 10), with proper serving size
    cayenne = next((e for e in data if "Cayenne" in e["item"] and "sautéed" in e["item"]), None)
    assert cayenne is not None, "expected Peppers, Cayenne, with seeds, sautéed in output"
    assert cayenne["avgOxalatePer100g"] == 31, f"Cayenne avg100 should be 31, got {cayenne['avgOxalatePer100g']}"
    assert cayenne["servingSize"] == "6 small peppers", f"Cayenne serving size corrupted: {cayenne['servingSize']}"
    assert "min in" not in cayenne["item"], f"Cooking time leaked into item name: {cayenne['item']}"
    assert "oil" not in cayenne["servingSize"].lower(), f"Oil annotation leaked into serving size: {cayenne['servingSize']}"


if __name__ == "__main__":
    test_extraction_produces_valid_json()
    test_entries_have_expected_shape()
    test_known_high_oxalate_item_is_present()
    test_wrapped_line_item_is_merged_correctly()
    test_corrupted_entries_with_cooking_annotations_are_fixed()
    print("All tests passed.")
