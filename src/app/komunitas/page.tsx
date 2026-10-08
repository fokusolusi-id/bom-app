import Image from "next/image";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstagramIcon } from "@/components/bom/brand-icons";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { umbrella } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { publicSubCommunities } from "@/server/sub-communities";

export const metadata = { title: "Sub Komunitas | BOM" };
export const revalidate = 60;

export default async function KomunitasPage() {
  const subs = await publicSubCommunities().listActive();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Sub Komunitas</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">Satu aturan main untuk semua sub komunitas. Poin dari semua gathering masuk satu leaderboard.</p>
      {/* Org chart: BOM on top, a trunk down to a bar that branches to each sub community.
          Below lg the branches stack into a single vertical chain. */}
      <section aria-label="Struktur komunitas" className="mt-10">
        <div className="flex flex-col items-center">
          <Image src="/brand/logo-768.png" alt="BOM" width={160} height={160} priority />
          <div aria-hidden className="bg-primary h-8 w-0.5" />
        </div>
        <ul className="mx-auto flex max-w-sm flex-col lg:max-w-none lg:flex-row">
          {subs.map((s) => (
            <li
              key={s.id ?? s.name}
              className="before:bg-primary lg:after:bg-primary relative flex-1 pt-8 before:absolute before:top-0 before:left-1/2 before:h-8 before:w-0.5 before:-translate-x-1/2 lg:px-2 lg:after:absolute lg:after:inset-x-0 lg:after:top-0 lg:after:h-0.5 lg:first:after:left-1/2 lg:last:after:right-1/2"
            >
              <Card className="h-full items-center text-center">
                {s.image_path && <Image src={mediaUrl(s.image_path)} alt={s.name} width={320} height={320} className="aspect-square w-full max-w-40 rounded-md object-contain" />}
                <CardHeader className="items-center">
                  <CardTitle>{s.name}</CardTitle>
                  <CardDescription>{s.schedule}</CardDescription>
                  {s.focus && <p className="text-sm">{s.focus}</p>}
                  {s.instagram && (
                    <a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary mt-1 inline-flex items-center gap-1.5 text-sm">
                      <InstagramIcon className="size-4" />@{s.instagram}
                    </a>
                  )}
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      <ul className="mt-6 grid gap-2 md:grid-cols-3">
        {umbrella.map((u) => (
          <li key={u} className="border-primary border-l-2 pl-3 text-sm">{u}</li>
        ))}
      </ul>
    </main>
  );
}
