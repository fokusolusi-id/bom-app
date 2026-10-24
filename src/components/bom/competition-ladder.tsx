import Link from "next/link";
import { tierMultiplier } from "@/domain/scoring";
import { TIER_INFO, TIER_NAME, type TierLabel } from "@/domain/tier";
import { EVENT_STYLE } from "@/lib/event-style";
import { cn } from "@/lib/utils";
import { TIER_TILE, TierTile } from "./tier-tile";

/** BK4 Unrank first, up to BK1 Championship. */
const LEVELS = ["Unrank", "Ranked", "Major", "Championship"] as const satisfies readonly TierLabel[];
/** Height of the coloured top of a ticket; the notches and the perforation sit right under it. */
const TOP = "10.5rem";
const NOTCH = "0.7rem";
const notch = (side: "left" | "right") => `radial-gradient(circle ${NOTCH} at ${side === "left" ? "0" : "100%"} ${TOP}, #0000 98%, #000) ${side} / 51% 100% no-repeat`;
const TICKET_MASK = { WebkitMask: `${notch("left")}, ${notch("right")}`, mask: `${notch("left")}, ${notch("right")}` };

/**
 * The competition levels as entry tickets: a coloured top with the big BK code, the tier name and its tile, a perforation with a notch
 * on each side, and a dark stub with the "For ..." line and the points. `details` adds the tagline and the full "Kompetisi Level"
 * name (Schedule).
 */
export function CompetitionLadder({ details = true, bullets: showBullets = true, scheduleLink = true }: { details?: boolean; bullets?: boolean; scheduleLink?: boolean }) {
  return (
    <ol aria-label="Competition levels" className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {LEVELS.map((tier) => {
        const style = EVENT_STYLE[tier];
        const info = TIER_INFO[tier];
        // Ranked is a dark ticket, so its code and name take the brand orange.
        const accent = tier === "Ranked" ? "text-[var(--bom-orange)]" : "";
        return (
          <li key={tier} className="bg-card flex flex-col rounded-xl" style={TICKET_MASK}>
            <div className={cn("relative flex flex-col justify-between rounded-t-xl p-4", style.bg, style.ink)} style={{ height: TOP }}>
              <TierTile tier={tier} className="absolute top-3 right-3 size-14" />
              <div className="font-num tabular absolute right-3 bottom-3 hidden xl:block rounded-md bg-black/35 px-2 py-1 text-right leading-none text-white">
                <span className="text-xl font-black italic">{tier === "Unrank" ? 0 : `${tierMultiplier(tier)}x`}</span>{" "}
                <span className="text-[0.65rem]">points</span>
              </div>
              <div className="pr-14">
                <div className={cn("font-label text-[0.65rem] font-bold tracking-[0.12em] uppercase italic", style.soft)}>Beyblade of Medan</div>
                <div className={cn("font-label text-[0.65rem] font-bold tracking-[0.12em] uppercase italic", style.soft)}>Kompetisi Level {info.code.replace("BK", "")}</div>
              </div>
              <div>
                <div className={cn("font-display text-5xl leading-none font-black tracking-tight italic xl:text-6xl", accent)}>{info.code}</div>
                <div className={cn("font-display mt-1 text-lg leading-none font-black italic uppercase", accent)}>{TIER_NAME[tier]}</div>
              </div>
            </div>
            <div aria-hidden className="mx-4 border-t-2 border-dashed border-white/25" />
            <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
              <p className={cn("font-label text-sm font-bold tracking-[0.08em] uppercase italic", TIER_TILE[tier].title)}>{info.audience}</p>
              {/* Under 1280px the cards are narrow, so the points sit here instead of in the corner of the top. */}
              <div className="font-num tabular text-2xl leading-none font-black italic xl:hidden">
                {tier === "Unrank" ? 0 : `${tierMultiplier(tier)}x`} <span className="text-muted-foreground text-sm font-normal not-italic">points</span>
              </div>
              {details && showBullets && (
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>{info.tagline}</p>
                  <p className="text-xs">{info.name}</p>
                  {tier === "Unrank" && scheduleLink && <p>Check the <Link href="/schedule" className="text-primary underline">schedule</Link> for the next date.</p>}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
