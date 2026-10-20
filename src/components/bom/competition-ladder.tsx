import Link from "next/link";
import { tierMultiplier } from "@/domain/scoring";
import { TIER_INFO, type TierLabel } from "@/domain/tier";
import { EVENT_STYLE } from "@/lib/event-style";
import { cn } from "@/lib/utils";
import { TIER_TILE, TierTile } from "./tier-tile";

/** The highest level first: BK1 Championship down to BK4 Unrank. */
const LEVELS = ["Championship", "Major", "Ranked", "Unrank"] as const satisfies readonly TierLabel[];
/** Height of the coloured top of a ticket; the notches and the perforation sit right under it. */
const TOP = "9.5rem";
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
    <ol aria-label="Competition levels" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {LEVELS.map((tier) => {
        const style = EVENT_STYLE[tier];
        const info = TIER_INFO[tier];
        // Ranked is a dark ticket, so its code and name take the brand orange.
        const accent = tier === "Ranked" ? "text-[var(--bom-orange)]" : "";
        return (
          <li key={tier} className="bg-card flex flex-col rounded-xl" style={TICKET_MASK}>
            <div className={cn("relative flex flex-col justify-between rounded-t-xl p-4", style.bg, style.ink)} style={{ height: TOP }}>
              <TierTile tier={tier} className="absolute top-3 right-3 size-14" />
              <div className="font-num tabular absolute right-3 bottom-3 rounded-md bg-black/35 px-2 py-1 text-right leading-none text-white">
                <span className="text-xl font-black italic">{tier === "Unrank" ? 0 : `${tierMultiplier(tier)}x`}</span>{" "}
                <span className="text-[0.65rem]">points</span>
              </div>
              <div className="pr-14">
                <div className={cn("font-label text-[0.65rem] font-bold tracking-[0.12em] uppercase italic", style.soft)}>Beyblade of Medan</div>
                <div className={cn("font-label text-[0.65rem] font-bold tracking-[0.12em] uppercase italic", style.soft)}>Kompetisi</div>
              </div>
              <div>
                <div className={cn("font-display text-6xl leading-none font-black tracking-tight italic", accent)}>{info.code}</div>
                <div className={cn("font-display mt-1 text-lg leading-none font-black italic uppercase", accent)}>{tier}</div>
              </div>
            </div>
            <div aria-hidden className="mx-4 border-t-2 border-dashed border-white/25" />
            <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
              <p className={cn("font-label text-sm font-bold tracking-[0.08em] uppercase italic", TIER_TILE[tier].title)}>{info.audience}</p>
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
