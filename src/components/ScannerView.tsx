import { useEffect, useRef, useState, type FormEvent } from "react";
import { scanImageData } from "../lib/barcode-scanner";

interface ScannerViewProps {
  onScanned: (ean: string) => void;
}

const DETECTED_FEEDBACK_DELAY_MS = 400;
// Interval between decode passes. ZXing-C++ is fast, but bounding the cadence
// keeps CPU sane on low-end devices while still giving many frames a chance.
const DECODE_INTERVAL_MS = 250;
// Cap the frame width fed to the decoder to bound per-pass cost; the height is
// scaled to preserve the camera aspect ratio.
const MAX_DECODE_WIDTH = 1280;

// `torch`/`focusMode` are not yet in the standard MediaTrack typings.
type CameraCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  focusMode?: string[];
};
type CameraConstraint = MediaTrackConstraintSet & {
  torch?: boolean;
  focusMode?: string;
};

export function ScannerView({ onScanned }: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
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

  async function toggleTorch() {
    const track = trackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as CameraConstraint],
      });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function decodeLoop() {
      const video = videoRef.current;
      if (cancelled || !video || !ctx || video.readyState < 2) {
        timer = window.setTimeout(decodeLoop, DECODE_INTERVAL_MS);
        return;
      }
      const scale = Math.min(1, MAX_DECODE_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let ean: string | null = null;
      try {
        ean = await scanImageData(frame);
      } catch {
        // Ignore a single failed pass; the loop keeps trying.
      }
      if (cancelled) return;
      if (ean) {
        setDetectedEan(ean);
        return;
      }
      timer = window.setTimeout(decodeLoop, DECODE_INTERVAL_MS);
    }

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
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      const caps = track.getCapabilities?.() as CameraCapabilities | undefined;
      if (caps?.focusMode?.includes("continuous")) {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: "continuous" } as CameraConstraint],
          });
        } catch {
          // Continuous autofocus is best-effort.
        }
      }
      if (caps?.torch) setTorchSupported(true);

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      decodeLoop();
    }

    start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      trackRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
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
          dans les réglages de l'application.
        </p>
        {manualEntryForm}
      </div>
    );
  }

  const detected = detectedEan !== null;

  return (
    <div className="screen-content scan-view">
      <div className="viewfinder">
        <video ref={videoRef} className="viewfinder-video" muted playsInline />
        <div
          className={detected ? "viewfinder-frame viewfinder-frame-detected" : "viewfinder-frame"}
          aria-hidden="true"
        >
          {detected && <span className="viewfinder-check" aria-hidden="true">✓</span>}
        </div>
      </div>
      {torchSupported && (
        <button
          type="button"
          className="torch-button"
          aria-pressed={torchOn}
          onClick={toggleTorch}
        >
          {torchOn ? "Éteindre la lampe" : "Allumer la lampe"}
        </button>
      )}
      <p className="scan-hint" aria-live="polite">
        {detected
          ? "Code-barres correctement détecté"
          : "Visez le code-barres. Pour une boîte ou une cannette, inclinez-la légèrement pour aplatir le code."}
      </p>
      {manualEntryForm}
    </div>
  );
}
