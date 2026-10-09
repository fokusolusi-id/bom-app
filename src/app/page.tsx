import { ArrowRight, CalendarDays, Mail, MapPin, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, WhatsappIcon } from "@/components/bom/brand-icons";
import { GallerySlideshow } from "@/components/bom/gallery-slideshow";
import { NewsSlider } from "@/components/bom/news-slider";
import { CompetitionLadder } from "@/components/bom/competition-ladder";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { SectionHeading } from "@/components/bom/section-heading";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { SponsorSlider } from "@/components/bom/sponsor-slider";
import { SubCommunityChart } from "@/components/bom/sub-community-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EventType } from "@/domain/event";
import { formatWhen, todayWib } from "@/domain/next-event";
import { EVENT_STYLE, EVENT_TYPE_LABEL } from "@/lib/event-style";
import { communityNumbers } from "@/lib/content";
import { DIRECTIONS_URL, GATHERING_SCHEDULE, INSTAGRAM, PARTNER_EMAIL, VENUE, WHATSAPP_INVITE } from "@/lib/venue";
import { loadUpcomingEvents } from "@/server/events";
import { latestResult } from "@/server/latest-result";
import { publicSiteMedia } from "@/server/site-media";
import { publicSponsors } from "@/server/sponsors";
import { publicSubCommunities } from "@/server/sub-communities";

export const revalidate = 60;

/** Events shown on the homepage; the rest are behind "View all". */
const EVENT_LIMIT = 2;

