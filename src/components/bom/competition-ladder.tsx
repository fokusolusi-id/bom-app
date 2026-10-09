import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { tierMultiplier } from "@/domain/scoring";
import type { TierLabel } from "@/domain/tier";
import { competitionPath } from "@/lib/content";
import { cn } from "@/lib/utils";
import { TIER_TILE, TierTile } from "./tier-tile";

/** What a match is worth at this level, from the scoring rules so the page cannot drift from the leaderboard. */
function pointsText(tier: TierLabel): string {
  return tier === "Unrank" ? "No points awarded." : `Winner gets ${tierMultiplier(tier)}x points.`;
}

/**
 * The competition ladder with its bomb icons, in one row from md up: Unrank → Ranked → Cup → Major → Championship.
 * Each arrow is centred in the space between two tiles. `details={false}` drops all text under the frequency (homepage); `bullets={false}` keeps only the points line, without a list (About). "BOM" sits above the tier name; text scales with the column width.
 */
export function CompetitionLadder({ details = true, bullets: showBullets = true, scheduleLink = true }: { details?: boolean; bullets?: boolean; scheduleLink?: boolean }) {
  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-8 md:flex md:items-start md:gap-0">
      {competitionPath.map(([tier, freq, tierBullets], i) => {
        const look = TIER_TILE[tier];
        return (
          <li key={tier} className="@container flex min-w-0 flex-col gap-4 md:flex-1">
            <div className="flex items-center">
              <TierTile tier={tier} className="w-24" />
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
              {details && showBullets && (
                <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-[clamp(0.8rem,6.5cqw,1rem)] marker:text-primary">
                  {tierBullets.map((b) => <li key={b}>{b}</li>)}
                  {tier === "Unrank" && scheduleLink && <li>Check the <Link href="/schedule" className="text-primary underline">schedule</Link> for the next date.</li>}
                  <li className="font-bold text-white">{pointsText(tier)}</li>
                </ul>
              )}
              {details && !showBullets && <p className="text-[clamp(0.8rem,6.5cqw,1rem)] font-bold text-white">{pointsText(tier)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
