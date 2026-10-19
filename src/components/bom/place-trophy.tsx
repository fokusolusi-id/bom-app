import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE = { 1: "text-yellow-400", 2: "text-neutral-300", 3: "text-amber-600" } as const;

/** A trophy in the colour of the medal for places 1 to 3 (gold, silver, bronze). Nothing for any other place. */
export function PlaceTrophy({ place, className }: { place: number | null; className?: string }) {
  if (place === null || place < 1 || place > 3) return null;
  return <Trophy className={cn("size-5 shrink-0", TONE[place as 1 | 2 | 3], className)} aria-label={`Place ${place}`} />;
}
