import { tierMultiplier } from "@/domain/scoring";
import { TIERS } from "@/domain/tier";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { TIER_TILE } from "./tier-tile";

/** What each competition level multiplies the table above by. Read from the scoring rules, so it always matches the leaderboard. */
export function PointsMultipliers({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-bold">Points by competition type</p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <li className="bg-card text-muted-foreground rounded-md border px-3 py-2 text-sm">
          <div className="font-label font-bold tracking-[0.08em] uppercase italic">{EVENT_TYPE_LABEL("Unrank")}</div>
          0 points
        </li>
        {TIERS.map((tier) => (
          <li key={tier} className="bg-card rounded-md border px-3 py-2 text-sm">
            <div className={`font-label font-bold tracking-[0.08em] uppercase italic ${TIER_TILE[tier].title}`}>{EVENT_TYPE_LABEL(tier)}</div>
            <span className="font-num tabular text-xl font-black italic">{tierMultiplier(tier)}x</span> <span className="text-muted-foreground">points</span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-2 text-xs">Everything a member earns at an event (participation, place, Top Cut and Tiger King) is multiplied by its competition type. For example, 4.25 points at a BK3 Ranked event is 6.38 at a BK2 Major and 8.5 at a BK1 Championship.</p>
    </div>
  );
}
