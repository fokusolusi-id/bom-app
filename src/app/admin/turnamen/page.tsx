import { formatBomId } from "@/domain/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { TierBadge } from "@/components/bom/tier-badge";
import { ActionForm } from "@/components/form/action-form";
import { TIERS } from "@/domain/tier";
import type { Tournament } from "@/domain/types";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseTournaments } from "@/server/tournaments";
import { deleteTournament, removePlacement, saveTournament, setPlacement } from "./actions";

export const metadata = { title: "Turnamen | Admin BOM" };

function TournamentForm({ t }: { t?: Tournament }) {
  return (
    <ActionForm action={saveTournament} resetOnSuccess={!t} className="grid gap-3 sm:grid-cols-2">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      <Input name="name" defaultValue={t?.name} placeholder="Nama turnamen" aria-label="Nama" maxLength={80} required />
      <Input name="held_on" type="date" defaultValue={t?.held_on} aria-label="Tanggal" required />
      <NativeSelect name="tier" aria-label="Tier" defaultValue={t?.tier ?? "Cup"}>{TIERS.map((x) => <option key={x}>{x}</option>)}</NativeSelect>
      <Button type="submit">{t ? "Simpan" : "Tambah"}</Button>
    </ActionForm>
  );
}

export default async function AdminTournamentsPage() {
  const supabase = await requireAdmin();
  const [tournaments, players] = await Promise.all([supabaseTournaments(supabase).list(), supabasePlayers(supabase).list(1000)]);
  const byId = new Map(players.map((p) => [p.id, p]));
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Turnamen baru</CardTitle></CardHeader>
        <CardContent><TournamentForm /></CardContent>
      </Card>
      {tournaments.map((t) => (
        <Card key={t.id}>
          <CardHeader><CardTitle className="flex items-center gap-3"><TierBadge tier={t.tier} className="w-auto" />{t.name}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <TournamentForm t={t} />
            <ul className="space-y-2 text-sm">
              {[...t.placements].sort((a, b) => a.place - b.place).map((pl) => (
                <li key={pl.player_id} className="flex items-center justify-between">
                  <span><span className="text-primary font-bold">#{pl.place}</span> {byId.get(pl.player_id)?.name ?? pl.player_id}</span>
                  <ActionForm action={removePlacement.bind(null, t.id!, pl.player_id)}><Button variant="outline" size="sm">Hapus</Button></ActionForm>
                </li>
              ))}
            </ul>
            <ActionForm action={setPlacement} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_6rem_auto]">
              <input type="hidden" name="tournament_id" value={t.id} />
              <NativeSelect name="player_id" aria-label="Pemain" required defaultValue=""><option value="" disabled>Pemain</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name} {formatBomId(p.bom_id)}</option>)}</NativeSelect>
              <Input name="place" type="number" min={1} max={999} placeholder="Posisi" aria-label="Posisi" required />
              <Button type="submit">Set posisi</Button>
            </ActionForm>
            <ActionForm action={deleteTournament.bind(null, t.id!)}><Button variant="destructive" size="sm">Hapus turnamen</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
