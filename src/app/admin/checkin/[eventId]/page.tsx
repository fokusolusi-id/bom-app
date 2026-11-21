import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { canManageEvent } from "@/domain/access";
import { eventUsesBomLogo } from "@/domain/event";
import type { TierLabel } from "@/domain/tier";
import { isUuid } from "@/domain/validation";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { mediaUrl } from "@/lib/media";
import { BOM_LOGO } from "@/lib/tier-icon";
import { requireStaff } from "@/server/admin-session";
import { supabaseCheckins } from "@/server/checkins";
import { supabasePlayers } from "@/server/players";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { CheckinPanel } from "./checkin-panel";

export const metadata = { title: "Check-in | Admin Beyblade of Medan" };

const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

/** One event's check-in on its own page: scan or search players, register their combos, correct earlier check-ins. */
export default async function EventCheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  if (!isUuid(eventId)) notFound();
  const staff = await requireStaff();
  const event = await supabaseScheduleEvents(staff.supabase).get(eventId);
  if (!event || event.tier === "Break" || !canManageEvent(staff, event)) notFound();
  const [players, checkins] = await Promise.all([supabasePlayers(staff.supabase).list(1000, { includeRegistered: true }), supabaseCheckins(staff.supabase).listForEvent(eventId)]);
  const tier = event.tier as TierLabel;
  const bom = eventUsesBomLogo(tier) || !event.community?.image_path;
  const logo = bom ? { src: BOM_LOGO, alt: "Beyblade of Medan" } : { src: mediaUrl(event.community!.image_path!), alt: event.community!.name };
  return (
    <AdminPage title="Check-in" hint="Scan a member card or search the player, then register their combos. When results are saved, the top 8 take their combos from here.">
      <div className="space-y-8">
        <Link href="/admin/checkin" className="text-muted-foreground hover:text-primary flex w-fit items-center gap-1 text-sm"><ArrowLeft className="size-4" aria-hidden />Back to Check-in</Link>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src={logo.src} alt={logo.alt} width={96} height={96} className="size-16 object-contain" />
            <TierTile tier={tier} className="size-14" />
          </div>
          <div>
            <div className={`font-label text-lg font-bold tracking-[0.08em] uppercase italic ${TIER_TILE[tier].title}`}>{EVENT_TYPE_LABEL(tier)}</div>
            <h2 className="font-display text-2xl leading-tight font-extrabold normal-case italic">{event.name}</h2>
            <p className="text-muted-foreground text-sm">{when.format(new Date(event.starts_at))} · {event.community?.name ?? "Beyblade of Medan"}</p>
          </div>
        </div>

        <CheckinPanel eventId={eventId} members={players.flatMap((p) => (p.id ? [{ id: p.id, name: p.name, bom_id: p.bom_id }] : []))} checkins={checkins} />

        <Link href="/admin/checkin" className="text-muted-foreground hover:text-primary flex w-fit items-center gap-1 text-sm"><ArrowLeft className="size-4" aria-hidden />Back to Check-in</Link>
      </div>
    </AdminPage>
  );
}
