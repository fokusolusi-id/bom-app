import Link from "next/link";
import { LeaderboardTable } from "@/components/bom/leaderboard-table";
import { PointsTable } from "@/components/bom/points-table";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { Button } from "@/components/ui/button";
import { publicPlayers } from "@/server/players";
import { publicPointsTable } from "@/server/settings";

export const metadata = { title: "Leaderboard | BOM" };
export const revalidate = 30;

const prizes = [
  ["Top 25 (page 1)", "Draft Pick Prize"],
  ["Tiger Elder", "the player with the most appearances (admins excluded)"],
  ["Tiger Supreme King", "the player with the most Tiger King badges"],
] as const;

export default async function LeaderboardPage() {
  const { repo, live } = publicPlayers();
  const [players, pointsTable] = await Promise.all([repo.list(100), publicPointsTable()]);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <RibbonBanner>BOM Leaderboard Season 2026</RibbonBanner>

      <section aria-labelledby="prizes" className="border-primary mt-8 space-y-3 border-t-[3px] pt-4">
        <h2 id="prizes" className="text-2xl">Season 2026 prizes</h2>
        <p className="text-muted-foreground">The Season 2026 prizes will be awarded to:</p>
        <ul className="list-disc space-y-1 pl-5 marker:text-primary">
          {prizes.map(([who, what]) => (
            <li key={who}><strong className="font-display text-primary italic uppercase">{who}</strong>: {what}</li>
          ))}
        </ul>
        <p className="flex flex-wrap items-center gap-3 pt-1">
          <span>Join our membership to be listed on the leaderboard.</span>
          <Button size="sm" asChild><Link href="/membership">Join membership</Link></Button>
        </p>
      </section>

      <LeaderboardTable players={players.map(({ bom_id, name, points }) => ({ bom_id, name, points }))} />
      <PointsTable table={pointsTable} />
      {!live && <p className="text-muted-foreground mt-3 text-xs">Sample data. Set NEXT_PUBLIC_SUPABASE_URL for real data.</p>}
    </main>
  );
}
