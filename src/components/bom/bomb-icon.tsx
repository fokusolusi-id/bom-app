import { cn } from "@/lib/utils";

export type BombLevel = 1 | 2 | 3 | 4 | 5;

// Spark rays around the fuse tip at (19, 5); level 3 shows the first three, level 4+ all of them.
const RAYS = ["M19 .8v1.5", "M22 2l-1.1 1.1", "M23.2 5h-1.5", "M16 2l1.1 1.1", "M22 8l-1.1-1.1"];
const BURST = "M10 4.2L12.3 7L15.8 6.1L16 9.7L19.3 11L17.4 14L19.3 17L16 18.3L15.8 21.9L12.3 21L10 23.8L7.7 21L4.2 21.9L4 18.3L.7 17L2.6 14L.7 11L4 9.7L4.2 6.1L7.7 7Z";

/**
 * Bomb that escalates with impact, lucide-style (24px grid, currentColor stroke):
 * 1 unlit, 2 lit spark, 3 sparks flying, 4 charged body, 5 full explosion.
 */
export function BombIcon({ level, className }: { level: BombLevel; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-4 shrink-0", className)}>
      {level === 5 && <path d={BURST} strokeWidth={1.5} />}
      <circle cx="10" cy="14" r="7" fill={level >= 4 ? "currentColor" : "none"} fillOpacity={level === 5 ? 1 : 0.35} />
      {level < 5 && <path d="M7 12a3.5 3.5 0 0 1 2-2" />}
      <path d="M15 9l2.5-2.5M14 8l2 2" />
      {level >= 2 && <circle cx="19" cy="5" r="1.2" fill="currentColor" stroke="none" />}
      {level >= 3 && RAYS.slice(0, level === 3 ? 3 : RAYS.length).map((d) => <path key={d} d={d} strokeWidth={1.5} />)}
    </svg>
  );
}
