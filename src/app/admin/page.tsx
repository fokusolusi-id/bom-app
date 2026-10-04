import { TIERS } from "@/domain/tier";
import { supabaseMatches } from "@/server/matches";
import { supabasePlayers } from "@/server/players";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/bom/tier-badge";
import { createClient } from "@/lib/supabase/server";
import { bumpScore, createMatch, finishMatch } from "./actions";

export const metadata = { title: "Admin | BOM" };

export default async function AdminPage() {
  const supabase = await createClient();
  const [matches, players] = await Promise.all([supabaseMatches(supabase).listOpen(), supabasePlayers(supabase).list(1000)]);
  const field = "bg-input rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto space-y-6">
      <Card>
        <CardHeader><CardTitle>Match baru</CardTitle></CardHeader>
        <CardContent>
          <form action={createMatch} className="grid gap-3 sm:grid-cols-2">
            <select name="a_id" className={field} required defaultValue=""><option value="" disabled>Blader A</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.bom_id})</option>)}</select>
            <select name="b_id" className={field} required defaultValue=""><option value="" disabled>Blader B</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.bom_id})</option>)}</select>
            <select name="tier" className={field}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select>
            <input name="round" maxLength={40} placeholder="Round (mis. Semifinal)" className={field} />
            <input name="stadium" maxLength={40} placeholder="Stadium 1" className={field} />
            <input name="target" type="number" min={1} max={10} defaultValue={4} className={field} />
            <Button type="submit" className="sm:col-span-2">Mulai match (live)</Button>
          </form>
        </CardContent>
      </Card>

      {matches.map((m) => (
        <Card key={m.id}>
          <CardHeader><CardTitle className="flex items-center gap-3"><TierBadge tier={m.tier} />{m.round} &middot; {m.stadium}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(["a", "b"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <span className="font-display text-xl font-extrabold italic uppercase">{s === "a" ? m.a_name : m.b_name}</span>
                <div className="flex items-center gap-3">
                  <form action={bumpScore.bind(null, m.id, s, -1)}><Button variant="secondary" size="sm">-1</Button></form>
                  <span className="font-display tabular w-10 text-center text-4xl font-black italic">{s === "a" ? m.a_score : m.b_score}</span>
                  <form action={bumpScore.bind(null, m.id, s, 1)}><Button size="sm">+1</Button></form>
                </div>
              </div>
            ))}
            <form action={finishMatch.bind(null, m.id)}><Button variant="outline" className="w-full">Selesai &amp; beri poin</Button></form>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
