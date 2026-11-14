"use client";
import { Download, RotateCw } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MemberCard } from "./member-card";

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new window.Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Could not load the card image"));
  img.src = src;
});

/** Offset of an element inside the card, ignoring the flip transform (unlike getBoundingClientRect). */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0;
  for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) { x += n.offsetLeft; y += n.offsetTop; }
  return { x, y };
}

function save(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}

/** A bank-card (ID-1) size, 85.60 x 53.98 mm. The downloads are 3033 x 1913 px: 900 dpi at that size, 3x the art (1011 x 638), so the texts and the QR code stay sharp when printed. */
const EXPORT_W = 3033;
const EXPORT_H = 1913;
const EXPORT_PPM = 35433; // 900 dpi in pixels per metre, written into the PNG so print software sizes it at 85.60 x 53.98 mm

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (bytes: Uint8Array) => { let c = 0xffffffff; for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

/** Saves the canvas as a PNG that says how big it is in print (a pHYs chunk after the header). */
async function savePng(canvas: HTMLCanvasElement, filename: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not make the image");
  const png = new Uint8Array(await blob.arrayBuffer());
  const chunk = new Uint8Array(21); // length (4), "pHYs" (4), x, y, unit (9), crc (4)
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4);
  view.setUint32(8, EXPORT_PPM);
  view.setUint32(12, EXPORT_PPM);
  chunk[16] = 1; // metres
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const at = 33; // signature (8) + IHDR chunk (25)
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, at));
  out.set(chunk, at);
  out.set(png.subarray(at), at + chunk.length);
  const url = URL.createObjectURL(new Blob([out], { type: "image/png" }));
  save(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Draws the front as it looks on the page (background, texts and QR code) onto a canvas of the card's real proportions and saves it as a PNG. */
async function downloadFront(root: HTMLElement, bomId: string) {
  await document.fonts.ready;
  const bg = await loadImage("/print/bom-emoney-03.png");
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext("2d")!;
  const k = canvas.width / root.offsetWidth;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";
  root.querySelectorAll<HTMLElement>("[data-card-text]").forEach((el) => {
    const cs = getComputedStyle(el);
    const { x, y } = offsetIn(el, root);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * k}px ${cs.fontFamily}`;
    ctx.fillStyle = cs.color;
    const text = cs.textTransform === "uppercase" ? (el.textContent ?? "").toUpperCase() : (el.textContent ?? "");
    ctx.fillText(text, x * k, (y + el.offsetHeight / 2) * k);
  });
  const qr = root.querySelector<HTMLImageElement>("[data-card-qr]");
  if (qr) {
    const { x, y } = offsetIn(qr, root);
    const r = 6 * k;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.roundRect(x * k, y * k, qr.offsetWidth * k, qr.offsetHeight * k, r);
    ctx.fill();
    // No smoothing for the QR code: its square modules stay crisp when enlarged.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(await loadImage(qr.src), x * k, y * k, qr.offsetWidth * k, qr.offsetHeight * k);
  }
  await savePng(canvas, `${bomId.toLowerCase()}-card-front.png`);
}

/** Saves the back at the same size as the front download, enlarged with high-quality smoothing. */
async function downloadBack(bomId: string) {
  const img = await loadImage("/print/bom-emoney-04.png");
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  await savePng(canvas, `${bomId.toLowerCase()}-card-back.png`);
}

/** The member's card that turns over on a click or with a button to show the back (public/print/bom-emoney-04.png). */
export function FlippableMemberCard({ bomId, bladerName, since, qr, design }: { bomId: string; bladerName: string; since: string; qr?: string; design?: "print" | "classic" }) {
  const [back, setBack] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const front = async () => {
    const root = box.current?.querySelector<HTMLElement>("[data-member-card]");
    if (!root) return;
    setBusy(true);
    try { await downloadFront(root, bomId); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3" ref={box}>
      <div className="group relative [perspective:1200px]">
        <div
          className="relative aspect-[8560/5398] w-full cursor-pointer transition-transform duration-700 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{ transform: back ? "rotateY(180deg)" : "rotateY(0deg)" }}
          onClick={() => setBack((b) => !b)}
          role="button"
          tabIndex={0}
          aria-pressed={back}
          aria-label={back ? "Card back shown, turn it to the front" : "Card front shown, turn it to the back"}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setBack((b) => !b); } }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]" aria-hidden={back}>
            <MemberCard bomId={bomId} bladerName={bladerName} since={since} qr={qr} design={design} />
          </div>
          <div className="absolute inset-0 overflow-hidden rounded-xl border border-white/10 [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!back}>
            <Image src="/print/bom-emoney-04.png" unoptimized alt="Back of the member card: TikTok, Instagram, email and website of Beyblade of Medan" fill sizes="(min-width: 768px) 26rem, 100vw" className="object-cover" />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="rounded-full bg-black/60 p-3 text-white shadow-lg"><RotateCw className="size-7" /></span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={front} disabled={busy}><Download aria-hidden />Download front</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void downloadBack(bomId)}><Download aria-hidden />Download back</Button>
      </div>
    </div>
  );
}
