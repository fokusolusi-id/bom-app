import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { ResultsArchive } from "@/components/bom/results-archive";
import { Card, CardContent } from "@/components/ui/card";
import { latestResults } from "@/server/latest-result";

export const metadata = { title: "Results | Beyblade of Medan" };
export const revalidate = 60;

/** Every past event with its results, newest first. */
export default async function ResultsPage() {
  const results = await latestResults(new Date(), 200);
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <section className="space-y-4">
        <RibbonBanner>Results</RibbonBanner>
        <h1 className="text-4xl leading-none md:text-5xl">Past <span className="text-primary">events</span></h1>
        <p className="text-muted-foreground max-w-2xl">Every tournament and gathering with its results: the winners, the top eight and their winning combos.</p>
      </section>
      {results.length > 0
        ? <ResultsArchive results={results} />
        : <Card><CardContent><p className="text-muted-foreground">Results appear here after the first tournament.</p></CardContent></Card>}
    </main>
  );
}
