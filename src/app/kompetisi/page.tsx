import { Card, CardContent } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { TierBadge } from "@/components/bom/tier-badge";
import { tiers } from "@/lib/content";

export const metadata = { title: "Kompetisi | BOM" };

export default function KompetisiPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Jenjang Kompetisi</RibbonBanner>
      <div className="mt-6 grid gap-3">
        {tiers.map(({ tier, freq, desc }) => (
          <Card key={tier}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center gap-3">
                <TierBadge tier={tier} />
                <span className="text-primary text-sm font-bold uppercase">{freq}</span>
              </div>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
