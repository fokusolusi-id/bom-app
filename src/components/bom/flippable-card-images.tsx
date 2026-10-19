"use client";
import { RotateCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/** The printed card (bom-emoney-03.png) and its back (bom-emoney-04.png): click the card or the button to turn it over. */
export function FlippableCardImages({ className }: { className?: string }) {
  const [back, setBack] = useState(false);
  return (
    <div className={className}>
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
          <Image src="/print/bom-emoney-03.png" alt="Beyblade of Medan Emoney Membership Card, front" width={1028} height={650} className="absolute inset-0 w-full rounded-xl [backface-visibility:hidden]" aria-hidden={back} />
          <Image src="/print/bom-emoney-04.png" alt="Beyblade of Medan Emoney Membership Card, back" width={1028} height={650} className="absolute inset-0 w-full rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!back} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="rounded-full bg-black/60 p-3 text-white shadow-lg"><RotateCw className="size-7" /></span>
        </div>
      </div>
    </div>
  );
}
