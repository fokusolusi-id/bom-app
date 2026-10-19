import { CompetitionLadder } from "./competition-ladder";

/** What each competition level multiplies the table above by: the same level tickets as the homepage, so it always matches the scoring rules. */
export function PointsMultipliers({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="mb-3 text-sm font-bold">Points by competition type</p>
      <CompetitionLadder details={false} />
      <p className="text-muted-foreground mt-3 text-xs">Everything a member earns at an event (participation, place, Top Cut and Tiger King) is multiplied by its competition type. For example, 4.25 points at a BK3 Ranked event is 6.38 at a BK2 Major and 8.5 at a BK1 Championship.</p>
    </div>
  );
}
