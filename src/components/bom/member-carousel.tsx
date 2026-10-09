"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatBomId } from "@/domain/profile";
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
          <li key={`${m.role}-${m.bomId}`} className="w-40 shrink-0 snap-start sm:w-48">
            <Link
              href={`/member/${m.bomId.toLowerCase()}`}
              className="bg-card hover:border-primary group relative block aspect-[3/5] overflow-hidden rounded border transition-colors"
            >
              {m.photo ? (
                <Image src={mediaUrl(m.photo)} alt="" fill sizes="(min-width: 640px) 192px, 160px" className="object-cover object-top" />
              ) : (
                <span className="font-display text-primary/20 absolute inset-0 grid place-items-center text-8xl font-black italic" aria-hidden>{m.name[0]}</span>
              )}
              {/* Black protection fade so the text stays readable over any photo. */}
              <span className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40" aria-hidden />
              <span className="text-primary font-label absolute inset-x-3 top-3 text-xs font-bold tracking-[0.08em] uppercase italic">{m.role}</span>
              <span className="absolute inset-x-3 bottom-3 space-y-1">
                <span className="font-display block truncate text-lg font-extrabold italic uppercase">{m.name}</span>
                <span className="bg-secondary inline-block rounded px-2 py-0.5 text-xs font-bold underline-offset-2 group-hover:underline">{formatBomId(m.bomId)}</span>
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
