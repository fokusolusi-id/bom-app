import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { tierMultiplier } from "@/domain/scoring";
import type { TierLabel } from "@/domain/tier";
import { competitionPath } from "@/lib/content";
import { cn } from "@/lib/utils";

// Tile and title colours follow the design system's palette. The Major icon is black art, so it sits on an orange tile.
// Cup uses a dark green that matches the grenade icon (#2f8a14), darker than the design system's win green.
const looks: Record<TierLabel, { icon: string; edge: string; ground: string; title: string }> = {
  Unrank: { icon: "0-bom-unrank", edge: "bg-[var(--bom-fur)]", ground: "bg-[var(--bom-surface-2)]", title: "text-[var(--bom-fur-light)]" },
  Ranked: { icon: "1-bom-rank", edge: "bg-white", ground: "bg-[var(--bom-surface-2)]", title: "text-white" },
  Cup: { icon: "2-bom-cup", edge: "bg-[#2f8a14]", ground: "bg-[var(--bom-surface-2)]", title: "text-[#2f8a14]" },
  Major: { icon: "3-bom-major", edge: "bg-white", ground: "bg-[var(--bom-orange)]", title: "text-[var(--bom-orange)]" },
  Championship: { icon: "4-bomb-championship", edge: "bg-white", ground: "bg-[var(--bom-loss)]", title: "text-[var(--bom-loss)]" },
};

/** What a match is worth at this level, from the scoring rules so the page cannot drift from the leaderboard. */
function pointsText(tier: TierLabel): string {
  return tier === "Unrank" ? "No points awarded." : `Winner gets ${tierMultiplier(tier)}x points.`;
}

/**
 * The competition ladder with its bomb icons, in one row from md up: Unrank → Ranked → Cup → Major → Championship.
 * Each arrow is centred in the space between two tiles. `details={false}` drops the bullet lists (homepage). "BOM" sits above the tier name; text scales with the column width.
 */
export function CompetitionLadder({ details = true }: { details?: boolean }) {
  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-8 md:flex md:items-start md:gap-0">
      {competitionPath.map(([tier, freq, bullets], i) => {
        const look = looks[tier];
        return (
          <li key={tier} className="@container flex min-w-0 flex-col gap-4 md:flex-1">
            <div className="flex items-center">
              <div className={cn("chamfer-lg aspect-square w-24 shrink-0 p-[3px]", look.edge)}>
                <div className={cn("chamfer-lg grid size-full place-items-center overflow-hidden", look.ground)}>
                  <Image src={`/competition-path/${look.icon}.png`} alt="" width={96} height={96} className="size-full scale-[1.1] object-contain" />
                </div>
              </div>
              {i < competitionPath.length - 1 && (
                <div className="hidden flex-1 justify-center md:flex"><ArrowRight className="text-primary size-5" aria-hidden /></div>
              )}
            </div>
            <div className="space-y-2 md:pr-3">
              <h3 className="font-display leading-none font-black italic uppercase">
                <span className="text-primary font-label block text-[clamp(1rem,10cqw,1.5rem)] font-bold tracking-[0.08em]">BOM</span>
                <span className={cn("block text-[clamp(1.1rem,12.5cqw,2.25rem)]", look.title)}>{tier}</span>
              </h3>
              <p className="font-label text-[clamp(0.8rem,7cqw,1.125rem)] font-bold tracking-[0.08em] text-white uppercase italic">{freq}</p>
              {details && (
                <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-[clamp(0.8rem,6.5cqw,1rem)] marker:text-primary">
                  {bullets.map((b) => <li key={b}>{b}</li>)}
                  {tier === "Unrank" && <li>Check the <Link href="/schedule" className="text-primary underline">schedule</Link> for the next date.</li>}
                  <li className="font-bold text-white">{pointsText(tier)}</li>
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
