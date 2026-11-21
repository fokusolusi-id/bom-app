"use client";
import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;
type Caps = { zoom?: { min: number; max: number; step?: number }; focusMode?: string[] };
type Zoom = { min: number; max: number; step: number; value: number };

/** The text of the first QR code in a photo (taken with the phone's own camera app, which focuses by itself), or null. */
async function readQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (Native) {
    try { const hit = (await new Native({ formats: ["qr_code"] }).detect(canvas as unknown as CanvasImageSource))[0]?.rawValue; if (hit) return hit; } catch { /* fall through to jsQR */ }
  }
  return jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data ?? null;
}

/**
 * Opens the device camera (the back one on a phone) and calls `onScan` once with the text of the first QR code it reads.
 * Uses the browser's own detector where there is one (Chrome, Android) and jsQR elsewhere (Safari on iPhone). Needs HTTPS.
 */
export function QrScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const track = useRef<MediaStreamTrack | null>(null);
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
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        // Sharper and easier to focus: ask for continuous focus, and offer zoom so the phone can be held farther from the card (too close and it cannot focus).
        const t = stream.getVideoTracks()[0];
        track.current = t;
        const caps = (t.getCapabilities?.() ?? {}) as Caps;
        if (caps.focusMode?.includes("continuous")) await t.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});
        if (caps.zoom) {
          const start = Math.min(caps.zoom.max, Math.max(caps.zoom.min, 2));
          await t.applyConstraints({ advanced: [{ zoom: start } as MediaTrackConstraintSet] }).catch(() => {});
          setZoom({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step ?? 0.1, value: start });
        }
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

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    try {
      const text = await readQrFromFile(file);
      if (text) callbacks.current.onScan(text);
      else setPhotoError("No QR code found in that photo. Get the whole QR code in the photo, in focus, and try again.");
    } catch { setPhotoError("Could not read that photo."); }
  }

  return (
    <div className="space-y-2">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-black">
        <video ref={video} playsInline muted className="size-full object-cover" />
        <div className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-white/80" aria-hidden />
      </div>
      {zoom && (
        <label className="mx-auto flex max-w-sm items-center gap-2 text-sm">Zoom
          <input type="range" min={zoom.min} max={zoom.max} step={zoom.step} value={zoom.value} className="flex-1"
            onChange={(e) => { const value = Number(e.target.value); setZoom({ ...zoom, value }); track.current?.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] }).catch(() => {}); }} />
        </label>
      )}
      {error ? <p role="alert" className="text-destructive text-center text-sm">{error}</p> : <p className="text-muted-foreground text-center text-sm">Hold the phone about 20 to 30 cm from the card until the QR code is sharp. Blurry? Move back a little, or take a photo instead.</p>}
      <div className="text-center">
        <label className="text-primary cursor-pointer text-sm underline">Take a photo instead
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {photoError && <p role="alert" className="text-destructive mt-1 text-sm">{photoError}</p>}
      </div>
      <div className="text-center"><button type="button" onClick={() => callbacks.current.onClose()} className="text-primary text-sm underline">Close the camera</button></div>
    </div>
  );
}
