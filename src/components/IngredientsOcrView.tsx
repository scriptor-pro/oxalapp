import { useEffect, useRef, useState, type FormEvent } from "react";
import { recognizeIngredientsText } from "../lib/ocr-client";
import { matchIngredients, type MatchResult } from "../lib/oxalate-matcher";
import { pb } from "../lib/pocketbase";
import { LevelBadge } from "./LevelBadge";
import { ManualIngredientsForm } from "./ManualIngredientsForm";

interface IngredientsOcrViewProps {
  onBack: () => void;
}

type OcrState = "idle" | "reading" | "empty";

const CAPTURE_FILE_PATH = "oxalapp-ocr-capture.jpg";
const CAPTURE_JPEG_QUALITY = 0.9;

interface VideoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Maps the on-screen guide frame to a crop rectangle in the video's native
// pixel space, accounting for `object-fit: cover` scaling the video to fill
// its container (cropping whichever axis overflows). Without this, the OCR
// sees the full camera frame — logos, nutrition table, legal text — instead
// of just what the user framed.
export function getFrameCropInVideoSpace(
  video: HTMLVideoElement,
  frame: HTMLElement | null
): VideoCrop {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const container = video.parentElement;
  if (!frame || !container || videoWidth === 0 || videoHeight === 0) {
    return { x: 0, y: 0, width: videoWidth, height: videoHeight };
  }

  const containerRect = container.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  if (containerRect.width === 0 || containerRect.height === 0) {
    return { x: 0, y: 0, width: videoWidth, height: videoHeight };
  }

  // `object-fit: cover`: the video scales uniformly to cover the container,
  // so the effective scale is the larger of the two axis ratios.
  const scale = Math.max(
    containerRect.width / videoWidth,
    containerRect.height / videoHeight
  );
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (renderedWidth - containerRect.width) / 2;
  const offsetY = (renderedHeight - containerRect.height) / 2;

  const x = (frameRect.left - containerRect.left + offsetX) / scale;
  const y = (frameRect.top - containerRect.top + offsetY) / scale;
  const width = frameRect.width / scale;
  const height = frameRect.height / scale;

  return {
    x: Math.max(0, Math.min(x, videoWidth)),
    y: Math.max(0, Math.min(y, videoHeight)),
    width: Math.max(1, Math.min(width, videoWidth - x)),
    height: Math.max(1, Math.min(height, videoHeight - y)),
  };
}

export function IngredientsOcrView({ onBack }: IngredientsOcrViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch {
        if (!cancelled) setPermissionError(true);
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      if (!cancelled) setCameraReady(true);
    }

    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCapture() {
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    const crop = getFrameCropInVideoSpace(video, frameRef.current);
    const canvas = document.createElement("canvas");
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      video,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", CAPTURE_JPEG_QUALITY)
    );
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
      <p className="home-sub">
        Placez uniquement la liste d'ingrédients dans le cadre (sans le nom
        du produit ni le tableau nutritionnel) puis photographiez-la.
      </p>
      <div className="viewfinder viewfinder-wide">
        <video ref={videoRef} className="viewfinder-video" muted playsInline />
        <div ref={frameRef} className="viewfinder-frame" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="scan-button ocr-capture-button"
        onClick={handleCapture}
        disabled={!cameraReady || ocrState === "reading"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        Photographier les ingrédients
      </button>
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
