"use client";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TierMark } from "@/components/bom/tier-mark";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIER_LABELS, type TierLabel } from "@/domain/tier";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { deleteEventResults } from "./actions";

export type ResultEvent = {
  id: string; name: string; tier: TierLabel; startsAt: string; challongeUrl: string | null;
  communityId: string | null; communityName: string; logo: { src: string; alt: string };
  text: string;
  rows: { id: string; playerId: string | null; name: string; bomId: string | null; place: number | null; tigerKing: boolean; combos: string[]; points: number }[];
};

const PAGE_SIZE = 25;
const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const BOM = "bom";

/** All past events in a filterable list (by competition type and sub community). The pencil opens the event on its own page. */
export function ResultsBrowser({ events }: { events: ResultEvent[] }) {
  const [type, setType] = useState("all");
  const [community, setCommunity] = useState("all");
  const [page, setPage] = useState(0);
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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 md:max-w-xl">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs uppercase">Competition type
          <NativeSelect value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className="text-base text-white">
            <option value="all">All types</option>
            {TIER_LABELS.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL(t)}</option>)}
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
                  {e.challongeUrl && <a href={e.challongeUrl} target="_blank" rel="noopener noreferrer" className="text-primary mt-0.5 flex w-fit items-center gap-0.5 text-xs font-normal underline">Bracket<ExternalLink className="size-3" aria-hidden /></a>}
                </TableCell>
                <TableCell className="text-muted-foreground">{e.communityName}</TableCell>
                <TableCell className={`font-num tabular text-right ${e.rows.length === 0 ? "text-muted-foreground" : ""}`}>{e.rows.length === 0 ? "No results" : e.rows.length}</TableCell>
                <TableCell>
                  <span className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" className="w-8 px-0" asChild><Link href={`/admin/leaderboard/results/${e.id}`} aria-label={`Edit results of ${e.name}`}><Pencil aria-hidden /></Link></Button>
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

    </div>
  );
}
