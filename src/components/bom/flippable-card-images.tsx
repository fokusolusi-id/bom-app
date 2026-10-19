"use client";
import { RotateCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** The printed card (bom-emoney-03.png) and its back (bom-emoney-04.png): click the card or the button to turn it over. */
export function FlippableCardImages({ className }: { className?: string }) {
  const [back, setBack] = useState(false);
  return (
    <div className={className}>
      <div className="[perspective:1200px]">
        <div
          className="relative aspect-[1028/650] w-full cursor-pointer transition-transform duration-700 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{ transform: back ? "rotateY(180deg)" : "rotateY(0deg)" }}
          onClick={() => setBack((b) => !b)}
        >
          <Image src="/print/bom-emoney-03.png" alt="BOM Emoney Membership Card, front" width={1028} height={650} className="absolute inset-0 w-full rounded-xl [backface-visibility:hidden]" aria-hidden={back} />
          <Image src="/print/bom-emoney-04.png" alt="BOM Emoney Membership Card, back" width={1028} height={650} className="absolute inset-0 w-full rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!back} />
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <Button type="button" variant="outline" size="sm" onClick={() => setBack((b) => !b)} aria-pressed={back}><RotateCw aria-hidden />{back ? "Show the front" : "Show the back"}</Button>
      </div>
    </div>
  );
}
