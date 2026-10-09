"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mediaUrl } from "@/lib/media";

export type NewsItem = { kind: "video" | "youtube"; path: string | null; youtubeId: string | null; caption: string | null };

const YT_ORIGIN = "https://www.youtube-nocookie.com";

const query = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia(query).matches, () => false);
const noop = () => () => {};
const useOrigin = () => useSyncExternalStore(noop, () => window.location.origin, () => "");

/**
 * Slider of videos. Each slide autoplays muted and moves to the next one when it ends
 * (uploaded files via `ended`, YouTube via its iframe API). A single slide loops.
 * With reduced motion nothing autoplays; the video controls are shown instead.
 */
export function NewsSlider({ items }: { items: NewsItem[] }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const origin = useOrigin();
  const frame = useRef<HTMLIFrameElement>(null);
  const count = items.length;
  const item = items[i];

  const go = useCallback((d: number) => setI((cur) => (cur + d + count) % count), [count]);

  // YouTube reports "ended" (playerState 0) by postMessage once the iframe is told we are listening.
  useEffect(() => {
    if (item.kind !== "youtube" || count < 2) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== frame.current?.contentWindow || typeof e.data !== "string") return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "onStateChange" ? msg.info === 0 : msg.info?.playerState === 0) go(1);
      } catch { /* not a player message */ }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [item.kind, count, go, i]);

  const single = count === 1;
  const autoplay = reduced ? 0 : 1;
  return (
    <div role="group" aria-roledescription="carousel" aria-label="What's new" className="bg-black">
      <div className="relative mx-auto aspect-video max-h-[calc(100svh-6rem)] w-full">
        {item.kind === "youtube" && item.youtubeId ? (
          <iframe
            key={item.youtubeId} ref={frame} title={item.caption ?? "BOM video"}
            src={`${YT_ORIGIN}/embed/${item.youtubeId}?autoplay=${autoplay}&mute=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}${single ? `&loop=1&playlist=${item.youtubeId}` : ""}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="size-full"
            onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), YT_ORIGIN)}
          />
        ) : item.path ? (
          <video
            key={item.path} src={mediaUrl(item.path)} muted playsInline autoPlay={!reduced} loop={single} controls={reduced}
            preload="metadata" aria-label={item.caption ?? "BOM video"} className="size-full object-contain" onEnded={() => !single && go(1)}
          />
        ) : null}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous video" className="absolute top-1/2 left-2 -translate-y-1/2 rounded bg-black/50 p-2 hover:bg-black/80"><ChevronLeft /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next video" className="absolute top-1/2 right-2 -translate-y-1/2 rounded bg-black/50 p-2 hover:bg-black/80"><ChevronRight /></button>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="font-display text-lg font-extrabold italic uppercase">{item.caption ?? ""}</p>
        {count > 1 && (
          <div className="flex gap-2">
            {items.map((m, n) => (
              <button key={m.youtubeId ?? m.path ?? n} type="button" onClick={() => setI(n)} aria-label={`Video ${n + 1}`} aria-current={n === i}
                className={`h-1.5 w-8 rounded-sm ${n === i ? "bg-primary" : "bg-white/40 hover:bg-white/70"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
