import Link from "next/link";
import { LeaderboardTable } from "@/components/bom/leaderboard-table";
import { PointsTable } from "@/components/bom/points-table";
import { SponsorsSection } from "@/components/bom/sponsors-section";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { Button } from "@/components/ui/button";
import { publicPlayers } from "@/server/players";
import { publicPointsTable } from "@/server/settings";
import { publicStandings } from "@/server/standings";

export const metadata = { title: "Leaderboard | BOM" };
export const revalidate = 30;

const prizes = [
  ["Top 25 (page 1)", "Draft Pick Prize"],
  ["Tiger Elder", "the player with the most appearances (admins excluded)"],
  ["Tiger Supreme King", "the player with the most Tiger King badges"],
] as const;

export default async function LeaderboardPage() {
  const { repo, live } = publicPlayers();
  const [players, pointsTable, standings] = await Promise.all([repo.list(100), publicPointsTable(), publicStandings()]);
  const hadEarlierWeeks = [...standings.values()].some((o) => o.previousRank !== null);
  const moveOf = (id?: string): "up" | "down" | "new" | null => {
    const s = id ? standings.get(id) : undefined;
    if (!s || s.week === 0) return null;
    if (s.previousRank === null) return hadEarlierWeeks ? "new" : null;
    return s.rank < s.previousRank ? "up" : s.rank > s.previousRank ? "down" : null;
  };
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>BOM Leaderboard Season 2026</RibbonBanner>

      <section aria-labelledby="prizes" className="border-primary mt-8 space-y-3 border-t-[3px] pt-4">
        <h2 id="prizes" className="text-2xl">Season 2026 prizes</h2>
        <p className="text-muted-foreground">The Season 2026 prizes will be awarded to:</p>
        <ul className="list-disc space-y-1 pl-5 marker:text-primary">
          {prizes.map(([who, what]) => (
            <li key={who}><strong className="font-display text-primary italic uppercase">{who}</strong>: {what}</li>
          ))}
        </ul>
        <p className="flex flex-col items-start gap-3 pt-1">
          <span>Join our membership to be listed on the leaderboard.</span>
          <Button size="sm" asChild><Link href="/membership">Join membership</Link></Button>
        </p>
      </section>

      <LeaderboardTable players={players.map(({ id, bom_id, name, points }) => ({ bom_id, name, points: Number(points), week: id ? standings.get(id)?.week ?? 0 : 0, previous: id ? standings.get(id)?.previousRank ?? null : null, change: id ? Math.abs((standings.get(id)?.previousRank ?? 0) - (standings.get(id)?.rank ?? 0)) : 0, trophies: id ? standings.get(id)?.tigerKings ?? 0 : 0, move: moveOf(id) }))} />
      <PointsTable table={pointsTable} />
      <SponsorsSection className="mt-12" />
      {!live && <p className="text-muted-foreground mt-3 text-xs">Sample data. Set NEXT_PUBLIC_SUPABASE_URL for real data.</p>}
    </main>
  );
}
