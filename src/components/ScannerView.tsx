import { useEffect, useRef, useState, type FormEvent } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

interface ScannerViewProps {
  onScanned: (ean: string) => void;
}

export function ScannerView({ onScanned }: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [manualEan, setManualEan] = useState("");
  const [manualError, setManualError] = useState(false);

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
            onScanned(result.getText());
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

  return (
    <div className="screen-content scan-view">
      <div className="viewfinder">
        <video ref={videoRef} className="viewfinder-video" />
        <div className="viewfinder-frame" aria-hidden="true" />
      </div>
      <p className="scan-hint">Visez le code-barres du produit.</p>
      {manualEntryForm}
    </div>
  );
}
