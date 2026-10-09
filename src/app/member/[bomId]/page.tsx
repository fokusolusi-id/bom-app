import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PointsChart } from "@/components/bom/points-chart";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { TierBadge } from "@/components/bom/tier-badge";
import { formatBomId, matchHistory, normalizeBomId, pointsSeries, winRate, type Result } from "@/domain/profile";
import { publicMatchHistory } from "@/server/matches";
import { publicPlayers } from "@/server/players";
import { publicPlacements } from "@/server/tournaments";
import { BomIdBadge } from "@/components/bom/bom-id-badge";

export const revalidate = 60;

type Props = { params: Promise<{ bomId: string }> };

const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const fmt = (iso: string) => (iso ? date.format(new Date(iso)) : "-");

const resultStyle: Record<Result, string> = { win: "text-success", loss: "text-destructive", draw: "text-muted-foreground" };
const resultLabel: Record<Result, string> = { win: "Menang", loss: "Kalah", draw: "Seri" };

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
  const [matches, placements, rank] = await Promise.all([
    playerId ? publicMatchHistory().listFinishedForPlayer(playerId) : [],
    playerId ? publicPlacements().placementsForPlayer(playerId) : [],
    repo.rank(player.points),
  ]);
  const history = matchHistory(matches, playerId);
  const series = [{ at: "", points: 0 }, ...pointsSeries(matches, playerId)];
  const stats = [
    ["Poin", player.points],
    ["Peringkat", `#${rank}`],
    ["Menang", player.wins],
    ["Kalah", player.losses],
    ["Win rate", `${winRate(player.wins, player.losses)}%`],
  ] as const;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <RibbonBanner>Profil Member</RibbonBanner>
      <div className="flex items-center gap-4">
        <Avatar className="size-16"><AvatarFallback className="text-2xl">{player.name[0]}</AvatarFallback></Avatar>
        <div>
          <h1 className="text-4xl leading-none">{player.name}</h1>
          <BomIdBadge id={player.bom_id} className="mt-2" />
        </div>
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
        <CardHeader><CardTitle>Grafik poin</CardTitle></CardHeader>
        <CardContent><PointsChart series={series} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Turnamen</CardTitle></CardHeader>
        <CardContent>
          {placements.length === 0 ? <p className="text-muted-foreground text-sm">Belum ada hasil turnamen.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Turnamen</TableHead><TableHead>Tier</TableHead><TableHead>Tanggal</TableHead><TableHead className="text-right">Posisi</TableHead></TableRow></TableHeader>
              <TableBody>
                {placements.map((p) => (
                  <TableRow key={p.tournament.id}>
                    <TableCell className="font-bold">{p.tournament.name}</TableCell>
                    <TableCell><TierBadge tier={p.tournament.tier} className="w-auto" /></TableCell>
                    <TableCell>{fmt(p.tournament.held_on)}</TableCell>
                    <TableCell className="font-num tabular text-primary text-right text-xl font-black italic">#{p.place}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Riwayat match</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-muted-foreground text-sm">Belum ada match selesai.</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead><TableHead>Tier</TableHead><TableHead>Lawan</TableHead>
                  <TableHead className="text-right">Skor</TableHead><TableHead>Hasil</TableHead><TableHead>Combo</TableHead>
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
      {!live && <p className="text-muted-foreground text-xs">Data contoh. Set NEXT_PUBLIC_SUPABASE_URL untuk data asli.</p>}
    </main>
  );
}
