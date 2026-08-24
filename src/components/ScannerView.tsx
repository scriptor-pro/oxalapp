import { useEffect, useRef, useState, type FormEvent } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

interface ScannerViewProps {
  onScanned: (ean: string) => void;
}

const DETECTED_FEEDBACK_DELAY_MS = 400;

export function ScannerView({ onScanned }: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [manualEan, setManualEan] = useState("");
  const [manualError, setManualError] = useState(false);
  const [detectedEan, setDetectedEan] = useState<string | null>(null);

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{13}$/.test(manualEan)) {
      setManualError(true);
      return;
    }
    setManualError(false);
    onScanned(manualEan);
  }

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;
    let controls: IScannerControls | undefined;

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result) => {
          if (result && !cancelled) {
            controls?.stop();
            setDetectedEan(result.getText());
          }
        }
      )
      .then((c) => {
        controls = c;
        if (cancelled) {
          controls.stop();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPermissionError(true);
        }
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!detectedEan) return;
    const timer = setTimeout(() => onScanned(detectedEan), DETECTED_FEEDBACK_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedEan]);

  const manualEntryForm = (
    <form className="manual-form" onSubmit={handleManualSubmit}>
      <div className="field">
        <label htmlFor="manual-ean" className="manual-link">
          Ou entrez les chiffres sous le code-barres
        </label>
        <input
          id="manual-ean"
          className="field-input"
          inputMode="numeric"
          value={manualEan}
          onChange={(e) => setManualEan(e.target.value)}
        />
      </div>
      <button type="submit" className="primary-button">Valider</button>
      {manualError && (
        <p className="sync-error" role="alert">
          Le code doit contenir exactement 13 chiffres.
        </p>
      )}
    </form>
  );

  if (permissionError) {
    return (
      <div className="screen-content scan-view">
        <p>
          Impossible d'accéder à la caméra. Vérifiez l'autorisation caméra
          dans les réglages de votre navigateur.
        </p>
        {manualEntryForm}
      </div>
    );
  }

  const detected = detectedEan !== null;

  return (
    <div className="screen-content scan-view">
      <div className="viewfinder">
        <video ref={videoRef} className="viewfinder-video" />
        <div
          className={detected ? "viewfinder-frame viewfinder-frame-detected" : "viewfinder-frame"}
          aria-hidden="true"
        >
          {detected && <span className="viewfinder-check" aria-hidden="true">✓</span>}
        </div>
      </div>
      <p className="scan-hint" aria-live="polite">
        {detected ? "Code-barres correctement détecté" : "Visez le code-barres du produit."}
      </p>
      {manualEntryForm}
    </div>
  );
}
