import { ArrowLeft, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { isUuid } from "@/domain/validation";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { requireStaff } from "@/server/admin-session";
import { Participants } from "../../participants";
import { loadResultEvents } from "../../results-data";
import { ResultsEntry } from "../../results-entry";

export const metadata = { title: "Event results | Admin BOM" };

const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

/** One event's results on their own page: who took part, and the three ways to enter or correct them. */
export default async function EventResultsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  if (!isUuid(eventId)) notFound();
  const staff = await requireStaff();
  const { events, members } = await loadResultEvents(staff, eventId);
  const event = events[0];
  if (!event) notFound();
  return (
    <AdminPage title="Results" hint="Enter or correct who took part in this event. Points are calculated from this and added to the leaderboard.">
      <div className="space-y-8">
        <Link href="/admin/leaderboard#results" className="text-muted-foreground hover:text-primary flex w-fit items-center gap-1 text-sm"><ArrowLeft className="size-4" aria-hidden />Back to Leaderboard</Link>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src={event.logo.src} alt={event.logo.alt} width={96} height={96} className="size-16 object-contain" />
            <TierTile tier={event.tier} className="size-14" />
          </div>
          <div>
            <div className={`font-label text-lg font-bold tracking-[0.08em] uppercase italic ${TIER_TILE[event.tier].title}`}>{EVENT_TYPE_LABEL(event.tier)}</div>
            <h2 className="font-display text-2xl leading-tight font-extrabold normal-case italic">{event.name}</h2>
            <p className="text-muted-foreground text-sm">
              {when.format(new Date(event.startsAt))} · {event.communityName}
            </p>
            {event.challongeUrl && <a href={event.challongeUrl} target="_blank" rel="noopener noreferrer" className="text-primary mt-1 inline-flex items-center gap-1 text-sm underline">Bracket<ExternalLink className="size-3" aria-hidden /></a>}
          </div>
        </div>

        <Participants eventId={event.id} rows={event.rows} />
        <ResultsEntry tier={event.tier} eventId={event.id} text={event.text} challongeUrl={event.challongeUrl} members={members} hasChallongeKey={!!process.env.CHALLONGE_API_KEY} />

        <Link href="/admin/leaderboard#results" className="text-muted-foreground hover:text-primary flex w-fit items-center gap-1 text-sm"><ArrowLeft className="size-4" aria-hidden />Back to Leaderboard</Link>
      </div>
    </AdminPage>
  );
}
