import Link from "next/link";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { Card, CardContent } from "@/components/ui/card";
import { publicPlayers } from "@/server/players";

export const metadata = { title: "Members | Beyblade of Medan" };
export const revalidate = 60;

/** Every active member, by BOM ID, with the total. */
export default async function MembersPage() {
  const members = (await publicPlayers().repo.list(5000)).sort((a, b) => a.bom_id.localeCompare(b.bom_id, undefined, { numeric: true }));
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <section className="space-y-4">
        <RibbonBanner>Members</RibbonBanner>
        <h1 className="text-4xl leading-none md:text-5xl">Total <span className="text-primary">members</span></h1>
        <p className="font-display text-primary text-6xl leading-none font-black md:text-7xl">{members.length}</p>
      </section>
      {members.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <li key={m.bom_id}>
              <Link href={`/member/${m.bom_id.toLowerCase()}`} className="hover:border-primary flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors">
                <BomIdBadge id={m.bom_id} />
                <span className="truncate font-medium">{m.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Card><CardContent><p className="text-muted-foreground">No members yet.</p></CardContent></Card>
      )}
    </main>
  );
}
