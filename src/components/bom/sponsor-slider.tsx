"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mediaUrl } from "@/lib/media";

export type SponsorLogo = { id?: string; name: string; logo: string; website: string | null };

const STEP_MS = 3000;

// A fresh random seed per page load in the browser. The server snapshot is 0, so the first render matches the
// server's HTML and the shuffle only kicks in once the page is live.
const clientSeed = Math.floor(Math.random() * 2 ** 31) || 1;
const noopSubscribe = () => () => {};

function shuffled<T>(list: T[], seed: number): T[] {
  if (seed === 0) return list;
  let a = seed;
  const rand = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

const query = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia(query).matches, () => false);

/**
 * Sponsor logos in a random order on every visit. When there are more than fit on screen the strip slides on its own,
 * one logo at a time, and loops back to the start. Pauses on hover/focus and for reduced motion.
 */
export function SponsorSlider({ sponsors }: { sponsors: SponsorLogo[] }) {
  const seed = useSyncExternalStore(noopSubscribe, () => clientSeed, () => 0);
  const items = shuffled(sponsors, seed);
  const track = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  const step = useCallback(() => {
    const el = track.current;
    if (!el || el.scrollWidth <= el.clientWidth + 4) return;
    const tile = el.firstElementChild as HTMLElement | null;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: (tile?.offsetWidth ?? 200) + 16, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(step, STEP_MS);
    return () => clearInterval(id);
  }, [paused, reduced, step]);

  return (
    <ul
      ref={track} aria-label="Sponsors"
      className="mb-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      {items.map((sp) => {
        const logo = (
          // eslint-disable-next-line @next/next/no-img-element -- sponsor logos come in any size and format
          <img src={mediaUrl(sp.logo)} alt={sp.name} loading="lazy" className="h-12 w-auto max-w-40 object-contain sm:h-14" />
        );
        return (
          <li key={sp.id ?? sp.name} className="flex shrink-0 snap-start items-center justify-center rounded-lg bg-white px-6 py-3">
            {sp.website ? <a href={sp.website} target="_blank" rel="noopener noreferrer" aria-label={sp.name}>{logo}</a> : logo}
          </li>
        );
      })}
    </ul>
  );
}
