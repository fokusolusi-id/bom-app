import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { umbrella } from "@/lib/content";
import { publicRulesPage } from "@/server/settings";

export const metadata = { title: "Rules | BOM" };
export const revalidate = 60;

export default async function RulesPage() {
  const page = await publicRulesPage();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Rules</RibbonBanner>
      {page.intro && <p className="text-muted-foreground mt-4 max-w-xl text-sm">{page.intro}</p>}

      <ul className="mt-6 grid gap-2 md:grid-cols-3">
        {umbrella.map((u) => <li key={u} className="border-primary border-l-2 pl-3 text-sm">{u}</li>)}
      </ul>

      <section aria-label="Official rulebooks" className="mt-10 space-y-3">
        {page.rulebooks.map((r) => (
          <Card key={r.href}>
            <CardHeader>
              <CardTitle>{r.title}</CardTitle>
              {r.note && <CardDescription>{r.note}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <iframe src={`${r.href}#navpanes=0&pagemode=none&view=FitH`} title={r.title} loading="lazy" className="bg-card h-[75vh] w-full rounded-md border" />
              <Button asChild><a href={r.href} target="_blank" rel="noopener noreferrer"><Download aria-hidden />Open or download PDF</a></Button>
            </CardContent>
          </Card>
        ))}
        {page.summary.split(/\n{2,}/).map((para) => <p key={para} className="text-muted-foreground text-sm whitespace-pre-line">{para}</p>)}
      </section>
    </main>
  );
}
