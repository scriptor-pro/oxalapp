import { useEffect, useState, type FormEvent } from "react";
import { getProductByBarcode, type OffProduct } from "../lib/off-client";
import { matchIngredients, type MatchResult } from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";
import { LevelBadge } from "./LevelBadge";

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
    return (
      <div className="screen-content">
        <p className="loading-text">Recherche du produit...</p>
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="screen-content">
        <p>Produit non trouvé sur Open Food Facts.</p>
        <form className="manual-form" onSubmit={handleManualSubmit}>
          <div className="field">
            <label htmlFor="manual-name" className="field-label">Nom du produit</label>
            <input
              id="manual-name"
              className="field-input"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="manual-ingredients" className="field-label">Ingrédients</label>
            <textarea
              id="manual-ingredients"
              className="field-input"
              value={manualIngredients}
              onChange={(e) => setManualIngredients(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-button">Valider</button>
        </form>
        <button className="text-button" onClick={onBack}>Retour</button>
      </div>
    );
  }

  return (
    <div className="screen-content">
      <div className="product-card">
        <div className="product-thumb" aria-hidden="true" />
        <h2 className="product-name">{state.product.productName}</h2>
        <LevelBadge level={state.result.level} />
        {state.result.matchedIngredients.length > 0 && (
          <p className="ingredient-line">
            Ingrédients à risque détectés :{" "}
            {state.result.matchedIngredients.map((m, index) => (
              <strong key={index}>
                {m.ingredientText}
                {index < state.result.matchedIngredients.length - 1 ? ", " : ""}
              </strong>
            ))}
            .
          </p>
        )}
        <p className="disclaimer">
          Estimation indicative — les valeurs d'oxalate varient selon la
          variété, le sol, la cuisson, etc. Ce niveau reflète la présence
          d'un ingrédient connu pour sa teneur en oxalate, pas une
          quantité mesurée dans ce produit précis.
        </p>
        {syncError && <p className="sync-error">Échec de synchronisation avec l'historique.</p>}
      </div>
      <button className="text-button" onClick={onBack}>Retour</button>
    </div>
  );
}