export default async function Home() {
  const now = new Date();
  const media = publicSiteMedia();
  const [subs, result, news, gallery, sponsors] = await Promise.all([
    publicSubCommunities().listActive(), latestResult(todayWib(now)), media.list("news"), media.list("gallery"), publicSponsors().list(),
  ]);
  const events = await loadUpcomingEvents(EVENT_LIMIT, now);

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 py-12">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <RibbonBanner>Beyblade X Sumatera Utara</RibbonBanner>
          <h1 className="text-5xl leading-none md:text-7xl">Built in Medan. <span className="text-primary">Battle anywhere.</span></h1>
          <p className="text-muted-foreground max-w-md">Competitive Beyblade X community in Medan. Fierce at the top, friendly at the door.</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild><Link href="/schedule">Join the next Ranked</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/leaderboard">View leaderboard</Link></Button>
          </div>
        </div>
        <div className="flex justify-center"><Image src="/brand/logo-768.png" alt="BOM logo" width={420} height={420} priority /></div>
      </section>

      <section aria-labelledby="next-event">
        <SectionHeading id="next-event">Next events</SectionHeading>
        {events.length > 0 ? (
          <>
            <ul className="grid gap-4 md:grid-cols-2">
              {events.map((e) => {
                const type = e.type && e.type in EVENT_STYLE ? (e.type as EventType) : null;
                const style = type ? EVENT_STYLE[type] : null;
                                return (
                  <li key={`${e.title}-${e.at.toISOString()}`}>
                    <Card className={`h-full border-[3px] ${style ? style.edge : ""}`}>
                      <CardContent className="flex h-full gap-4">
                        {e.logo && <Image src={e.logo.src} alt={e.logo.alt} width={112} height={112} className="size-24 shrink-0 object-contain" />}
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          {type && (
                            <div className="font-label flex items-center gap-3 text-xl font-bold tracking-[0.08em] uppercase italic">
                              <TierTile tier={type} className="size-16" />
                              {/* The level's own text colour, as in the competition path below. */}
                              <span className={TIER_TILE[type].title}>{EVENT_TYPE_LABEL(type)}</span>
                            </div>
                          )}
                          <div className="font-display text-2xl leading-tight font-extrabold italic uppercase">{e.name ?? e.title}</div>
                          <p className="flex items-center gap-2"><CalendarDays className="text-primary size-5 shrink-0" aria-hidden />{formatWhen(e)}</p>
                          <p className="flex items-center gap-2"><MapPin className="text-primary size-5 shrink-0" aria-hidden />{e.place ?? VENUE}</p>
                          <Button variant="outline" size="sm" className="mt-auto self-start border-2 border-[var(--bom-orange)] bg-black/60 text-[var(--bom-orange)] hover:bg-black/80 hover:text-[var(--bom-orange)]" asChild>
                            <a href={!e.place || e.place === VENUE ? DIRECTIONS_URL : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.place)}`} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden />Map</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
            <p className="text-muted-foreground mt-3 text-sm">Bring your bey, we&apos;ll help with the rest.</p>
            <Button variant="outline" className="mt-4" asChild><Link href="/schedule">View all<ArrowRight aria-hidden /></Link></Button>
          </>
        ) : (
          <Card>
            <CardContent className="space-y-3">
              <p className="text-lg">Next event is being scheduled. Join the group to hear first.</p>
              {WHATSAPP_INVITE && <Button className="bg-[#25D366] text-black hover:bg-[#1EBE5A]" asChild><a href={WHATSAPP_INVITE} target="_blank" rel="noopener noreferrer"><WhatsappIcon />Join Grup WhatsApp</a></Button>}
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="path">
        <SectionHeading id="path">Competition path</SectionHeading>
        <CompetitionLadder details={false} />
      </section>

      <section aria-labelledby="latest">
        <SectionHeading id="latest">Latest result</SectionHeading>
        <Card>
          {result ? (
            <CardContent className="space-y-1">
              <div className="font-display text-xl font-extrabold italic uppercase">{result.title}</div>
              <p className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="flex items-center gap-2"><Trophy className="text-primary size-5" aria-hidden />Champion <strong>{result.champion}</strong></span>
                {result.runnerUp && <span>Runner-up <strong>{result.runnerUp}</strong></span>}
              </p>
              <p className="text-muted-foreground text-sm">{result.note}</p>
            </CardContent>
          ) : (
            <CardContent><p className="text-muted-foreground">Results appear here after the first tournament.</p></CardContent>
          )}
        </Card>
      </section>

      <section aria-labelledby="sub-komunitas">
        <SectionHeading id="sub-komunitas">Sub Komunitas</SectionHeading>
        <SubCommunityChart subs={subs} />
        <Button variant="outline" className="mt-6" asChild><Link href="/about-bom">About BOM<ArrowRight aria-hidden /></Link></Button>
      </section>

      <section aria-labelledby="numbers">
        <SectionHeading id="numbers">By the numbers</SectionHeading>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {communityNumbers(subs.length).map(({ value, label }) => (
            <li key={label}>
              <Card className="h-full items-center justify-center gap-1 py-6 text-center">
                <span className="font-display text-4xl leading-none font-black text-white italic uppercase md:text-5xl">{value}</span>
                <span className="font-label text-primary text-base font-bold tracking-[0.08em] uppercase italic">{label}</span>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {gallery.length > 0 && (
        // Breaks out of the page column so the slideshow spans the whole screen.
        <section aria-labelledby="gallery" className="relative left-1/2 w-screen -translate-x-1/2">
          <SectionHeading id="gallery" className="mx-auto max-w-6xl px-4">Gallery</SectionHeading>
          <GallerySlideshow items={gallery.flatMap((m) => (m.path ? [{ path: m.path, caption: m.caption }] : []))} />
        </section>
      )}

      {news.length > 0 && (
        <section aria-labelledby="whats-new">
          <SectionHeading id="whats-new">What&apos;s new</SectionHeading>
          <div className="overflow-hidden rounded-lg border">
          <NewsSlider items={news.flatMap((m) => (m.kind === "image" ? [] : [{ kind: m.kind, path: m.path, youtubeId: m.youtube_id, caption: m.caption }]))} />
          </div>
        </section>
      )}

      <section aria-labelledby="sponsors">
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

      <section aria-labelledby="join" className="bg-card rounded-lg border p-8 text-center">
        <h2 id="join" className="text-3xl md:text-5xl">Join the community</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {WHATSAPP_INVITE && (
            <Button size="lg" className="bg-[#25D366] text-black hover:bg-[#1EBE5A]" asChild>
              <a href={WHATSAPP_INVITE} target="_blank" rel="noopener noreferrer"><WhatsappIcon />WhatsApp</a>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <a href={`https://www.instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer"><InstagramIcon />Instagram</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
