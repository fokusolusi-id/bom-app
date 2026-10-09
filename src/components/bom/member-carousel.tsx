"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { mediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";

const INTERVAL_MS = 3500;

export type CarouselMember = { name: string; bomId: string; role: string; photo: string | null };

/** Auto-rotating, swipeable strip of tall portrait cards. Pauses on hover/focus and for reduced motion. */
export function MemberCarousel({ members, label = "Founding team" }: { members: CarouselMember[]; label?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  const step = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const w = (card?.offsetWidth ?? 200) + 12;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * w, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => step(1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, step]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ul ref={track} aria-label={label} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {members.map((m) => (
          <li key={`${m.role}-${m.bomId}`} className="shrink-0 snap-start">
            <Link
              href={`/member/${m.bomId.toLowerCase()}`}
              className="bg-card hover:border-primary group relative block h-80 overflow-hidden rounded border transition-colors sm:h-96 lg:h-[28rem]"
            >
              {m.photo ? (
                // Same height for every card, natural width: the photos are tall strips and must not be cropped.
                // eslint-disable-next-line @next/next/no-img-element -- width follows each photo's own aspect ratio
                <img src={mediaUrl(m.photo)} alt="" loading="lazy" className="h-full w-auto max-w-none" />
              ) : (
                <span className="font-display text-primary/20 grid h-full w-32 place-items-center text-8xl font-black italic" aria-hidden>{m.name[0]}</span>
              )}
              {/* Black protection fade so the text stays readable over any photo. */}
              <span className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" aria-hidden />
              <span className="absolute inset-x-2 bottom-2 space-y-1">
                <span className="text-primary font-label line-clamp-2 min-h-[2lh] text-xs leading-tight font-bold tracking-[0.08em] text-balance uppercase italic">{m.role}</span>
                <span className="font-display block truncate text-base font-extrabold italic uppercase">{m.name}</span>
                <BomIdBadge id={m.bomId} className="group-hover:underline" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft /></Button>
        <Button type="button" variant="outline" size="sm" onClick={() => step(1)} aria-label="Next"><ChevronRight /></Button>
      </div>
    </div>
  );
}
