import { useState, type FormEvent } from "react";
import { recognizeIngredientsText } from "../lib/ocr-client";
import { matchIngredients, type MatchResult } from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";
import { CameraCapture } from "./CameraCapture";
import { LevelBadge } from "./LevelBadge";
import { ManualIngredientsForm } from "./ManualIngredientsForm";

interface IngredientsOcrViewProps {
  onBack: () => void;
}

type OcrState = "idle" | "reading" | "empty";

const CAPTURE_FILE_PATH = "oxalapp-ocr-capture.jpg";

export function IngredientsOcrView({ onBack }: IngredientsOcrViewProps) {
  const [permissionError, setPermissionError] = useState(false);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [syncError, setSyncError] = useState(false);

  async function handleCaptured(blob: Blob | null) {
    if (!blob) {
      setOcrState("empty");
      return;
    }

    setOcrState("reading");
    const text = await recognizeIngredientsText(blob, {
      tempFilePath: CAPTURE_FILE_PATH,
    });
    if (text) {
      setIngredients(text);
      setOcrState("idle");
    } else {
      setOcrState("empty");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const matchResult = matchIngredients(ingredients);
    setResult(matchResult);
    setSyncError(false);
    try {
      await pb.collection("scans").create({
        user: pb.authStore.record?.id,
        ean: "",
        productName: name,
        level: matchResult.level,
        source: "saisie_manuelle",
        favorite: false,
      });
    } catch {
      setSyncError(true);
    }
  }

  if (permissionError) {
    return (
      <div className="screen-content ocr-view">
        <p>
          Impossible d'accéder à la caméra. Vérifiez l'autorisation caméra
          dans les réglages de l'application.
        </p>
        <ManualIngredientsForm
          name={name}
          onNameChange={setName}
          ingredients={ingredients}
          onIngredientsChange={setIngredients}
          onSubmit={handleSubmit}
          showOcrButton={false}
        />
        <button className="text-button" onClick={onBack}>Retour</button>
      </div>
    );
  }

  return (
    <div className="screen-content ocr-view">
      <CameraCapture
        captureLabel="Photographier les ingrédients"
        disabled={ocrState === "reading"}
        onCaptured={handleCaptured}
        onPermissionError={() => setPermissionError(true)}
      />
      <ManualIngredientsForm
        name={name}
        onNameChange={setName}
        ingredients={ingredients}
        onIngredientsChange={setIngredients}
        onSubmit={handleSubmit}
        showOcrButton={false}
      />
      {ocrState === "reading" && (
        <p className="loading-text">Lecture du texte…</p>
      )}
      {ocrState === "empty" && (
        <p className="sync-error" role="alert">
          Aucun texte lisible. Réessayez avec une photo plus nette.
        </p>
      )}
      {result && (
        <div className="food-search-result">
          <LevelBadge level={result.level} />
          {result.matchedIngredients.length > 0 && (
            <p className="ingredient-line">
              Ingrédients à risque détectés :{" "}
              {result.matchedIngredients.map((m, index) => (
                <strong key={index}>
                  {m.labelText ?? m.ingredientText}
                  {index < result.matchedIngredients.length - 1 ? ", " : ""}
                </strong>
              ))}
              .
            </p>
          )}
          <p className="disclaimer">
            Estimation indicative — les valeurs d'oxalate varient selon la
            variété, le sol, la cuisson, etc. Ce niveau reflète la présence
            d'un ingrédient connu pour sa teneur en oxalate, pas une quantité
            mesurée.
          </p>
          {syncError && (
            <p className="sync-error">
              Échec de synchronisation avec l'historique.
            </p>
          )}
        </div>
      )}
      <button className="text-button" onClick={onBack}>Retour</button>
    </div>
  );
}
