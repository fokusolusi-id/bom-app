import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { tierMultiplier } from "@/domain/scoring";
import type { TierLabel } from "@/domain/tier";
import { competitionPath } from "@/lib/content";
import { cn } from "@/lib/utils";
import { TIER_TILE, TierTile } from "./tier-tile";

/** What an event is worth at this level, from the scoring rules so the page cannot drift from the leaderboard. */
function pointsText(tier: TierLabel): string {
  return tier === "Unrank" ? "No points awarded." : `All points count ${tierMultiplier(tier)}x.`;
}

/**
 * The competition ladder with its bomb icons, in one row from md up: Unrank → Ranked → Cup → Major → Championship.
 * Each arrow is centred in the space between two tiles. `details={false}` drops all text under the frequency (homepage); `bullets={false}` keeps only the points line, without a list (About). "BOM" sits above the tier name; text scales with the column width.
 */
export function CompetitionLadder({ details = true, bullets: showBullets = true, scheduleLink = true }: { details?: boolean; bullets?: boolean; scheduleLink?: boolean }) {
  const detail = (tier: TierLabel, tierBullets: readonly string[]) => (
    <>
      {showBullets ? (
        <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-[clamp(0.8rem,6.5cqw,1rem)] marker:text-primary">
          {tierBullets.map((b) => <li key={b}>{b}</li>)}
          {tier === "Unrank" && scheduleLink && <li>Check the <Link href="/schedule" className="text-primary underline">schedule</Link> for the next date.</li>}
          <li className="font-bold text-white">{pointsText(tier)}</li>
        </ul>
      ) : <p className="text-[clamp(0.8rem,6.5cqw,1rem)] font-bold text-white">{pointsText(tier)}</p>}
    </>
  );
  return (
    <>
    {/* Small screens: all five levels in one row with an arrow between each; the text of each level follows below. */}
    <div className="md:hidden">
      <ol aria-label="Competition path" className="flex items-start">
        {competitionPath.map(([tier, freq], i) => (
          <li key={tier} className="flex min-w-0 flex-1 basis-0 flex-col gap-1">
            <div className="flex items-center gap-0.5">
              <div className="min-w-0 flex-1"><TierTile tier={tier} className="w-full" /></div>
              {/* The last tile gets an empty slot of the same width, so all five tiles are the same size. */}
              {i < competitionPath.length - 1 ? <ArrowRight className="text-primary size-3 shrink-0" aria-hidden /> : <span className="size-3 shrink-0" aria-hidden />}
            </div>
            <div className={cn("font-display text-[0.45rem] leading-tight font-black tracking-tighter italic uppercase", TIER_TILE[tier].title)}>{tier}</div>
            <div className="font-label text-[0.45rem] leading-tight font-bold tracking-wide text-white uppercase italic">{freq}</div>
          </li>
        ))}
      </ol>
      {details && (
        <div className="@container mt-6 space-y-5">
          {competitionPath.map(([tier, , tierBullets]) => (
            <div key={tier} className="space-y-2">
              <h3 className="font-display leading-none font-black italic uppercase"><span className="text-primary font-label mr-2 text-base font-bold tracking-[0.08em]">BOM</span><span className={cn("text-2xl", TIER_TILE[tier].title)}>{tier}</span></h3>
              {detail(tier, tierBullets)}
            </div>
          ))}
        </div>
      )}
    </div>
    <ol className="hidden md:flex md:items-start md:gap-0">
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
              {details && detail(tier, tierBullets)}
            </div>
          </li>
        );
      })}
    </ol>
    </>
  );
}
