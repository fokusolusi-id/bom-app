import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { funnel } from "@/lib/content";

export const metadata = { title: "Mulai dari Nol | BOM" };

export default function MulaiPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Mulai dari Nol</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">Belum punya bey? Tidak masalah. Kompetitif di puncak, ramah di pintu.</p>
      <ol className="mt-6 grid gap-4 md:grid-cols-5">
        {funnel.map(([t, d], i) => (
          <Card key={t}>
            <CardHeader>
              <div className="font-display text-primary text-3xl font-black italic">{i + 1}</div>
              <CardTitle>{t}</CardTitle>
              <CardDescription>{d}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </ol>
    </main>
  );
}
