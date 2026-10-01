import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/bom/tier-badge";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import type { Match } from "@/lib/data";
import { bumpScore, createMatch, finishMatch } from "./actions";

export const metadata = { title: "Admin | BOM" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasSupabase()) {
    return <main className="mx-auto max-w-xl px-4 py-16"><p className="text-muted-foreground">Set env Supabase dulu (lihat README).</p></main>;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return <main className="mx-auto max-w-xl px-4 py-16"><p>Akun ini belum terdaftar sebagai admin. Tambahkan ke tabel admins.</p></main>;

  const { data } = await supabase.from("matches").select("*").neq("status", "finished").order("created_at", { ascending: false });
  const matches = (data as Match[]) ?? [];
  const field = "bg-input rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Card>
        <CardHeader><CardTitle>Match baru</CardTitle></CardHeader>
        <CardContent>
          <form action={createMatch} className="grid gap-3 sm:grid-cols-2">
            <input name="a_name" placeholder="Blader A" className={field} required />
            <input name="b_name" placeholder="Blader B" className={field} required />
            <select name="tier" className={field}><option>Ranked</option><option>Cup</option><option>Major</option><option>Championship</option></select>
            <input name="round" placeholder="Round (mis. Semifinal)" className={field} />
            <input name="stadium" placeholder="Stadium 1" className={field} />
            <input name="target" type="number" defaultValue={4} className={field} />
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
