import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { umbrella } from "@/lib/content";

export const metadata = { title: "Rules | BOM" };

// Official rulebooks. Copy the rules into this page once the committee signs off on the wording.
const rulebooks = [
  { title: "Takara Tomy Regulations", note: "12th Edition, March 2026", href: "https://img1.wsimg.com/blobby/go/b90a29fa-631a-4c1e-b027-1e57d0b85847/BeyBladeXRegulation12thMarch2026.pdf" },
] as const;

export default function RulesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <RibbonBanner>Rules</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">One rulebook and one voice for every judge across all BOM sub communities.</p>

      <ul className="mt-6 grid gap-2 md:grid-cols-3">
        {umbrella.map((u) => <li key={u} className="border-primary border-l-2 pl-3 text-sm">{u}</li>)}
      </ul>

      <section aria-label="Official rulebooks" className="mt-10 space-y-3">
        {rulebooks.map((r) => (
          <Card key={r.href}>
            <CardHeader>
              <CardTitle>{r.title}</CardTitle>
              <CardDescription>{r.note}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild><a href={r.href} target="_blank" rel="noopener noreferrer"><Download aria-hidden />Download PDF</a></Button>
            </CardContent>
          </Card>
        ))}
        <p className="text-muted-foreground text-sm">A summary of the BOM rules (3-on-3 format, finish points, decks and penalties) is coming soon.</p>
      </section>
    </main>
  );
}
