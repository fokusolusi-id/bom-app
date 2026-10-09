import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MemberCard } from "@/components/bom/member-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PointsChart } from "@/components/bom/points-chart";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { TierBadge } from "@/components/bom/tier-badge";
import { formatBomId, matchHistory, normalizeBomId, pointsSeries, winRate, type Result } from "@/domain/profile";
import { publicMatchHistory } from "@/server/matches";
import { SITE_URL } from "@/lib/venue";
import { qrDataUrl } from "@/server/qr";
import { publicPlayers } from "@/server/players";
import { publicResults } from "@/server/results";
import { BomIdBadge } from "@/components/bom/bom-id-badge";

export const revalidate = 60;

type Props = { params: Promise<{ bomId: string }> };

const sinceFmt = new Intl.DateTimeFormat("en-GB", { month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" });
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const fmt = (iso: string) => (iso ? date.format(new Date(iso)) : "-");

const resultStyle: Record<Result, string> = { win: "text-success", loss: "text-destructive", draw: "text-muted-foreground" };
const resultLabel: Record<Result, string> = { win: "Win", loss: "Loss", draw: "Draw" };

async function loadPlayer(raw: string) {
  const id = normalizeBomId(decodeURIComponent(raw));
  if (!id) return null;
  return publicPlayers().repo.getByBomId(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await loadPlayer((await params).bomId);
  return { title: player ? `${player.name} ${formatBomId(player.bom_id)} | BOM` : "Member | BOM" };
}

export default async function MemberPage({ params }: Props) {
  const { bomId } = await params;
  const { repo, live } = publicPlayers();
  const player = await loadPlayer(bomId);
  if (!player) notFound();
  const playerId = player.id ?? "";
  // One canonical URL per member: /member/bom-001.
  const canonical = player.bom_id.toLowerCase();
  if (decodeURIComponent(bomId) !== canonical) permanentRedirect(`/member/${canonical}`);

  // Sample players (no Supabase) have no id and no history.
  const qr = await qrDataUrl(`${SITE_URL}/member/${canonical}`);
  const since = player.created_at ? sinceFmt.format(new Date(player.created_at)).replace("/", ".") : "-";
  const [matches, placements, rank] = await Promise.all([
    playerId ? publicMatchHistory().listFinishedForPlayer(playerId) : [],
    playerId ? publicResults().placementsForPlayer(playerId) : [],
    repo.rank(player.points),
  ]);
  const history = matchHistory(matches, playerId);
  const series = [{ at: "", points: 0 }, ...pointsSeries(matches, playerId)];
  const stats = [
    ["Points", player.points],
    ["Rank", `#${rank}`],
    ["Wins", player.wins],
    ["Losses", player.losses],
    ["Win rate", `${winRate(player.wins, player.losses)}%`],
  ] as const;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_26rem]">
        <div className="space-y-5">
          <div className="space-y-3">
            <Link href="/leaderboard" className="text-muted-foreground hover:text-primary flex w-fit items-center gap-1 text-sm"><ArrowLeft className="size-4" aria-hidden />Back to leaderboard</Link>
            <RibbonBanner>Member profile</RibbonBanner>
          </div>
          <div>
            <h1 className="text-4xl leading-none">{player.name}</h1>
            <BomIdBadge id={player.bom_id} className="mt-2" />
          </div>
        </div>
        <MemberCard bomId={player.bom_id} bladerName={player.name} since={since} qr={qr} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="py-4">
              <div className="text-muted-foreground text-xs uppercase">{label}</div>
              <div className="font-num tabular text-primary text-3xl font-black italic">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Points chart</CardTitle></CardHeader>
        <CardContent><PointsChart series={series} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tournament results</CardTitle></CardHeader>
        <CardContent>
          {placements.length === 0 ? <p className="text-muted-foreground text-sm">No tournament results yet.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Tier</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Place</TableHead></TableRow></TableHeader>
              <TableBody>
                {placements.map((p) => (
                  <TableRow key={p.event.id}>
                    <TableCell className="font-bold">{p.event.name}</TableCell>
                    <TableCell><TierBadge tier={p.event.tier} className="w-auto" /></TableCell>
                    <TableCell>{fmt(p.event.starts_at)}</TableCell>
                    <TableCell className="font-num tabular text-primary text-right text-xl font-black italic">#{p.place}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Match history</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-muted-foreground text-sm">No finished matches yet.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Tier</TableHead><TableHead>Opponent</TableHead>
                  <TableHead className="text-right">Score</TableHead><TableHead>Result</TableHead><TableHead>Combo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{fmt(m.at)}</TableCell>
                    <TableCell><TierBadge tier={m.tier} className="w-auto" /><div className="text-muted-foreground mt-1 text-xs">{m.round}</div></TableCell>
                    <TableCell className="font-bold">{m.opponent}</TableCell>
                    <TableCell className="font-num tabular text-right">{m.score}-{m.opponentScore}</TableCell>
                    <TableCell className={`font-bold ${resultStyle[m.result]}`}>{resultLabel[m.result]}</TableCell>
                    <TableCell className="text-xs">
                      <div>{m.combo ?? "-"}</div>
                      <div className="text-muted-foreground">vs {m.opponentCombo ?? "-"}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {!live && <p className="text-muted-foreground text-xs">Sample data. Set NEXT_PUBLIC_SUPABASE_URL for real data.</p>}
    </main>
  );
}
