"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/lib/media";

export type GalleryItem = { path: string; caption: string | null };

const INITIAL = 12;

/** Photo grid with a click-to-enlarge dialog. Shows the first 12, the rest behind a button. */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const shown = all ? items : items.slice(0, INITIAL);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {shown.map((m) => (
          <li key={m.path}>
            <button
              type="button" aria-label={m.caption ?? "Enlarge photo"}
              className="hover:border-primary relative block aspect-square w-full overflow-hidden rounded border"
              onClick={() => { setOpen(m); dialog.current?.showModal(); }}
            >
              <Image src={mediaUrl(m.path)} alt={m.caption ?? ""} fill sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      {items.length > INITIAL && !all && <Button variant="outline" className="mt-4" onClick={() => setAll(true)}>Show all {items.length} photos</Button>}
      <dialog
        ref={dialog}
        className="m-auto max-h-[90vh] max-w-[90vw] bg-transparent p-0 backdrop:bg-black/85"
        onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
        onClose={() => setOpen(null)}
      >
        {open && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- full-size view of the selected photo */}
            <img src={mediaUrl(open.path)} alt={open.caption ?? ""} className="max-h-[85vh] max-w-[90vw] object-contain" />
            {open.caption && <p className="mt-2 text-center text-sm">{open.caption}</p>}
            <Button className="absolute top-2 right-2" size="sm" onClick={() => dialog.current?.close()}>Close</Button>
          </div>
        )}
      </dialog>
    </>
  );
}
