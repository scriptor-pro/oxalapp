import { useEffect, useState } from "react";
import { pb } from "../lib/pocketbase";
import { LevelBadge } from "./LevelBadge";
import type { MatchLevel } from "../lib/oxalate-matcher";

interface Scan {
  id: string;
  productName: string;
  level: MatchLevel;
  favorite: boolean;
  created: string;
}

export function HistoryView() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selected, setSelected] = useState<Scan | null>(null);

  useEffect(() => {
    pb.collection("scans")
      .getFullList<Scan>({ sort: "-created" })
      .then(setScans);
  }, []);

  async function toggleFavorite(scan: Scan) {
    const updated = !scan.favorite;
    await pb.collection("scans").update(scan.id, { favorite: updated });
    setScans((prev) =>
      prev.map((s) => (s.id === scan.id ? { ...s, favorite: updated } : s))
    );
  }

  if (selected) {
    return (
      <div className="screen-content">
        <h2>Détail du scan</h2>
        <p className="product-name">{selected.productName}</p>
        <LevelBadge level={selected.level} />
        <p className="history-date">{selected.created}</p>
        <button className="text-button" onClick={() => setSelected(null)}>
          Retour à l'historique
        </button>
      </div>
    );
  }

  return (
    <div className="screen-content">
      <h2>Historique</h2>
      <ul className="history-list">
        {scans.map((scan) => (
          <li key={scan.id} className="history-item">
            <button
              type="button"
              className="history-meta"
              onClick={() => setSelected(scan)}
            >
              <span className="history-name">{scan.productName}</span>
              <span className="history-date">{scan.created}</span>
            </button>
            <LevelBadge level={scan.level} />
            <button
              className="fav-button"
              aria-label={scan.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              onClick={() => toggleFavorite(scan)}
            >
              {scan.favorite ? "★" : "☆"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
