"use client";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { TierMark } from "@/components/bom/tier-mark";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIERS, type Tier } from "@/domain/tier";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { deleteEventResults } from "./actions";
import { PlacementRow } from "./placement-row";
import { ResultsEntry } from "./results-entry";

export type ResultEvent = {
  id: string; name: string; tier: Tier; startsAt: string; challongeUrl: string | null;
  communityId: string | null; communityName: string; logo: { src: string; alt: string };
  text: string;
  rows: { id: string; playerId: string | null; name: string; bomId: string | null; place: number | null; tigerKing: boolean; combos: string[]; points: number }[];
};

const PAGE_SIZE = 25;
const PARTICIPANTS_PER_PAGE = 8;
const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const BOM = "bom";

/** The participants of one event, 8 per page. Starts on page 1 for each event (the caller keys it by event). */
function Participants({ eventId, rows }: { eventId: string; rows: ResultEvent["rows"] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PARTICIPANTS_PER_PAGE));
  // Deleting the last member on a page moves back to the page before.
  const current = Math.min(page, pages - 1);
  const shownRows = rows.slice(current * PARTICIPANTS_PER_PAGE, (current + 1) * PARTICIPANTS_PER_PAGE);
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">{rows.length} participants</p>
      <ul className="space-y-2 text-sm">
        {shownRows.map((pl) => (
          <PlacementRow key={pl.id} eventId={eventId} rowId={pl.id} playerId={pl.playerId} name={pl.name} bomId={pl.bomId} place={pl.place} tigerKing={pl.tigerKing} combos={pl.combos} points={pl.points} />
        ))}
      </ul>
      <Pagination label="Participants pages" page={current} pages={pages} onChange={setPage} />
    </div>
  );
}

/** All past events in a filterable list (by competition type and sub community). Edit opens the event's results in a dialog. */
export function ResultsBrowser({ events, members, hasChallongeKey }: {
  events: ResultEvent[]; members: { id: string; name: string; bom_id: string }[]; hasChallongeKey: boolean;
}) {
  const [type, setType] = useState("all");
  const [community, setCommunity] = useState("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResultEvent | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const communities = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of events) if (e.communityId) seen.set(e.communityId, e.communityName);
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [events]);
  const shown = useMemo(
    () => events.filter((e) => (type === "all" || e.tier === type) && (community === "all" || (community === BOM ? e.communityId === null : e.communityId === community))),
    [events, type, community],
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = shown.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  // The dialog reads the event from the live list, so it shows the new results right after a save.
  const open = events.find((e) => e.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 md:max-w-xl">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs uppercase">Competition type
          <NativeSelect value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className="text-base text-white">
            <option value="all">All types</option>
            {TIERS.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL(t)}</option>)}
          </NativeSelect>
        </label>
        <label className="text-muted-foreground flex flex-col gap-1 text-xs uppercase">Sub community
          <NativeSelect value={community} onChange={(e) => { setCommunity(e.target.value); setPage(0); }} className="text-base text-white">
            <option value="all">All communities</option>
            {communities.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            <option value={BOM}>BOM only</option>
          </NativeSelect>
        </label>
      </div>

      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Sub community</TableHead>
              <TableHead className="text-right">Participants</TableHead>
              <TableHead className="w-px text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e, i) => (
              <TableRow key={e.id}>
                <TableCell className="font-num tabular text-muted-foreground">{current * PAGE_SIZE + i + 1}</TableCell>
                <TableCell className="whitespace-nowrap">{when.format(new Date(e.startsAt))}</TableCell>
                <TableCell><TierMark tier={e.tier} tileClassName="size-8" className="text-sm whitespace-nowrap" /></TableCell>
                <TableCell className="font-bold">
                  {e.name}
                  {e.challongeUrl && <a href={e.challongeUrl} target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-0.5 text-xs font-normal underline">Bracket<ExternalLink className="size-3" aria-hidden /></a>}
                </TableCell>
                <TableCell className="text-muted-foreground">{e.communityName}</TableCell>
                <TableCell className={`font-num tabular text-right ${e.rows.length === 0 ? "text-muted-foreground" : ""}`}>{e.rows.length === 0 ? "No results" : e.rows.length}</TableCell>
                <TableCell>
                  <span className="flex justify-end gap-1">
                    <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={() => setOpenId(e.id)} aria-label={`Edit results of ${e.name}`}><Pencil aria-hidden /></Button>
                    <Button type="button" variant="outline" size="sm" className="text-destructive w-8 px-0" disabled={e.rows.length === 0} onClick={() => { setDeleteError(null); setDeleting(e); }} aria-label={`Delete all results of ${e.name}`}><Trash2 aria-hidden /></Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">No past events match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Pagination label="Results pages" page={current} pages={pages} onChange={setPage} summary={`${shown.length} of ${events.length} events`} />

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete all results">
        {deleting && (
          <div className="space-y-4">
            <p>Delete the complete results of <strong>{deleting.name}</strong> ({when.format(new Date(deleting.startsAt))})?</p>
            <p className="text-muted-foreground text-sm">
              This removes all {deleting.rows.length} participants, their places, Tiger King, combos and the Challonge link. The points they earned are taken off the leaderboard. The event stays in the schedule, and you can enter the results again. It cannot be undone.
            </p>
            {deleteError && <p role="alert" className="text-destructive text-sm">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button type="button" variant="destructive" disabled={busy} onClick={async () => {
                setBusy(true);
                const result = await deleteEventResults(deleting.id);
                setBusy(false);
                if (result.ok) setDeleting(null);
                else setDeleteError(result.error ?? "Could not delete the results");
              }}>{busy ? "Deleting…" : "Delete all results"}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={open !== null} onClose={() => setOpenId(null)} title={open ? `Results: ${open.name}` : "Results"} extraWide>
        {open && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Image src={open.logo.src} alt={open.logo.alt} width={96} height={96} className="size-14 object-contain" />
                <TierTile tier={open.tier} className="size-12" />
              </div>
              <div>
                <div className={`font-label font-bold tracking-[0.08em] uppercase italic ${TIER_TILE[open.tier].title}`}>{EVENT_TYPE_LABEL(open.tier)}</div>
                <p className="text-muted-foreground text-sm">{when.format(new Date(open.startsAt))} · {open.communityName}</p>
              </div>
            </div>
            <div className="space-y-8">
            <Participants key={open.id} eventId={open.id} rows={open.rows} />
              <div>
              <ResultsEntry key={open.id} eventId={open.id} text={open.text} challongeUrl={open.challongeUrl} members={members} hasChallongeKey={hasChallongeKey} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
