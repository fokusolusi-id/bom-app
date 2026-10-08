"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatBomId } from "@/domain/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const INTERVAL_MS = 3500;

/** Auto-rotating, swipeable strip of members. Pauses on hover/focus and for reduced motion. */
export function MemberCarousel({ members }: { members: { name: string; bomId: string }[] }) {
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
      <ul ref={track} aria-label="Founding team" className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {members.map((m) => (
          <li key={m.bomId} className="w-44 shrink-0 snap-start">
            <Link href={`/member/${m.bomId.toLowerCase()}`}>
              <Card className="hover:border-primary items-center text-center transition-colors">
                <Avatar className="size-16"><AvatarFallback className="text-2xl">{m.name[0]}</AvatarFallback></Avatar>
                <div className="font-display w-full truncate text-lg font-extrabold italic uppercase">{m.name}</div>
                <Badge variant="secondary">{formatBomId(m.bomId)}</Badge>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => step(-1)} aria-label="Sebelumnya"><ChevronLeft /></Button>
        <Button type="button" variant="outline" size="sm" onClick={() => step(1)} aria-label="Berikutnya"><ChevronRight /></Button>
      </div>
    </div>
  );
}
