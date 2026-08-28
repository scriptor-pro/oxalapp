import { useEffect, useState, type FormEvent } from "react";
import { resolveProduct, type ResolvedProduct } from "../lib/product-resolver";
import { uploadIngredientsPhoto } from "../lib/off-contribute";
import { matchIngredients, matchStructuredIngredients, type MatchResult } from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";
import { lookupProductName } from "../lib/upcitemdb-client";
import { LevelBadge } from "./LevelBadge";

export type ScanFailureReason = "no-ingredients" | "no-match";

export function categorizeFailure(
  result: MatchResult,
  product: { ingredientsText: string }
): ScanFailureReason | null {
  if (result.level !== "non déterminable") return null;
  if (!product.ingredientsText.trim()) return "no-ingredients";
  return "no-match";
}

interface ResultViewProps {
  ean: string;
  onBack: () => void;
}

type LoadState =
  | { status: "loading" }
  | { status: "found"; product: ResolvedProduct; result: MatchResult }
  | { status: "not-found" };

export function ResultView({ ean, onBack }: ResultViewProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [syncError, setSyncError] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");
  const [photoUploadState, setPhotoUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    resolveProduct(ean).then((product) => {
      if (cancelled) return;
      if (!product) {
        setState({ status: "not-found" });
        lookupProductName(ean).then((name) => {
          if (cancelled || !name) return;
          setManualName(name);
        });
        return;
      }
      const result =
        product.structuredIngredients.length > 0
          ? matchStructuredIngredients(product.structuredIngredients)
          : matchIngredients(product.ingredientsText);
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
        user: pb.authStore.record?.id,
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
      product: {
        gtin: ean,
        rawCode: ean,
        productName: manualName,
        ingredientsText: manualIngredients,
        structuredIngredients: [],
        imageUrl: null,
        lang: null,
        sources: ["saisie_manuelle"],
      },
      result,
    });
    await saveScan({
      ean,
      productName: manualName,
      level: result.level,
      source: "saisie_manuelle",
    });
  }

  async function handlePhotoSelected(e: FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const lang = state.status === "found" ? state.product.lang ?? "fr" : "fr";
    setPhotoUploadState("uploading");
    const success = await uploadIngredientsPhoto(ean, file, lang);
    setPhotoUploadState(success ? "success" : "error");
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
                {m.percentEstimate !== undefined &&
                  ` (${m.percentEstimate.toString().replace(".", ",")}%${
                    m.levelBeforeAdjustment ? ", contribution réduite" : ""
                  })`}
                {index < state.result.matchedIngredients.length - 1 ? ", " : ""}
              </strong>
            ))}
            .
          </p>
        )}
        {(() => {
          const failureReason = categorizeFailure(state.result, state.product);
          if (failureReason === "no-match") {
            return (
              <p className="ingredient-line">
                Aucun ingrédient à risque connu détecté dans la liste fournie.
              </p>
            );
          }
          if (failureReason === "no-ingredients") {
            return (
              <div className="ingredient-line">
                <p>
                  Liste d'ingrédients non disponible sur Open Food Facts
                  pour ce produit.
                </p>
                <label htmlFor="ingredients-photo" className="text-button">
                  Photographier les ingrédients
                  <input
                    id="ingredients-photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={handlePhotoSelected}
                  />
                </label>
                {photoUploadState === "success" && (
                  <p className="ingredient-line">
                    Merci, transmis à Open Food Facts — la liste
                    d'ingrédients sera disponible après traitement.
                  </p>
                )}
                {photoUploadState === "error" && (
                  <p className="sync-error">
                    Échec de l'envoi de la photo. Réessayez plus tard.
                  </p>
                )}
              </div>
            );
          }
          return null;
        })()}
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
