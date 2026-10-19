"use client";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TierMark } from "@/components/bom/tier-mark";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { eventPlace, type EventType, type ScheduleEventView } from "@/domain/event";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { VENUE } from "@/lib/venue";
import { deleteScheduleEvent } from "../jadwal/actions";
import { EventForm } from "./event-form";

export type ArchiveEvent = { event: ScheduleEventView; editable: boolean };

const PAGE_SIZE = 25;
const when = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });

/** The past events in a table filterable by competition type (the vertical menu picks the sub community), 25 per page. The pencil opens an event to correct it. */
export function ArchiveBrowser({ rows, communities, types, allowBom }: {
  rows: ArchiveEvent[]; communities: { id: string; name: string }[]; types: readonly EventType[]; allowBom: boolean;
}) {
  const [type, setType] = useState("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = useMemo(
    () => rows.filter(({ event: e }) => type === "all" || e.tier === type),
    [rows, type],
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const pageRows = shown.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const open = rows.find((r) => r.event.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="md:max-w-xs">
        <label className="text-muted-foreground flex flex-col gap-1 text-xs uppercase">Competition type
          <NativeSelect value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className="text-base text-white">
            <option value="all">All types</option>
            {types.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL(t)}</option>)}
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
              <TableHead>Place</TableHead>
              <TableHead className="w-px text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map(({ event: e, editable }, i) => (
              <TableRow key={e.id}>
                <TableCell className="font-num tabular text-muted-foreground">{current * PAGE_SIZE + i + 1}</TableCell>
                <TableCell className="whitespace-nowrap">{when.format(new Date(e.starts_at))}</TableCell>
                <TableCell><TierMark tier={e.tier} tileClassName="size-8" className="text-sm whitespace-nowrap" /></TableCell>
                <TableCell className="font-bold">
                  {e.name}
                  {!e.is_active && <span className="text-muted-foreground ml-2 text-xs font-normal">(hidden)</span>}
                  {e.challonge_url && <a href={e.challonge_url} target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-0.5 text-xs font-normal underline">Bracket<ExternalLink className="size-3" aria-hidden /></a>}
                </TableCell>
                <TableCell className="text-muted-foreground">{e.community?.name ?? "BOM"}</TableCell>
                <TableCell className="text-muted-foreground max-w-48 truncate text-sm">{eventPlace(e, VENUE)}</TableCell>
                <TableCell>
                  <span className="flex justify-end">
                    {editable && <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={() => setOpenId(e.id!)} aria-label={`Edit ${e.name}`}><Pencil aria-hidden /></Button>}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">No past events match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Pagination label="Archive pages" page={current} pages={pages} onChange={setPage} summary={`${shown.length} of ${rows.length} past events`} />

      <Modal open={open !== null} onClose={() => setOpenId(null)} title={open ? `Edit ${open.event.name}` : "Edit event"} wide>
        {open && (
          <div className="space-y-4">
            <EventForm e={open.event} communities={communities} types={types} allowBom={allowBom} />
            <ActionForm action={deleteScheduleEvent.bind(null, open.event.id!)}>
              <Button variant="destructive" size="sm"><Trash2 aria-hidden />Delete this event</Button>
            </ActionForm>
          </div>
        )}
      </Modal>
    </div>
  );
}
