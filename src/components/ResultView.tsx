import { useEffect, useState, type FormEvent } from "react";
import { getProductByBarcode, type OffProduct } from "../lib/off-client";
import { matchIngredients, type MatchResult } from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";

interface ResultViewProps {
  ean: string;
  onBack: () => void;
}

type LoadState =
  | { status: "loading" }
  | { status: "found"; product: OffProduct; result: MatchResult }
  | { status: "not-found" };

export function ResultView({ ean, onBack }: ResultViewProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [syncError, setSyncError] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProductByBarcode(ean).then((product) => {
      if (cancelled) return;
      if (!product) {
        setState({ status: "not-found" });
        return;
      }
      const result = matchIngredients(product.ingredientsText);
      setState({ status: "found", product, result });
      saveScan({
        ean,
        productName: product.productName,
        level: result.level,
        source: "off",
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ean]);

  async function saveScan(data: {
    ean: string;
    productName: string;
    level: string;
    source: "off" | "saisie_manuelle";
  }) {
    try {
      await pb.collection("scans").create({
        user: pb.authStore.model?.id,
        favorite: false,
        ...data,
      });
    } catch {
      setSyncError(true);
    }
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    const result = matchIngredients(manualIngredients);
    setState({
      status: "found",
      product: { productName: manualName, ingredientsText: manualIngredients, imageUrl: null },
      result,
    });
    await saveScan({
      ean,
      productName: manualName,
      level: result.level,
      source: "saisie_manuelle",
    });
  }

  if (state.status === "loading") {
    return <p>Recherche du produit...</p>;
  }

  if (state.status === "not-found") {
    return (
      <div>
        <p>Produit non trouvé sur Open Food Facts.</p>
        <form onSubmit={handleManualSubmit}>
          <label htmlFor="manual-name">Nom du produit</label>
          <input
            id="manual-name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
          <label htmlFor="manual-ingredients">Ingrédients</label>
          <textarea
            id="manual-ingredients"
            value={manualIngredients}
            onChange={(e) => setManualIngredients(e.target.value)}
          />
          <button type="submit">Valider</button>
        </form>
        <button onClick={onBack}>Retour</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{state.product.productName}</h2>
      <p>Niveau d'oxalate estimé : {state.result.level}</p>
      {state.result.matchedIngredients.length > 0 && (
        <ul>
          {state.result.matchedIngredients.map((m, index) => (
            <li key={index}>{m.ingredientText}</li>
          ))}
        </ul>
      )}
      <p>
        Estimation indicative — les valeurs d'oxalate varient selon la
        variété, le sol, la cuisson, etc.
      </p>
      <p>
        Ce niveau reflète la présence d'un ingrédient connu pour sa teneur
        en oxalate, pas une quantité mesurée dans ce produit précis.
      </p>
      {syncError && <p>Échec de synchronisation avec l'historique.</p>}
      <button onClick={onBack}>Retour</button>
    </div>
  );
}
