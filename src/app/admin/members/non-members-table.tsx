"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { TierMark } from "@/components/bom/tier-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBomId } from "@/domain/profile";
import type { Tier } from "@/domain/tier";
import type { GuestSummary } from "@/server/results";
import { linkGuestToMember } from "./actions";

type Member = { id: string; name: string; bom_id: string };
const PAGE_SIZE = 25;
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const label = (m: Member) => `${m.name} ${formatBomId(m.bom_id)}`;

/** The member a typed text points to: the exact suggestion, a blader name, or a BOM ID. */
function findMember(members: Member[], text: string) {
  const q = text.trim().toLowerCase();
  if (!q) return undefined;
  const n = /^(?:bom)?[\s-]*(\d+)$/i.exec(q)?.[1];
  return members.find((m) => label(m).toLowerCase() === q) ?? members.find((m) => m.name.toLowerCase() === q) ?? (n ? members.find((m) => Number(/\d+/.exec(m.bom_id)?.[0]) === Number(n)) : undefined);
}

function GuestRow({ guest, index, members }: { guest: GuestSummary; index: number; members: Member[] }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chosen = findMember(members, text);
  const best = guest.events.flatMap((e) => (e.place === null ? [] : [e.place]));
  return (
    <TableRow>
      <TableCell className="font-num tabular text-muted-foreground">{index}</TableCell>
      <TableCell className="font-bold">{guest.name}</TableCell>
      <TableCell className="font-num tabular text-right">{guest.events.length}</TableCell>
      <TableCell className="font-num tabular text-right">{best.length ? `#${Math.min(...best)}` : "–"}</TableCell>
      <TableCell className="text-sm">
        <div className="text-muted-foreground">{day.format(new Date(guest.events[0].startsAt))}</div>
        <div className="mt-1"><TierMark tier={guest.events[0].tier as Tier} tileClassName="size-6" className="text-xs" /> <span className="text-muted-foreground">{guest.events[0].eventName}</span></div>
      </TableCell>
      <TableCell>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!chosen) return setError("Pick a member from the list");
            setBusy(true); setError(null);
            const result = await linkGuestToMember(guest.name, chosen.id);
            setBusy(false);
            if (!result.ok) setError(result.error ?? "Could not link");
          }}
        >
          <Input list={`members-${index}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Link to a member" aria-label={`Link ${guest.name} to a member`} autoComplete="off" className="w-56" />
          <datalist id={`members-${index}`}>{members.map((m) => <option key={m.id} value={label(m)} />)}</datalist>
          <Button type="submit" size="sm" disabled={busy || !chosen}>{busy ? "Linking…" : "Link"}</Button>
        </form>
        {chosen && <p className="mt-1 text-xs">→ <BomIdBadge id={chosen.bom_id} /> {chosen.name}</p>}
        {error && <p role="alert" className="text-destructive mt-1 text-xs">{error}</p>}
      </TableCell>
    </TableRow>
  );
}

/** Non BOM ID names from the results, searchable, 25 per page, each with a way to link it to a member. */
export function NonMembersTable({ guests, members }: { guests: GuestSummary[]; members: Member[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const matches = useMemo(() => guests.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())), [guests, query]);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = matches.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <Input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search a name" aria-label="Search Non BOM ID names" className="pl-9" />
      </div>
      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="text-right">Best place</TableHead>
              <TableHead>Latest event</TableHead>
              <TableHead>Link to a member</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((g, i) => <GuestRow key={g.name.toLowerCase()} guest={g} index={current * PAGE_SIZE + i + 1} members={members} />)}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-6 text-center">{guests.length === 0 ? "No Non BOM ID names in the results." : "No name matches."}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Pagination label="Non BOM ID pages" page={current} pages={pages} onChange={setPage} summary={`${matches.length} of ${guests.length} names`} />
    </div>
  );
}
