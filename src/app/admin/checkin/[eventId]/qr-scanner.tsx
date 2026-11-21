"use client";
import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

/**
 * Opens the device camera (the back one on a phone) and calls `onScan` once with the text of the first QR code it reads.
 * Uses the browser's own detector where there is one (Chrome, Android) and jsQR elsewhere (Safari on iPhone). Needs HTTPS.
 */
export function QrScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const callbacks = useRef({ onScan, onClose });
  useEffect(() => { callbacks.current = { onScan, onClose }; });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot open the camera (it needs https).");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        const el = video.current!;
        el.srcObject = stream;
        await el.play();
        const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        const native = Native ? new Native({ formats: ["qr_code"] }) : null;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

        const tick = async () => {
          if (stopped) return;
          if (el.readyState >= 2 && el.videoWidth) {
            let text: string | null = null;
            try {
              if (native) {
                text = (await native.detect(el))[0]?.rawValue ?? null;
              } else {
                // Scan a downscaled copy: plenty for a card's QR code, and quick enough on a phone.
                const scale = Math.min(1, 640 / el.videoWidth);
                canvas.width = Math.round(el.videoWidth * scale);
                canvas.height = Math.round(el.videoHeight * scale);
                ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
                text = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data ?? null;
              }
            } catch { /* a frame that cannot be read: try the next */ }
            if (text) { stopped = true; callbacks.current.onScan(text); return; }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      } catch (e) {
        setError(e instanceof Error && e.name === "NotAllowedError" ? "Camera access was blocked. Allow the camera for this site, or search the player instead." : e instanceof Error ? e.message : "Could not open the camera");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-black">
        <video ref={video} playsInline muted className="size-full object-cover" />
        <div className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-white/80" aria-hidden />
      </div>
      {error ? <p role="alert" className="text-destructive text-center text-sm">{error}</p> : <p className="text-muted-foreground text-center text-sm">Point the camera at the QR code on the member card.</p>}
      <div className="text-center"><button type="button" onClick={() => callbacks.current.onClose()} className="text-primary text-sm underline">Close the camera</button></div>
    </div>
  );
}
