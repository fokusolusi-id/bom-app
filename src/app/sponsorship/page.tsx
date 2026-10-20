import { Mail } from "lucide-react";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { Card } from "@/components/ui/card";
import { otherIncomeIdeas, sponsorPackages } from "@/lib/sponsorship";
import { PARTNER_EMAIL } from "@/lib/venue";

export const metadata = { title: "Sponsorship | Beyblade of Medan" };

/** Background and place on the podium (Silver left, Gold in the middle and tallest, Bronze right; on phones Gold comes first). The rise is added to the normal 1.25rem top padding. */
const TIER_LOOK: Record<string, { bg: string; rise: string; order: string }> = {
  Gold: { bg: "bg-[var(--bom-sponsor-gold)]", rise: "md:pt-[6.25rem]", order: "order-1 md:order-2" },
  Silver: { bg: "bg-[var(--bom-sponsor-silver)]", rise: "md:pt-[3.75rem]", order: "order-2 md:order-1" },
  Bronze: { bg: "bg-[var(--bom-sponsor-bronze)]", rise: "md:pt-5", order: "order-3" },
};

export default function SponsorshipPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <section className="space-y-4">
        <RibbonBanner>Sponsorship</RibbonBanner>
        <h1 className="text-4xl leading-none md:text-5xl">Partner <span className="text-primary">with us</span></h1>
        <p className="text-muted-foreground max-w-2xl">Put your brand in front of Medan&apos;s Beyblade X community. Get in touch and we will send you the details and prices.</p>
      </section>

      <ul className="grid gap-4 md:grid-cols-3 md:items-end">
        {sponsorPackages.map((p) => {
          const look = TIER_LOOK[p.tier];
          return (
            <li key={p.tier} className={look.order}>
              <Card className={`gap-4 border-0 text-black ${look.bg} ${look.rise}`}>
                <div>
                  <div className="font-display text-5xl leading-none font-black italic uppercase">{p.tier}</div>
                  <div className="font-label mt-1 text-sm font-bold tracking-[0.08em] uppercase italic">{p.role}</div>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-black/80 marker:text-black">
                  {p.benefits.map((b) => <li key={b}>{b}</li>)}
                </ul>
                <p className="font-label mt-auto text-sm font-bold tracking-[0.08em] uppercase italic">Price on request</p>
              </Card>
            </li>
          );
        })}
      </ul>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-extrabold italic uppercase">Other ways to work with us</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {otherIncomeIdeas.map((o) => (
            <li key={o.title}>
              <Card className="h-full gap-1">
                <div className="font-bold">{o.title}</div>
                <p className="text-muted-foreground text-sm">{o.offer}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-primary space-y-3 border-t-[3px] pt-4">
        <h2 className="font-display text-2xl font-extrabold italic uppercase">Get in touch</h2>
        <p className="text-muted-foreground max-w-xl">Tell us which package suits you and we will reply with the options and prices.</p>
        <p className="flex items-center gap-2"><Mail className="text-primary size-5 shrink-0" aria-hidden /><a href={`mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent("Sponsorship")}`} className="hover:text-primary font-bold underline">{PARTNER_EMAIL}</a></p>
      </section>
    </main>
  );
}
