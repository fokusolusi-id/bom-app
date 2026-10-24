"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { isVideoPath } from "@/domain/media";
import { mediaUrl } from "@/lib/media";

/** A picture or a video, both a `path` in the media bucket; a video's path ends in .mp4 or .webm. The caption may have a second line after a "|". */
export type PopupSlide = { id: string; path: string; caption: string | null };

/**
 * The pop-up that opens when the homepage loads: pictures and videos of upcoming events, one at a time. A video loops and plays with sound,
 * or muted until the first touch when the browser blocks sound (not at all with reduced motion, where the controls are shown), and stops when the
 * slide changes or the pop-up closes. With more than one item there are
 * arrows, dots, the arrow keys and a swipe to move between them. Close it with the button, Escape or a click outside.
 */
export function HomePopup({ slides }: { slides: PopupSlide[] }) {
  // Open from the start: the dialog shows as soon as the page is interactive.
  const [open, setOpen] = useState(slides.length > 0);
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const count = slides.length;
  const player = useRef<HTMLVideoElement>(null);
  const slide = slides[Math.min(index, Math.max(count - 1, 0))];
  const isVideo = open && !!slide && isVideoPath(slide.path);
  const go = useCallback((step: number) => setIndex((i) => (i + step + count) % count), [count]);

  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count, go]);

  useEffect(() => {
    if (!isVideo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const video = player.current;
    if (!video) return;
    // Plays with sound. Browsers refuse that before the visitor has touched the page, so then it starts muted and gets its sound
    // on the first click, tap or key press.
    video.muted = false;
    let unlock: (() => void) | null = null;
    video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => {});
      unlock = () => { video.muted = false; };
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    });
    return () => {
      if (unlock) { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); }
    };
  }, [isVideo, slide?.id]);

  if (count === 0) return null;
  // "BK2 Cup #1 2026 | 31.10.2026": the part after the | is a smaller second line.
  const [caption, second] = (slide.caption ?? "").split("|").map((t) => t.trim());
  return (
    <Modal open={open} onClose={() => setOpen(false)} title={isVideoPath(slide.path) ? "Event Highlight" : count > 1 ? `Upcoming events (${index + 1} of ${count})` : "Upcoming event"} extraWide>
      <div
        className="space-y-3"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX !== null && count > 1 && Math.abs(e.changedTouches[0].clientX - touchX) > 50) go(e.changedTouches[0].clientX < touchX ? 1 : -1);
          setTouchX(null);
        }}
      >
        <div className="relative flex items-center justify-center">
          {isVideoPath(slide.path) ? (
            <video key={slide.id} ref={player} src={mediaUrl(slide.path)} controls loop playsInline preload="metadata" aria-label={caption ?? "Event highlight video"} className="max-h-[70vh] w-auto max-w-full rounded-md" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- an uploaded poster of any size: shown whole, never cropped
            <img key={slide.id} src={mediaUrl(slide.path)} alt={caption ?? `Event ${index + 1}`} className="max-h-[70vh] w-auto max-w-full rounded-md object-contain" />
          )}
          {count > 1 && (
            <>
              <Button type="button" variant="outline" size="sm" className="absolute left-1 w-9 bg-black/60 px-0" onClick={() => go(-1)} aria-label="Previous picture"><ChevronLeft aria-hidden /></Button>
              <Button type="button" variant="outline" size="sm" className="absolute right-1 w-9 bg-black/60 px-0" onClick={() => go(1)} aria-label="Next picture"><ChevronRight aria-hidden /></Button>
            </>
          )}
        </div>
        {caption && <p className="text-center font-bold">{caption}</p>}
        {second && <p className="text-muted-foreground -mt-2 text-center text-sm">{second}</p>}
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
