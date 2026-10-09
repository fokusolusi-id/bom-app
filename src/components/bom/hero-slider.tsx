"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mediaUrl } from "@/lib/media";

export type Slide = { kind: "image" | "video"; path: string; caption: string | null };

const IMAGE_MS = 5000;

const query = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia(query).matches, () => false);

/**
 * Full-width slider of photos and muted videos. Photos advance on a timer, videos when they end.
 * No auto-advance for reduced motion; a single slide just loops (video) or stays (photo).
 */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const count = slides.length;
  const slide = slides[i];

  const go = useCallback((d: 1 | -1) => setI((cur) => (cur + d + count) % count), [count]);

  useEffect(() => {
    if (reduced || paused || count < 2 || slide.kind !== "image") return;
    const id = setTimeout(() => go(1), IMAGE_MS);
    return () => clearTimeout(id);
  }, [i, reduced, paused, count, slide.kind, go]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (reduced || paused) v.pause();
    else void v.play().catch(() => {});
  }, [i, reduced, paused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="BOM highlights"
      className="relative aspect-video max-h-[70vh] w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slide.kind === "video" ? (
        <video
          key={slide.path} ref={video} src={mediaUrl(slide.path)} muted playsInline autoPlay={!reduced} loop={count === 1}
          preload="metadata" className="size-full object-cover" onEnded={() => count > 1 && go(1)}
          aria-label={slide.caption ?? undefined}
        />
      ) : (
        <Image key={slide.path} src={mediaUrl(slide.path)} alt={slide.caption ?? ""} fill priority={i === 0} sizes="100vw" className="object-cover" />
      )}
      {slide.caption && (
        <p className="font-display absolute bottom-10 left-4 text-xl font-extrabold italic uppercase drop-shadow md:left-8 md:text-3xl">{slide.caption}</p>
      )}
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="absolute top-1/2 left-2 -translate-y-1/2 rounded bg-black/50 p-2 hover:bg-black/80"><ChevronLeft /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next slide" className="absolute top-1/2 right-2 -translate-y-1/2 rounded bg-black/50 p-2 hover:bg-black/80"><ChevronRight /></button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((s, n) => (
              <button key={s.path} type="button" onClick={() => setI(n)} aria-label={`Slide ${n + 1}`} aria-current={n === i}
                className={`h-1.5 w-8 rounded-sm ${n === i ? "bg-primary" : "bg-white/40 hover:bg-white/70"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
