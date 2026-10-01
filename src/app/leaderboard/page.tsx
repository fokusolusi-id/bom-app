import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { mockPlayers, type Player } from "@/lib/data";
import { createClient, hasSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Leaderboard | BOM" };
export const revalidate = 30;

async function getPlayers(): Promise<{ players: Player[]; live: boolean }> {
  if (!hasSupabase()) return { players: mockPlayers, live: false };
  const supabase = await createClient();
  const { data } = await supabase.from("players").select("*").order("points", { ascending: false }).limit(100);
  return { players: (data as Player[]) ?? [], live: true };
}

export default async function LeaderboardPage() {
  const { players, live } = await getPlayers();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <RibbonBanner>Season 1 Leaderboard</RibbonBanner>
      <div className="bg-card mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead><TableHead>Blader</TableHead>
              <TableHead className="text-right">W</TableHead><TableHead className="text-right">L</TableHead><TableHead className="text-right">Poin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p, i) => (
              <TableRow key={p.bom_id}>
                <TableCell className="font-display tabular text-primary text-2xl font-black italic">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback>{p.name[0]}</AvatarFallback></Avatar>
                    <div><div className="font-bold">{p.name}</div><Badge variant="secondary">{p.bom_id}</Badge></div>
                  </div>
                </TableCell>
                <TableCell className="tabular text-success text-right">{p.wins}</TableCell>
                <TableCell className="tabular text-destructive text-right">{p.losses}</TableCell>
                <TableCell className="font-display tabular text-right text-xl font-black italic">{p.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!live && <p className="text-muted-foreground mt-3 text-xs">Data contoh. Set NEXT_PUBLIC_SUPABASE_URL untuk data asli.</p>}
    </main>
  );
}
