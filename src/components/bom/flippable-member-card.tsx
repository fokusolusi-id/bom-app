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

/** Draws the front as it looks on the page (background, texts and QR code) onto a canvas at the background's full size and saves it as a PNG. */
async function downloadFront(root: HTMLElement, bomId: string) {
  const bg = await loadImage("/print/bom-emoney-03-blank.png");
  const canvas = document.createElement("canvas");
  canvas.width = bg.naturalWidth;
  canvas.height = bg.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  const k = canvas.width / root.offsetWidth;
  ctx.drawImage(bg, 0, 0);
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
    ctx.drawImage(await loadImage(qr.src), x * k, y * k, qr.offsetWidth * k, qr.offsetHeight * k);
  }
  save(canvas.toDataURL("image/png"), `${bomId.toLowerCase()}-card-front.png`);
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
          className="relative aspect-[1028/650] w-full cursor-pointer transition-transform duration-700 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
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
            <Image src="/print/bom-emoney-04.png" alt="Back of the member card: TikTok, Instagram, email and website of Beyblade of Medan" fill sizes="(min-width: 768px) 26rem, 100vw" className="object-cover" />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="rounded-full bg-black/60 p-3 text-white shadow-lg"><RotateCw className="size-7" /></span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={front} disabled={busy}><Download aria-hidden />Download front</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => save("/print/bom-emoney-04.png", `${bomId.toLowerCase()}-card-back.png`)}><Download aria-hidden />Download back</Button>
      </div>
    </div>
  );
}
