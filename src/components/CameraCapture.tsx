import { useEffect, useRef, useState } from "react";
import { getFrameCropInVideoSpace } from "../lib/frame-crop";

// Prise de vue dans l'app (getUserMedia), sans passer par l'app photo du
// téléphone : celle-ci peut exiger des permissions sans rapport (micro de
// l'appareil photo Motorola) et ne jamais rendre la photo.

const CAPTURE_JPEG_QUALITY = 0.9;

interface CameraCaptureProps {
  captureLabel: string;
  disabled?: boolean;
  // null quand l'image n'a pas pu être produite (canvas indisponible).
  onCaptured: (image: Blob | null) => void;
  onPermissionError: () => void;
}

export function CameraCapture({
  captureLabel,
  disabled = false,
  onCaptured,
  onPermissionError,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [cameraReady, setCameraReady] = useState(false);

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
        if (!cancelled) onPermissionError();
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
    if (!ctx) {
      onCaptured(null);
      return;
    }
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
    onCaptured(blob);
  }

  return (
    <>
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
        disabled={!cameraReady || disabled}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        {captureLabel}
      </button>
    </>
  );
}
