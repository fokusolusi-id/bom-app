import { CalendarDays, Mail, MapPin } from "lucide-react";
import { SectionHeading } from "@/components/bom/section-heading";
import { SponsorSlider } from "@/components/bom/sponsor-slider";
import { Button } from "@/components/ui/button";
import { DIRECTIONS_URL, GATHERING_SCHEDULE, PARTNER_EMAIL, VENUE } from "@/lib/venue";
import { publicSponsors } from "@/server/sponsors";

/** "Supported by": the sponsor slider, then how to become a sponsor and where the community gathers. Shared by the homepage and the leaderboard. */
export async function SponsorsSection({ className }: { className?: string }) {
  const sponsors = await publicSponsors().list();
  return (
    <section aria-labelledby="sponsors" className={className}>
      <SectionHeading id="sponsors">Supported by</SectionHeading>
      {sponsors.length > 0 && <SponsorSlider sponsors={sponsors.map((sp) => ({ id: sp.id, name: sp.name, logo: sp.logo_path, website: sp.website }))} />}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-primary space-y-3 border-t-[3px] pt-4">
          <h3 className="font-display text-2xl font-extrabold italic uppercase">For Business inquiries</h3>
          <p className="text-muted-foreground">
            Want to become our sponsor? Put your brand in front of Medan&apos;s Beyblade X community. Get in touch and we will send you our sponsorship options.
          </p>
          <p className="flex items-center gap-2"><Mail className="text-primary size-5 shrink-0" aria-hidden /><a href={`mailto:${PARTNER_EMAIL}`} className="hover:text-primary font-bold underline">{PARTNER_EMAIL}</a></p>
        </div>
        <div className="border-primary space-y-3 border-t-[3px] pt-4">
          <h3 className="font-display text-2xl font-extrabold italic uppercase">Gathering Location</h3>
          <p className="flex items-center gap-2 font-bold"><MapPin className="text-primary size-5 shrink-0" aria-hidden />{VENUE}</p>
          <p className="flex items-center gap-2"><CalendarDays className="text-primary size-5 shrink-0" aria-hidden />{GATHERING_SCHEDULE}</p>
          <Button variant="outline" asChild><a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden />Get Direction</a></Button>
        </div>
      </div>
    </section>
  );
}
