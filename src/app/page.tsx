import { ArrowRight, CalendarDays, MapPin, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, WhatsappIcon } from "@/components/bom/brand-icons";
import { CompetitionPath } from "@/components/bom/competition-path";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { SectionHeading } from "@/components/bom/section-heading";
import { SubCommunityChart } from "@/components/bom/sub-community-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pickNextEvent } from "@/domain/next-event";
import { GATHERING_TIME, parseWeekday } from "@/domain/schedule";
import { communityStats } from "@/lib/content";
import { DIRECTIONS_URL, INSTAGRAM, PARTNER_EMAIL, VENUE, WHATSAPP_INVITE } from "@/lib/venue";
import { latestResult } from "@/server/latest-result";
import { publicPlayers } from "@/server/players";
import { publicSubCommunities } from "@/server/sub-communities";
import { publicTournaments } from "@/server/tournaments";

export const revalidate = 60;

const SATURDAY = 6;

const steps = [
  ["Show up", "Come to any weekly Ranked session. No experience needed."],
  ["Get your BOM ID", "Every blader gets an ID that tracks points and results."],
  ["Climb", "Earn seasonal points, qualify for BOM Cup and BOM Major, and BOM Championship."],
] as const;

const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
const todayWib = (now: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);

export default async function Home() {
  const now = new Date();
  const today = todayWib(now);
  const [subs, players, tournament, result] = await Promise.all([
    publicSubCommunities().listActive(),
    publicPlayers().repo.list(5),
    publicTournaments().upcoming(today),
    latestResult(today),
  ]);
  // The weekly Ranked exists while a sub komunitas meets on Saturday.
  const weekly = subs.some((s) => parseWeekday(s.schedule) === SATURDAY) ? { weekday: SATURDAY, time: GATHERING_TIME } : null;
  const next = pickNextEvent({ now, weekly, tournament });

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 py-12">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <RibbonBanner>Beyblade X Sumatera Utara</RibbonBanner>
          <h1 className="text-5xl leading-none md:text-7xl">Built in Medan. <span className="text-primary">Battle anywhere.</span></h1>
          <p className="text-muted-foreground max-w-md">Competitive Beyblade X community in Medan. Fierce at the top, friendly at the door.</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild><Link href="/membership">Join the next Ranked</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/leaderboard">View leaderboard</Link></Button>
          </div>
        </div>
        <div className="flex justify-center"><Image src="/brand/logo-768.png" alt="BOM logo" width={420} height={420} priority /></div>
      </section>

      <section aria-labelledby="next-event">
        <SectionHeading id="next-event">Next event</SectionHeading>
        <Card className="border-primary">
          {next ? (
            <CardContent className="space-y-3">
              <div className="font-display text-2xl font-extrabold italic uppercase md:text-4xl">{next.title}</div>
              <p className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg">
                <span className="flex items-center gap-2"><CalendarDays className="text-primary size-5" aria-hidden />{dayFmt.format(next.at)}{next.hasTime && `, ${timeFmt.format(next.at)} WIB`}</span>
                <span className="flex items-center gap-2"><MapPin className="text-primary size-5" aria-hidden />{VENUE}</span>
              </p>
              <p className="text-muted-foreground text-sm">Bring your bey, we&apos;ll help with the rest.</p>
              <Button variant="outline" asChild><a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden />Map</a></Button>
            </CardContent>
          ) : (
            <CardContent className="space-y-3">
              <p className="text-lg">Next event is being scheduled. Join the group to hear first.</p>
              {WHATSAPP_INVITE && <Button className="bg-[#25D366] text-black hover:bg-[#1EBE5A]" asChild><a href={WHATSAPP_INVITE} target="_blank" rel="noopener noreferrer"><WhatsappIcon />Join Grup WhatsApp</a></Button>}
            </CardContent>
          )}
        </Card>
      </section>

      <section aria-labelledby="leaderboard">
        <SectionHeading id="leaderboard">Leaderboard</SectionHeading>
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead><TableHead>Blader</TableHead>
                <TableHead className="text-right">W</TableHead><TableHead className="text-right">Poin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p, i) => (
                <TableRow key={p.bom_id}>
                  <TableCell className="font-num tabular text-primary text-2xl font-black italic">{i + 1}</TableCell>
                  <TableCell><Link href={`/member/${p.bom_id.toLowerCase()}`} className="hover:text-primary font-bold">{p.name}</Link></TableCell>
                  <TableCell className="tabular text-success text-right">{p.wins}</TableCell>
                  <TableCell className="font-num tabular text-right text-xl font-black italic">{p.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button variant="outline" className="mt-4" asChild><Link href="/leaderboard">See full leaderboard<ArrowRight aria-hidden /></Link></Button>
      </section>

      <section aria-labelledby="how">
        <SectionHeading id="how">How it works</SectionHeading>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t}>
              <Card className="h-full">
                <CardHeader>
                  <div className="font-display text-primary text-3xl font-black italic">{i + 1}</div>
                  <CardTitle>{t}</CardTitle>
                  <CardDescription>{d}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="path">
        <SectionHeading id="path">Competition path</SectionHeading>
        <CompetitionPath />
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
          {communityStats(subs.length).map((t) => (
            <li key={t}><Card className="h-full justify-center py-6 text-center"><span className="font-display text-primary text-xl font-extrabold italic uppercase">{t}</span></Card></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sponsors">
        <SectionHeading id="sponsors">Supported by</SectionHeading>
        <p className="text-muted-foreground max-w-xl text-sm">
          Want to put your brand in front of Medan&apos;s Beyblade X scene?{" "}
          <a href={`mailto:${PARTNER_EMAIL}`} className="hover:text-primary text-white underline">{PARTNER_EMAIL}</a>
        </p>
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
