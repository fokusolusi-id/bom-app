import { ArrowLeft, Crown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MemberCard } from "@/components/bom/member-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PointsChart } from "@/components/bom/points-chart";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { TierMark } from "@/components/bom/tier-mark";
import { formatBomId, normalizeBomId } from "@/domain/profile";
import type { Tier } from "@/domain/tier";
import { SITE_URL } from "@/lib/venue";
import { qrDataUrl } from "@/server/qr";
import { publicPlayers } from "@/server/players";
import { publicPlayerHistory } from "@/server/standings";
import { BomIdBadge } from "@/components/bom/bom-id-badge";

export const revalidate = 60;

type Props = { params: Promise<{ bomId: string }> };

const sinceFmt = new Intl.DateTimeFormat("en-GB", { month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" });
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const fmt = (iso: string) => (iso ? date.format(new Date(iso)) : "-");

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
  const [history, rank] = await Promise.all([publicPlayerHistory(playerId), repo.rank(Number(player.points))]);
  const places = history.flatMap((h) => (h.place === null ? [] : [h.place]));
  const trophies = history.filter((h) => h.tigerKing).length;
  const stats = [
    ["Total points", Number(player.points)],
    ["Rank", `#${rank}`],
    ["Events played", history.length],
    ["Best place", places.length ? `#${Math.min(...places)}` : "–"],
    ["Wins (1st)", places.filter((p) => p === 1).length],
    ["Trophies", trophies],
  ] as const;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="py-4">
              <div className="text-muted-foreground text-xs uppercase">{label}</div>
              <div className="font-num tabular text-primary flex items-center gap-1.5 text-3xl font-black italic">{value}{label === "Trophies" && <Crown className="size-6 text-yellow-400" aria-hidden />}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Points history</CardTitle></CardHeader>
          <CardContent><PointsChart rows={history} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Tournament results</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-muted-foreground text-sm">No tournament results yet.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Players</TableHead><TableHead className="text-right">Place</TableHead><TableHead className="text-right">Points</TableHead></TableRow></TableHeader>
              <TableBody>
                {[...history].reverse().map((h) => (
                  <TableRow key={h.eventId}>
                    <TableCell className="font-bold">{h.name}{h.tigerKing && <Crown className="ml-2 inline size-4 align-text-bottom text-yellow-400" aria-label="Tiger King" />}</TableCell>
                    <TableCell><TierMark tier={h.tier as Tier} /></TableCell>
                    <TableCell>{fmt(h.startsAt)}</TableCell>
                    <TableCell className="font-num tabular text-muted-foreground text-right">{h.participants}</TableCell>
                    <TableCell className="font-num tabular text-primary text-right text-xl font-black italic">{h.place === null ? <span className="text-muted-foreground text-base font-normal not-italic">Played</span> : `#${h.place}`}</TableCell>
                    <TableCell className="font-num tabular text-right font-bold">+{h.points}</TableCell>
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
