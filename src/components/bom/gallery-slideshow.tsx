"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mediaUrl } from "@/lib/media";

export type GalleryItem = { path: string; caption: string | null };

const SLIDE_MS = 5000;

const query = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia(query).matches, () => false);

/**
 * Full-screen-width slideshow: each photo is shown whole (never cropped) on black, with a thumbnail strip below.
 * Auto-advances; pauses on hover/focus and for reduced motion. Left/right arrow keys work while focused.
 */
export function GallerySlideshow({ items }: { items: GalleryItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const thumbs = useRef<HTMLUListElement>(null);
  const count = items.length;

  const go = useCallback((d: number) => setI((cur) => (cur + d + count) % count), [count]);

  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const id = setTimeout(() => go(1), SLIDE_MS);
    return () => clearTimeout(id);
  }, [i, reduced, paused, count, go]);

  // Keep the active thumbnail in view by scrolling the strip only, never the page.
  useEffect(() => {
    const strip = thumbs.current;
    const el = strip?.children[i] as HTMLElement | undefined;
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [i]);

  const item = items[i];
  return (
    <div
      role="group" aria-roledescription="carousel" aria-label="Gallery" tabIndex={0}
      className="bg-black outline-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}
    >
      <div className="relative h-[calc(100svh-11rem)] min-h-80 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- shown whole at any aspect ratio, as large as the screen allows */}
        <img key={item.path} src={mediaUrl(item.path)} alt={item.caption ?? `Photo ${i + 1} of ${count}`} className="size-full object-contain" />
        {item.caption && <p className="absolute bottom-3 left-4 rounded bg-black/60 px-3 py-1 text-sm">{item.caption}</p>}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute top-1/2 left-2 -translate-y-1/2 rounded bg-black/50 p-2 hover:bg-black/80"><ChevronLeft /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute top-1/2 right-2 -translate-y-1/2 rounded bg-black/50 p-2 hover:bg-black/80"><ChevronRight /></button>
          </>
        )}
      </div>
      <ul ref={thumbs} aria-label="Thumbnails" className="flex gap-2 overflow-x-auto px-2 py-2 [scrollbar-width:thin]">
        {items.map((m, n) => (
          <li key={m.path} className="shrink-0">
            <button type="button" onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} aria-current={n === i}
              className={`block h-16 w-24 overflow-hidden rounded border-2 sm:h-20 sm:w-28 ${n === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail of the same file */}
              <img src={mediaUrl(m.path)} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
