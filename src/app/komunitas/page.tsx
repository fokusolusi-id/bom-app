import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { subs, umbrella } from "@/lib/content";

export const metadata = { title: "Sub Komunitas | BOM" };

export default function KomunitasPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Sub Komunitas</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">Empat sub komunitas, satu aturan main. Poin dari semua gathering masuk satu leaderboard.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {subs.map(([n, d]) => (
          <Card key={n}><CardHeader><CardTitle>{n}</CardTitle><CardDescription>{d}</CardDescription></CardHeader></Card>
        ))}
      </div>
      <ul className="mt-6 grid gap-2 md:grid-cols-3">
        {umbrella.map((u) => (
          <li key={u} className="border-primary border-l-2 pl-3 text-sm">{u}</li>
        ))}
      </ul>
    </main>
  );
}
