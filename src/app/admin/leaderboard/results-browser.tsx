"use client";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { TierMark } from "@/components/bom/tier-mark";
import { TIER_TILE, TierTile } from "@/components/bom/tier-tile";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIERS, type Tier } from "@/domain/tier";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { PlacementRow } from "./placement-row";
import { ResultsEntry } from "./results-entry";

export type ResultEvent = {
  id: string; name: string; tier: Tier; startsAt: string; challongeUrl: string | null;
  communityId: string | null; communityName: string; logo: { src: string; alt: string };
  text: string;
  rows: { id: string; playerId: string | null; name: string; bomId: string | null; place: number | null; tigerKing: boolean; points: number }[];
};

const PAGE_SIZE = 25;
const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const BOM = "bom";

/** All past events in a filterable list (by competition type and sub community). Edit opens the event's results in a dialog. */
export function ResultsBrowser({ events, members, hasChallongeKey }: {
  events: ResultEvent[]; members: { id: string; name: string; bom_id: string }[]; hasChallongeKey: boolean;
}) {
  const [type, setType] = useState("all");
  const [community, setCommunity] = useState("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

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
                  <span className="flex justify-end">
                    <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={() => setOpenId(e.id)} aria-label={`Edit results of ${e.name}`}><Pencil aria-hidden /></Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">No past events match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <nav aria-label="Results pages" className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft aria-hidden />Previous</Button>
        <span className="text-muted-foreground text-sm">Page {current + 1} of {pages} · {shown.length} of {events.length} events</span>
        <Button type="button" variant="outline" size="sm" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Next<ChevronRight aria-hidden /></Button>
      </nav>

      <Modal open={open !== null} onClose={() => setOpenId(null)} title={open ? `Results: ${open.name}` : "Results"} wide>
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
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">{open.rows.length} participants</p>
              <ul className="space-y-2 text-sm">
                {open.rows.map((pl) => (
                  <PlacementRow key={pl.id} eventId={open.id} rowId={pl.id} playerId={pl.playerId} name={pl.name} bomId={pl.bomId} place={pl.place} tigerKing={pl.tigerKing} points={pl.points} />
                ))}
              </ul>
            </div>
            <ResultsEntry key={open.id} eventId={open.id} text={open.text} challongeUrl={open.challongeUrl} members={members} hasChallongeKey={hasChallongeKey} />
          </div>
        )}
      </Modal>
    </div>
  );
}
