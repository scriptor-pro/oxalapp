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
    <form onSubmit={handleManualSubmit}>
      <label htmlFor="manual-ean">Ou entrez les chiffres sous le code-barres</label>
      <input
        id="manual-ean"
        inputMode="numeric"
        value={manualEan}
        onChange={(e) => setManualEan(e.target.value)}
      />
      <button type="submit">Valider</button>
      {manualError && <p role="alert">Le code doit contenir exactement 13 chiffres.</p>}
    </form>
  );

  if (permissionError) {
    return (
      <div>
        <p>
          Impossible d'accéder à la caméra. Vérifiez l'autorisation caméra
          dans les réglages de votre navigateur.
        </p>
        {manualEntryForm}
      </div>
    );
  }

  return (
    <div>
      <p>Visez le code-barres du produit.</p>
      <video ref={videoRef} style={{ width: "100%" }} />
      {manualEntryForm}
    </div>
  );
}
