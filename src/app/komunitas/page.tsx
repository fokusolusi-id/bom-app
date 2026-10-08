import Image from "next/image";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {subs.map((s) => (
          <Card key={s.id ?? s.name}>
            {s.image_path && <Image src={mediaUrl(s.image_path)} alt={s.name} width={400} height={225} className="aspect-video w-full rounded-md object-cover" />}
            <CardHeader>
              <CardTitle>{s.name}</CardTitle>
              <CardDescription>{s.schedule}</CardDescription>
              {s.focus && <p className="text-sm">{s.focus}</p>}
            </CardHeader>
          </Card>
        ))}
      </div>
      <ul className="mt-6 grid gap-2 md:grid-cols-3">
        {umbrella.map((u) => (
          <li key={u} className="border-primary border-l-2 pl-3 text-sm">{u}</li>
        ))}
      </ul>
    </main>
  );
}
