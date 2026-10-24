import { BadgePercent, Check, Gift, ImageIcon, Mail, Megaphone, MapPin, Presentation, Trophy, Users, type LucideIcon } from "lucide-react";
import { TiktokIcon } from "@/components/bom/brand-icons";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { Card } from "@/components/ui/card";
import { otherIncomeIdeas, sponsorBenefits, sponsorPackages, type BenefitIcon, type SponsorTier } from "@/lib/sponsorship";
import { PARTNER_EMAIL } from "@/lib/venue";
import { PackageSponsors } from "@/components/bom/package-sponsors";
import { publicPackageSponsors } from "@/server/sponsors";

export const metadata = { title: "Sponsorship | Beyblade of Medan" };

const ICONS: Record<BenefitIcon, LucideIcon | typeof TiktokIcon> = {
  trophy: Trophy, booth: Presentation, prize: Gift, people: Users, location: MapPin, tiktok: TiktokIcon, poster: ImageIcon, mention: Megaphone, discount: BadgePercent,
};

/** Gold, Silver and Bronze in their sponsor colours, with dark text on top. */
const TIER_BG: Record<SponsorTier, string> = { Gold: "bg-[var(--bom-sponsor-gold)]", Silver: "bg-[var(--bom-sponsor-silver)]", Bronze: "bg-[var(--bom-sponsor-bronze)]" };

export const revalidate = 60;

export default async function SponsorshipPage() {
  const sponsors = await publicPackageSponsors().list();
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <section className="space-y-4">
        <RibbonBanner>Sponsorship</RibbonBanner>
        <h1 className="text-4xl leading-none md:text-5xl">Partner <span className="text-primary">with us</span></h1>
        <p className="text-muted-foreground max-w-2xl">Put your brand in front of Medan&apos;s Beyblade X community. Get in touch and we will send you the details and prices.</p>
      </section>

      {/* From md up: one table, a column per package. */}
      <div className="hidden overflow-hidden rounded-lg border md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">What each sponsorship package includes</caption>
          <thead>
            <tr>
              <th scope="col" className="text-muted-foreground bg-card w-[46%] p-4 text-xs font-normal uppercase">What you get</th>
              {sponsorPackages.map((p) => (
                <th key={p.tier} scope="col" className={`${TIER_BG[p.tier]} p-4 text-center align-bottom text-black`}>
                  <div className="font-display text-3xl leading-none font-black italic uppercase">{p.tier}</div>
                  <div className="font-label mt-1 text-xs font-bold tracking-[0.08em] uppercase italic">{p.role}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sponsorBenefits.map((b) => {
              const Icon = ICONS[b.icon];
              return (
                <tr key={b.label} className="border-t">
                  <th scope="row" className="bg-card p-4 font-normal">
                    <span className="flex items-center gap-3"><Icon className="text-primary size-5 shrink-0" aria-hidden />{b.label}</span>
                  </th>
                  {sponsorPackages.map((p) => (
                    <td key={p.tier} className="p-4 text-center">
                      {p.tier === b.tier
                        ? <span className={`${TIER_BG[p.tier]} inline-grid size-7 place-items-center rounded-full text-black`}><Check className="size-4" strokeWidth={3} aria-label="Included" /></span>
                        : <span className="text-muted-foreground" aria-label="Not included">–</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="border-t">
              <th scope="row" className="bg-card font-label p-4 text-sm font-bold tracking-[0.08em] uppercase italic">Price</th>
              {sponsorPackages.map((p) => <td key={p.tier} className="font-label p-4 text-center text-sm font-bold tracking-[0.08em] uppercase italic">On request</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* On phones: one card per package, Gold first. */}
      <ul className="space-y-4 md:hidden">
        {sponsorPackages.map((p) => (
          <li key={p.tier} className="overflow-hidden rounded-lg border">
            <div className={`${TIER_BG[p.tier]} p-4 text-black`}>
              <div className="font-display text-4xl leading-none font-black italic uppercase">{p.tier}</div>
              <div className="font-label mt-1 text-sm font-bold tracking-[0.08em] uppercase italic">{p.role}</div>
            </div>
            <ul className="bg-card space-y-3 p-4">
              {sponsorBenefits.filter((b) => b.tier === p.tier).map((b) => {
                const Icon = ICONS[b.icon];
                return <li key={b.label} className="flex items-start gap-3"><Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />{b.label}</li>;
              })}
              <li className="font-label border-t pt-3 text-sm font-bold tracking-[0.08em] uppercase italic">Price on request</li>
            </ul>
          </li>
        ))}
      </ul>

      {sponsors.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-extrabold italic uppercase">Our sponsors</h2>
          <PackageSponsors sponsors={sponsors} />
        </section>
      )}

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
