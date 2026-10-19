"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { mediaUrl } from "@/lib/media";

export type PopupSlide = { id: string; path: string; caption: string | null };

/**
 * The pop-up that opens when the homepage loads: pictures of upcoming events, one at a time. With more than one there are
 * arrows, dots, the arrow keys and a swipe to move between them. Close it with the button, Escape or a click outside.
 */
export function HomePopup({ slides }: { slides: PopupSlide[] }) {
  // Open from the start: the dialog shows as soon as the page is interactive.
  const [open, setOpen] = useState(slides.length > 0);
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const count = slides.length;
  const go = useCallback((step: number) => setIndex((i) => (i + step + count) % count), [count]);

  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count, go]);

  if (count === 0) return null;
  const slide = slides[Math.min(index, count - 1)];
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={count > 1 ? `Upcoming events (${index + 1} of ${count})` : "Upcoming event"} extraWide>
      <div
        className="space-y-3"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX !== null && count > 1 && Math.abs(e.changedTouches[0].clientX - touchX) > 50) go(e.changedTouches[0].clientX < touchX ? 1 : -1);
          setTouchX(null);
        }}
      >
        <div className="relative flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded poster of any size: shown whole, never cropped */}
          <img key={slide.id} src={mediaUrl(slide.path)} alt={slide.caption ?? `Event ${index + 1}`} className="max-h-[70vh] w-auto max-w-full rounded-md object-contain" />
          {count > 1 && (
            <>
              <Button type="button" variant="outline" size="sm" className="absolute left-1 w-9 bg-black/60 px-0" onClick={() => go(-1)} aria-label="Previous picture"><ChevronLeft aria-hidden /></Button>
              <Button type="button" variant="outline" size="sm" className="absolute right-1 w-9 bg-black/60 px-0" onClick={() => go(1)} aria-label="Next picture"><ChevronRight aria-hidden /></Button>
            </>
          )}
        </div>
        {slide.caption && <p className="text-center font-bold">{slide.caption}</p>}
        {count > 1 && (
          <div className="flex justify-center gap-2" role="group" aria-label="Pictures">
            {slides.map((s, i) => (
              <button key={s.id} type="button" onClick={() => setIndex(i)} aria-label={`Picture ${i + 1}`} aria-current={i === index ? "true" : undefined}
                className={`size-2.5 rounded-full border ${i === index ? "bg-primary border-primary" : "hover:border-primary"}`} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
