import { useEffect, useState } from "react";
import { pb } from "../lib/pocketbase";

interface Scan {
  id: string;
  productName: string;
  level: string;
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
      <div>
        <h2>Détail du scan</h2>
        <p>{selected.productName}</p>
        <p>Niveau : {selected.level}</p>
        <p>Date : {selected.created}</p>
        <button onClick={() => setSelected(null)}>Retour à l'historique</button>
      </div>
    );
  }

  return (
    <ul>
      {scans.map((scan) => (
        <li key={scan.id}>
          <span onClick={() => setSelected(scan)}>
            <span>{scan.productName}</span> — <span>{scan.level}</span>
          </span>
          <button
            aria-label={scan.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={() => toggleFavorite(scan)}
          >
            {scan.favorite ? "★" : "☆"}
          </button>
        </li>
      ))}
    </ul>
  );
}
