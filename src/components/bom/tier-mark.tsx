import type { EventType } from "@/domain/event";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { cn } from "@/lib/utils";
import { TIER_TILE, TierTile } from "./tier-tile";

/** A competition type as it appears everywhere: its tile, and its name in the level's colour ("BOM RANKED"). */
export function TierMark({ tier, tileClassName = "size-10", className }: { tier: EventType; tileClassName?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <TierTile tier={tier} className={tileClassName} />
      <span className={cn("font-label font-bold tracking-[0.08em] uppercase italic", TIER_TILE[tier].title)}>{EVENT_TYPE_LABEL(tier)}</span>
    </span>
  );
}
