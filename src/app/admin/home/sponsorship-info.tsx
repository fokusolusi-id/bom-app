import { AdminSection } from "@/components/admin/admin-page";
import { Card } from "@/components/ui/card";
import { otherIncomeIdeas, sponsorPackages } from "@/lib/sponsorship";

/** The sponsor packages with their prices, and other income ideas. Internal: the public Sponsorship page shows the benefits only, with "Price on request". */
export function SponsorshipInfoSection() {
  return (
    <AdminSection id="sponsorship" title="Sponsorship" hint="Internal. The public Sponsorship page shows the benefits only, with the price on request. Do not share the prices or the ideas below publicly.">
      <div className="grid gap-4 md:grid-cols-3">
        {sponsorPackages.map((p) => (
          <Card key={p.tier}>
            <div>
              <div className="font-display text-2xl leading-none font-black italic uppercase">{p.tier} <span className="text-muted-foreground text-sm font-normal not-italic normal-case">{p.role}</span></div>
              <div className="text-primary mt-1 font-bold">{p.price}</div>
            </div>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {p.benefits.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </Card>
        ))}
      </div>
      <div>
        <h3 className="font-display mb-3 text-xl font-extrabold italic uppercase">Other potential</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {otherIncomeIdeas.map((o) => (
            <Card key={o.title}>
              <div className="font-bold">{o.title}</div>
              <p className="text-muted-foreground text-sm">{o.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}
