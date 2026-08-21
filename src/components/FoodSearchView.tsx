import { useState, type FormEvent } from "react";
import { searchFoodByName, type FoodSearchResult } from "../lib/food-search";
import { pb } from "../lib/pocketbase";
import { LevelBadge } from "./LevelBadge";

export function FoodSearchView() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<FoodSearchResult | null>(null);
  const [syncError, setSyncError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const searchResult = searchFoodByName(name);
    setResult(searchResult);
    setSyncError(false);
    try {
      await pb.collection("scans").create({
        user: pb.authStore.record?.id,
        ean: "",
        productName: name,
        level: searchResult.level,
        source: "saisie_manuelle",
        favorite: false,
      });
    } catch {
      setSyncError(true);
    }
  }

  return (
    <div className="food-search">
      <form className="manual-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="food-name" className="field-label">
            Nom de l'aliment
          </label>
          <input
            id="food-name"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button type="submit" className="primary-button">Chercher</button>
      </form>

      {result && (
        <div className="food-search-result">
          {result.matches.length === 0 ? (
            <LevelBadge level="non déterminable" />
          ) : (
            result.matches.map((match, index) => (
              <div key={index} className="food-search-match">
                <span className="food-search-match-label">{match.label}</span>
                <LevelBadge level={match.level} />
              </div>
            ))
          )}
          {syncError && (
            <p className="sync-error">Échec de synchronisation avec l'historique.</p>
          )}
        </div>
      )}
    </div>
  );
}
