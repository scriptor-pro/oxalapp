import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

interface ScannerViewProps {
  onScanned: (ean: string) => void;
}

export function ScannerView({ onScanned }: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState(false);

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

  if (permissionError) {
    return (
      <p>
        Impossible d'accéder à la caméra. Vérifiez l'autorisation caméra
        dans les réglages de votre navigateur.
      </p>
    );
  }

  return (
    <div>
      <p>Visez le code-barres du produit.</p>
      <video ref={videoRef} style={{ width: "100%" }} />
    </div>
  );
}
