import { Card, CardContent } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { TierBadge } from "@/components/bom/tier-badge";
import { path, tiers } from "@/lib/content";

export const metadata = { title: "Kompetisi | BOM" };

export default function KompetisiPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Jenjang Kompetisi</RibbonBanner>
      <div className="mt-6 grid gap-3">
        {tiers.map(({ tier, freq, desc }) => (
          <Card key={tier}>
            <CardContent className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:gap-6">
              <div className="flex items-center gap-3 md:w-72">
                {tier === "Casual / Try" ? <span className="border-border rounded border px-2 py-0.5 text-xs font-semibold">Casual / Try</span> : <TierBadge tier={tier} />}
                <span className="text-primary text-sm font-bold uppercase">{freq}</span>
              </div>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16">
        <RibbonBanner>Jalur ke Panggung Resmi</RibbonBanner>
        <p className="text-muted-foreground mt-4 max-w-xl text-sm">Dari Medan sampai Jepang. Oranye dijalankan BOM, abu-abu dijalankan ekosistem resmi.</p>
        <ol className="mt-6 grid gap-3 md:grid-cols-5">
          {path.map(([name, where, bom], i) => (
            <li key={name} className={`rounded border p-4 ${bom ? "border-primary" : "border-border opacity-70"}`}>
              <div className="text-muted-foreground text-xs">{i + 1}</div>
              <div className={`font-display font-extrabold italic uppercase ${bom ? "text-primary" : ""}`}>{name}</div>
              <div className="text-muted-foreground text-sm">{where}</div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
