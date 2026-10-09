import { formatBomId } from "@/domain/profile";
import { TIERS } from "@/domain/tier";
import { supabaseMatches } from "@/server/matches";
import { supabasePlayers } from "@/server/players";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { TierBadge } from "@/components/bom/tier-badge";
import { requireAdmin } from "@/server/admin-session";
import { ActionForm } from "@/components/form/action-form";
import { bumpScore, createMatch, finishMatch } from "./actions";
import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";

export const metadata = { title: "Admin | BOM" };

export default async function AdminMatchPage() {
  const supabase = await requireAdmin();
  const [matches, players] = await Promise.all([supabaseMatches(supabase).listOpen(), supabasePlayers(supabase).list(1000, { includeRegistered: true })]);

  return (
    <AdminPage title="Match" hint="Mulai match, atur skor, lalu selesaikan untuk memberi poin.">
      <AddCard title="Match baru">
          <ActionForm action={createMatch} resetOnSuccess className="grid gap-3 sm:grid-cols-2">
            <NativeSelect name="a_id" aria-label="Blader A" required defaultValue=""><option value="" disabled>Blader A</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name} {formatBomId(p.bom_id)}</option>)}</NativeSelect>
            <NativeSelect name="b_id" aria-label="Blader B" required defaultValue=""><option value="" disabled>Blader B</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name} {formatBomId(p.bom_id)}</option>)}</NativeSelect>
            <NativeSelect name="tier" aria-label="Tier">{TIERS.map((t) => <option key={t}>{t}</option>)}</NativeSelect>
            <Input name="round" maxLength={40} placeholder="Round (mis. Semifinal)" aria-label="Round" />
            <Input name="stadium" maxLength={40} placeholder="Stadium 1" aria-label="Stadium" />
            <Input name="target" type="number" min={1} max={10} defaultValue={4} aria-label="Target poin" />
            <Button type="submit" className="sm:col-span-2">Mulai match (live)</Button>
          </ActionForm>
      </AddCard>

      <ItemGrid>
      {matches.map((m) => (
        <Card key={m.id}>
          <CardHeader><CardTitle className="flex items-center gap-3"><TierBadge tier={m.tier} />{m.round} &middot; {m.stadium}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(["a", "b"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <span className="font-display text-xl font-extrabold italic uppercase">{s === "a" ? m.a_name : m.b_name}</span>
                <div className="flex items-center gap-3">
                  <ActionForm action={bumpScore.bind(null, m.id, s, -1)}><Button variant="secondary" size="sm">-1</Button></ActionForm>
                  <span className="font-display tabular w-10 text-center text-4xl font-black italic">{s === "a" ? m.a_score : m.b_score}</span>
                  <ActionForm action={bumpScore.bind(null, m.id, s, 1)}><Button size="sm">+1</Button></ActionForm>
                </div>
              </div>
            ))}
            <ActionForm action={finishMatch.bind(null, m.id)}><Button variant="outline" className="w-full">Selesai &amp; beri poin</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
      </ItemGrid>
    </AdminPage>
  );
}
