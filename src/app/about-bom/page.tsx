import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstagramIcon, WhatsappIcon } from "@/components/bom/brand-icons";
import { MemberCarousel } from "@/components/bom/member-carousel";
import { CompetitionLadder } from "@/components/bom/competition-ladder";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { SubCommunityChart } from "@/components/bom/sub-community-chart";
import { SectionHeading } from "@/components/bom/section-heading";
import { communityStats, umbrella } from "@/lib/content";
import { INSTAGRAM, PARTNER_EMAIL, WHATSAPP_INVITE } from "@/lib/venue";
import { teamStrip } from "@/domain/team";
import { publicTeam } from "@/server/team";
import { publicSubCommunities } from "@/server/sub-communities";

export const metadata = { title: "About | BOM" };
export const revalidate = 60;

export default async function AboutUsPage() {
  const [subs, roles] = await Promise.all([publicSubCommunities().listActive(), publicTeam().list()]);
  const founders = teamStrip(roles);
  const stats = communityStats(subs.length);
  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 py-12">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <RibbonBanner>About BOM</RibbonBanner>
          <h1 id="story" className="text-5xl leading-none md:text-7xl">Our <span className="text-primary">Story</span></h1>
          <div>
            <div className="text-muted-foreground max-w-xl space-y-4">
              <p>We build a structured place to play: from relaxed weekly Ranked sessions to an official path toward national and regional tournaments.</p>
              <p>It started in 2026 when friends began gathering to battle. What began as a small meetup is now 50+ active members, {subs.length} sub komunitas, a regular schedule, and a leaderboard open to everyone. We believe Medan deserves its own stage on the Indonesian Beyblade X map.</p>
            </div>
            <ul aria-label="At a glance" className="mt-6 flex flex-wrap gap-2">
              {stats.map((t) => <li key={t}><Badge variant="outline" className="px-3 py-1 text-sm">{t}</Badge></li>)}
            </ul>
          </div>
        </div>
        <div className="flex justify-center"><Image src="/brand/logo-768.png" alt="BOM logo" width={420} height={420} priority /></div>
      </section>

      <section aria-labelledby="path">
        <SectionHeading id="path">Competition path</SectionHeading>
        <CompetitionLadder />
      </section>

      <section aria-labelledby="sub-komunitas">
        <SectionHeading id="sub-komunitas" className="mb-0">{subs.length} Sub Komunitas</SectionHeading>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm">Satu aturan main untuk semua sub komunitas. Poin dari semua gathering masuk satu leaderboard.</p>
      <div className="mt-10"><SubCommunityChart subs={subs} /></div>
      <ul className="mt-6 grid gap-2 md:grid-cols-3">
        {umbrella.map((u) => (
          <li key={u} className="border-primary border-l-2 pl-3 text-sm">{u}</li>
        ))}
      </ul>
      </section>

      {founders.length > 0 && (
        <section aria-labelledby="founders">
          <SectionHeading id="founders">Founding team</SectionHeading>
          <MemberCarousel members={founders} />
        </section>
      )}

      <section aria-labelledby="join">
        <SectionHeading id="join">Join us</SectionHeading>
        <p className="max-w-xl">New to this? Just come to a weekly Ranked session. Bring your bey and we&apos;ll help with the rest.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button size="lg" asChild><Link href="/membership">Daftar Membership</Link></Button>
          {WHATSAPP_INVITE && (
            <Button size="lg" className="bg-[#25D366] text-black hover:bg-[#1EBE5A]" asChild>
              <a href={WHATSAPP_INVITE} target="_blank" rel="noopener noreferrer"><WhatsappIcon />Join Grup WhatsApp</a>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <a href={`https://www.instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer"><InstagramIcon />@{INSTAGRAM}</a>
          </Button>
        </div>
        <p className="text-muted-foreground mt-4 text-sm">Sponsors and partnerships: <a href={`mailto:${PARTNER_EMAIL}`} className="hover:text-primary text-white">{PARTNER_EMAIL}</a></p>
      </section>
    </main>
  );
}
