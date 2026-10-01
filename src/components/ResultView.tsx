import { useEffect, useState, type FormEvent } from "react";
import { Capacitor } from "@capacitor/core";
import { resolveProduct, type ResolvedProduct } from "../lib/product-resolver";
import { uploadIngredientsPhoto } from "../lib/off-contribute";
import { recognizeIngredientsText } from "../lib/ocr-client";
import {
  matchIngredients,
  matchStructuredIngredients,
  type MatchResult,
  type UnknownIngredient,
} from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";
import { lookupProductName } from "../lib/upcitemdb-client";
import { LevelBadge } from "./LevelBadge";
import { ManualIngredientsForm } from "./ManualIngredientsForm";

export type ScanFailureReason = "no-ingredients" | "unknown-ingredients" | "no-match";

export function categorizeFailure(
  result: MatchResult,
  product: { ingredientsText: string }
): ScanFailureReason | null {
  if (result.level !== "non déterminable") return null;
  if (!product.ingredientsText.trim()) return "no-ingredients";
  if (result.unknownIngredients.length > 0) return "unknown-ingredients";
  return "no-match";
}

// « Farine de BLÉ (50%), arôme de malt » : pourcentage arrondi à l'entier
// (une estimation OFF ne justifie pas de décimale), omis s'il est inconnu.
// Un même ingrédient listé deux fois par OFF n'est nommé qu'une fois.
function formatUnknownIngredients(unknowns: UnknownIngredient[]): string {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const unknown of unknowns) {
    const name = unknown.text.trim() || unknown.offId || "ingrédient sans nom";
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (unknown.percentEstimate === null) {
      labels.push(name);
      continue;
    }
    const percent = unknown.percentEstimate < 1 ? "<1" : String(Math.round(unknown.percentEstimate));
    labels.push(`${name} (${percent}%)`);
  }
  return labels.join(", ");
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
  const isNativePlatform = Capacitor.isNativePlatform();
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
      if (categorizeFailure(result, product) === "no-ingredients") {
        setManualName(product.productName);
      }
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

  async function handleOcrPhotoSelected(file: File) {
    const text = await recognizeIngredientsText(file);
    if (text) {
      setManualIngredients(text);
    }
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
        <ManualIngredientsForm
          name={manualName}
          onNameChange={setManualName}
          ingredients={manualIngredients}
          onIngredientsChange={setManualIngredients}
          onSubmit={handleManualSubmit}
          showOcrButton={isNativePlatform}
          onPhotoSelected={handleOcrPhotoSelected}
        />
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
        {state.result.level === "faible" && (
          <p className="ingredient-line">
            Tous les ingrédients présents à 2 % ou plus sont reconnus comme
            pauvres en oxalate.
          </p>
        )}
        {(() => {
          const failureReason = categorizeFailure(state.result, state.product);
          if (failureReason === "unknown-ingredients") {
            return (
              <p className="ingredient-line">
                Ingrédients non reconnus :{" "}
                {formatUnknownIngredients(state.result.unknownIngredients)}.
              </p>
            );
          }
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
                {isNativePlatform ? (
                  <ManualIngredientsForm
                    name={manualName}
                    onNameChange={setManualName}
                    ingredients={manualIngredients}
                    onIngredientsChange={setManualIngredients}
                    onSubmit={handleManualSubmit}
                    showOcrButton={true}
                    onPhotoSelected={handleOcrPhotoSelected}
                  />
                ) : (
                  <>
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
                  </>
                )}
              </div>
            );
          }
          return null;
        })()}
        <p className="disclaimer">
          Estimation indicative — les valeurs d'oxalate varient selon la
          variété, le sol, la cuisson, etc. Ce niveau est déduit de la liste
          d'ingrédients, pas d'une quantité mesurée dans ce produit précis.
        </p>
        {syncError && <p className="sync-error">Échec de synchronisation avec l'historique.</p>}
      </div>
      <button className="text-button" onClick={onBack}>Retour</button>
    </div>
  );
}
