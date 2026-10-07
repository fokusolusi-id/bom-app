import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RibbonBanner } from "@/components/bom/ribbon-banner";

const pillars = [
  ["Play", "Gathering mingguan dan casual battle. Stadium selalu ada, siapa pun boleh main."],
  ["Compete", "Ranked mingguan, Cup bulanan, Major, Championship. Jenjang jelas."],
  ["Rank", "BOM ID, profil pemain, poin musiman, satu leaderboard publik bersama."],
  ["Grow", "Sesi beginner, coaching combo, bedah rules, onboarding pemain baru."],
  ["Belong", "Achievement, tim, spotlight member, merchandise, identitas Medan."],
] as const;

const more = [
  ["Jenjang Kompetisi", "Dari Ranked mingguan sampai Championship, dan jalur ke panggung resmi.", "/kompetisi"],
  ["Sub Komunitas", "Empat sub komunitas, satu aturan main.", "/komunitas"],
  ["Mulai dari Nol", "Belum punya bey? Mulai dari pojok Try.", "/mulai"],
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <RibbonBanner>Beyblade X Sumatera Utara</RibbonBanner>
          <h1 className="text-5xl leading-none md:text-7xl">Built in Medan. <span className="text-primary">Battle anywhere.</span></h1>
          <p className="text-muted-foreground max-w-md">
            BOM adalah rumah Beyblade X kompetitif di Sumatera Utara, tempat pemain Medan naik kelas sampai ke panggung dunia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild><Link href="/leaderboard">Lihat Leaderboard</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/komunitas">Jadwal Gathering</Link></Button>
          </div>
        </div>
        <div className="flex justify-center"><Image src="/brand/logo-768.png" alt="BOM logo" width={420} height={420} priority /></div>
      </section>

      <section className="mt-16">
        <h2 className="text-primary mb-4 text-sm tracking-widest uppercase">Play • Compete • Rank • Grow • Belong</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {pillars.map(([t, d]) => (
            <Card key={t}><CardHeader><CardTitle className="text-primary">{t}</CardTitle><CardDescription>{d}</CardDescription></CardHeader></Card>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-sm">Compete adalah pilar utama. Yang lain ada untuk mengisinya.</p>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {more.map(([t, d, href]) => (
          <Link key={href} href={href}>
            <Card className="hover:border-primary h-full transition-colors"><CardHeader><CardTitle>{t}</CardTitle><CardDescription>{d}</CardDescription></CardHeader></Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
