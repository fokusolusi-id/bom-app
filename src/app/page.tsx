import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { TickArcMeter } from "@/components/bom/tick-arc-meter";
import { TierBadge } from "@/components/bom/tier-badge";

const pillars = [
  ["Play", "Gathering mingguan dan casual battle."],
  ["Compete", "Ranked, Cup, Major, Championship."],
  ["Rank", "BOM ID, poin musiman, leaderboard publik."],
  ["Grow", "Sesi beginner dan coaching combo."],
  ["Belong", "Tim, achievement, identitas Medan."],
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <RibbonBanner>Beyblade X Sumatera</RibbonBanner>
          <h1 className="text-5xl leading-none md:text-7xl">Built in Medan. <span className="text-primary">Battle anywhere.</span></h1>
          <p className="text-muted-foreground max-w-md">Kompetitif di puncak, ramah di pintu. Naik kelas dari Ranked mingguan sampai panggung nasional.</p>
          <div className="flex gap-3">
            <Button size="lg" asChild><Link href="/leaderboard">Lihat Leaderboard</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/scoreboard">Mode Scoreboard</Link></Button>
          </div>
        </div>
        <div className="flex justify-center"><Image src="/brand/logo-768.png" alt="BOM logo" width={420} height={420} priority /></div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-5">
        {pillars.map(([t, d]) => (
          <Card key={t}><CardHeader><CardTitle className="text-primary">{t}</CardTitle><CardDescription>{d}</CardDescription></CardHeader></Card>
        ))}
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Jenjang kompetisi</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <TierBadge tier="Ranked" /><TierBadge tier="Cup" /><TierBadge tier="Major" /><TierBadge tier="Championship" />
          </CardContent>
        </Card>
        <Card className="items-center">
          <CardHeader><CardTitle>Progres Season 1</CardTitle></CardHeader>
          <CardContent><TickArcMeter value={62} label="Season 1" /></CardContent>
        </Card>
      </section>
    </main>
  );
}
