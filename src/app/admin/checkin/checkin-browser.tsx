"use client";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TierMark } from "@/components/bom/tier-mark";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIER_LABELS, type TierLabel } from "@/domain/tier";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";

export type CheckinEvent = { id: string; name: string; tier: TierLabel; startsAt: string; communityId: string | null; communityName: string; logo: { src: string; alt: string }; checkedIn: number };

const PAGE_SIZE = 25;
const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const BOM = "bom";

/** Events in a filterable list (by competition type and sub community). The pencil opens the event's check-in page. */
export function CheckinBrowser({ events }: { events: CheckinEvent[] }) {
  const [type, setType] = useState("all");
  const [community, setCommunity] = useState("all");
  const [page, setPage] = useState(0);

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
              <TableHead className="text-right">Checked in</TableHead>
              <TableHead className="w-px text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e, i) => (
              <TableRow key={e.id}>
                <TableCell className="font-num tabular text-muted-foreground">{current * PAGE_SIZE + i + 1}</TableCell>
                <TableCell className="whitespace-nowrap">{when.format(new Date(e.startsAt))}</TableCell>
                <TableCell><TierMark tier={e.tier} tileClassName="size-8" className="text-sm whitespace-nowrap" /></TableCell>
                <TableCell className="font-bold">{e.name}</TableCell>
                <TableCell className="text-muted-foreground">{e.communityName}</TableCell>
                <TableCell className={`font-num tabular text-right ${e.checkedIn === 0 ? "text-muted-foreground" : ""}`}>{e.checkedIn === 0 ? "None yet" : e.checkedIn}</TableCell>
                <TableCell>
                  <span className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" className="w-8 px-0" asChild><Link href={`/admin/checkin/${e.id}`} aria-label={`Check in players for ${e.name}`}><Pencil aria-hidden /></Link></Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">No events match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Pagination label="Check-in pages" page={current} pages={pages} onChange={setPage} summary={`${shown.length} of ${events.length} events`} />
    </div>
  );
}
