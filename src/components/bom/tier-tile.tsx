import { Palmtree } from "lucide-react";
import Image from "next/image";
import type { EventType } from "@/domain/event";
import { cn } from "@/lib/utils";

// The chamfered tile of each competition level, as in the competition path. The Major icon is black art, so it sits on
// an orange tile; Championship's white art sits on red. `title` is the colour of the level's name next to the tile.
export const TIER_TILE: Record<EventType, { icon: string | null; edge: string; ground: string; title: string }> = {
  Unrank: { icon: "0-bom-unrank", edge: "bg-[var(--bom-fur)]", ground: "bg-[var(--bom-fur-dark)]", title: "text-[var(--bom-fur-light)]" },
  Ranked: { icon: "1-bom-rank", edge: "bg-white", ground: "bg-[var(--bom-surface-2)]", title: "text-white" },
  Cup: { icon: "2-bom-cup", edge: "bg-white", ground: "bg-[var(--bom-surface-2)]", title: "text-[#2f8a14]" },
  Major: { icon: "3-bom-major", edge: "bg-white", ground: "bg-[var(--bom-orange)]", title: "text-[var(--bom-orange)]" },
  Championship: { icon: "4-bomb-championship", edge: "bg-white", ground: "bg-[var(--bom-loss)]", title: "text-[var(--bom-loss)]" },
  Break: { icon: null, edge: "bg-[var(--bom-fur)]", ground: "bg-[var(--bom-fur-light)]", title: "text-[var(--bom-fur-light)]" },
};

/** Competition icon in its tile. Size comes from `className` (e.g. "size-16"); a break shows a palm tree. */
export function TierTile({ tier, className }: { tier: EventType; className?: string }) {
  const look = TIER_TILE[tier];
  return (
    <div className={cn("chamfer-tile aspect-square shrink-0 p-[3px]", look.edge, className)}>
      <div className={cn("chamfer-tile grid size-full place-items-center overflow-hidden", look.ground)}>
        {look.icon ? (
          <Image src={`/competition-path/${look.icon}.png`} alt="" width={96} height={96} className="size-full scale-[1.1] object-contain" />
        ) : (
          <Palmtree className="size-3/5 text-black" aria-hidden />
        )}
      </div>
    </div>
  );
}
