"use client";
import { Camera, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { MAX_CHECKIN_COMBOS, parseScannedBomId } from "@/domain/checkin";
import { formatBomId } from "@/domain/profile";
import type { FormState } from "@/lib/form-state";
import type { Checkin } from "@/server/checkins";
import { removeCheckin, saveCheckin } from "../actions";
import { QrScanner } from "./qr-scanner";

type Member = { id: string; name: string; bom_id: string };
const memberLabel = (p: Member) => `${p.name} ${formatBomId(p.bom_id)}`;
const squash = (v: string) => v.toLowerCase().replace(/[\s-[\]]/g, "");
const PAGE_SIZE = 10;
const time = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

/** The member a typed text points to: the exact suggestion, a blader name, or a BOM ID ("BoM-001", "bom 1" or "1"). */
function findMember(members: Member[], text: string) {
  const q = text.trim();
  if (!q) return undefined;
  const typed = /^(?:bom)?[\s-]*(\d+)$/i.exec(q)?.[1];
  return members.find((p) => memberLabel(p).toLowerCase() === q.toLowerCase())
    ?? members.find((p) => p.name.toLowerCase() === q.toLowerCase())
    ?? members.find((p) => squash(p.bom_id) === squash(q))
    ?? (typed ? members.find((p) => Number(/\d+/.exec(p.bom_id)?.[0]) === Number(typed)) : undefined);
}

/** Who is being checked in: a member, or someone without a BOM ID (a name). */
type Subject = { kind: "member"; member: Member } | { kind: "guest"; name: string };

/** Take check-ins at one event: scan a member card or search, add the combos, save; and correct the ones already taken. */
export function CheckinPanel({ eventId, members, checkins }: { eventId: string; members: Member[]; checkins: Checkin[] }) {
  const [scanning, setScanning] = useState(false);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [combos, setCombos] = useState<string[]>([""]);
  const [search, setSearch] = useState("");
  const [guest, setGuest] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  // Finding someone in the checked-in list: typed, or by scanning their card.
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [findScanning, setFindScanning] = useState(false);
  const [findNote, setFindNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const existingFor = (s: Subject) => checkins.find((c) => (s.kind === "member" ? c.playerId === s.member.id : c.guestName?.toLowerCase() === s.name.toLowerCase()));
  const nameOf = (c: Checkin) => (c.playerId ? byId.get(c.playerId)?.name : c.guestName) ?? "?";

  /** Selects someone; if they are already checked in, their combos are loaded for editing. */
  function pick(s: Subject) {
    setSubject(s);
    setCombos(existingFor(s)?.combos.length ? [...existingFor(s)!.combos] : [""]);
    setNote(existingFor(s) ? "Already checked in: saving updates their combos." : null);
    setScanning(false);
  }

  function onScan(text: string) {
    const bomId = parseScannedBomId(text);
    if (!bomId) { setScanning(false); setNote("That QR code is not a BOM member card. Search the player, or check them in as a non-member."); return; }
    const member = members.find((m) => m.bom_id.toLowerCase() === bomId);
    if (member) pick({ kind: "member", member });
    else { setScanning(false); setNote(`${bomId.toUpperCase()} is not a member. Check them in as a non-member below.`); setGuest(""); }
  }

  function onFindScan(text: string) {
    setFindScanning(false);
    const bomId = parseScannedBomId(text);
    if (!bomId) return setFindNote("That QR code is not a BOM member card.");
    setFindNote(null);
    setQuery(bomId.toUpperCase());
    setPage(0);
  }

  // The checked-in list narrowed by what was typed or scanned: a name, a BOM ID ("bom-001", "1") or a combo.
  const q = query.trim().toLowerCase();
  const qMember = findMember(members, query);
  const visible = q === "" ? checkins : checkins.filter((c) => {
    const m = c.playerId ? byId.get(c.playerId) : undefined;
    return [nameOf(c), m?.bom_id ?? "", ...c.combos].some((v) => v.toLowerCase().includes(q) || squash(v).includes(squash(q))) || (qMember !== undefined && c.playerId === qMember.id);
  });
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const pageRows = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const notCheckedIn = q !== "" && visible.length === 0 ? qMember : undefined;

  const found = findMember(members, search);
  const setCombo = (i: number, v: string) => setCombos((cs) => cs.map((c, j) => (j === i ? v : c)));

  const save = async (prev: FormState, data: FormData) => {
    const result = await saveCheckin(prev, data);
    if (result.ok) { setSubject(null); setCombos([""]); setSearch(""); setGuest(""); setNote(null); }
    return result;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Check in a player</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!subject && (
            <>
              {scanning ? (
                <QrScanner onScan={onScan} onClose={() => setScanning(false)} />
              ) : (
                <Button type="button" size="lg" className="w-full" onClick={() => { setNote(null); setScanning(true); }}><Camera aria-hidden />Scan member card</Button>
              )}
              {note && <p role="status" className="text-sm text-yellow-400">{note}</p>}

              <div className="space-y-2">
                <label htmlFor="member-search" className="text-sm font-bold">Or search a member</label>
                <div className="flex gap-2">
                  <Input id="member-search" list="checkin-members" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Blader name or BOM ID" autoComplete="off" className="text-base" />
                  <Button type="button" variant="outline" disabled={!found} onClick={() => found && pick({ kind: "member", member: found })}>Select</Button>
                </div>
                <datalist id="checkin-members">{members.map((p) => <option key={p.id} value={memberLabel(p)} />)}</datalist>
              </div>

              <div className="space-y-2">
                <label htmlFor="guest-name" className="text-sm font-bold">Not a member (no BOM ID)</label>
                <div className="flex gap-2">
                  <Input id="guest-name" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Name" maxLength={60} className="text-base" />
                  <Button type="button" variant="outline" disabled={!guest.trim()} onClick={() => pick({ kind: "guest", name: guest.trim().replace(/\s+/g, " ") })}>Select</Button>
                </div>
              </div>
            </>
          )}

          {subject && (
            <ActionForm action={save} className="space-y-4">
              <input type="hidden" name="event_id" value={eventId} />
              <input type="hidden" name="player_id" value={subject.kind === "member" ? subject.member.id : ""} />
              {subject.kind === "guest" && <input type="hidden" name="guest_name" value={subject.name} />}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <UserRound className="size-5 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <div className="truncate font-bold">{subject.kind === "member" ? subject.member.name : subject.name}</div>
                    <div className="text-muted-foreground text-sm">{subject.kind === "member" ? formatBomId(subject.member.bom_id) : "Non BOM ID"}</div>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => { setSubject(null); setNote(null); }}><X aria-hidden />Change</Button>
              </div>
              {note && <p role="status" className="text-sm text-yellow-400">{note}</p>}

              <div className="space-y-3">
                <div className="text-sm font-bold">Combos (up to {MAX_CHECKIN_COMBOS})</div>
                {combos.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input name="combos" value={c} onChange={(e) => setCombo(i, e.target.value)} placeholder="AP 1-80 LR" maxLength={40} aria-label={`Combo ${i + 1}`} className="font-mono text-base" />
                    {combos.length > 1 && <Button type="button" variant="outline" size="sm" className="h-10" aria-label={`Remove combo ${i + 1}`} onClick={() => setCombos((cs) => cs.filter((_, j) => j !== i))}><X aria-hidden /></Button>}
                  </div>
                ))}
                {combos.length < MAX_CHECKIN_COMBOS && <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => setCombos((cs) => [...cs, ""])}><Plus aria-hidden />Add another combo</Button>}
              </div>
              <Button type="submit" size="lg" className="w-full">{existingFor(subject) ? "Update check-in" : "Check in"}</Button>
            </ActionForm>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3" aria-labelledby="checked-in-title">
        <h2 id="checked-in-title" className="text-2xl">Checked in ({checkins.length})</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); setFindNote(null); }} placeholder="Find a player: name, BOM ID or combo" aria-label="Find a checked-in player" autoComplete="off" className="text-base" />
            {query && <Button type="button" variant="outline" aria-label="Clear the search" onClick={() => { setQuery(""); setPage(0); setFindNote(null); }}><X aria-hidden /></Button>}
            <Button type="button" variant="outline" aria-label="Scan a member card to find them" onClick={() => { setFindNote(null); setFindScanning((v) => !v); }}><Camera aria-hidden /><span className="hidden sm:inline">Scan</span></Button>
          </div>
          {findScanning && <QrScanner onScan={onFindScan} onClose={() => setFindScanning(false)} />}
          {findNote && <p role="status" className="text-sm text-yellow-400">{findNote}</p>}
        </div>
        {removeError && <p role="alert" className="text-destructive text-sm">{removeError}</p>}
        {notCheckedIn && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <p className="text-sm"><b>{notCheckedIn.name}</b> {formatBomId(notCheckedIn.bom_id)} is not checked in yet.</p>
            <Button type="button" size="sm" onClick={() => { pick({ kind: "member", member: notCheckedIn }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Check in</Button>
          </div>
        )}
        {checkins.length === 0 ? <p className="text-muted-foreground text-sm">Nobody yet.</p> : visible.length === 0 && !notCheckedIn ? <p className="text-muted-foreground text-sm">Nobody checked in matches.</p> : (
          <ul className="divide-y rounded-md border">
            {pageRows.map((c) => {
              const member = c.playerId ? byId.get(c.playerId) : undefined;
              return (
                <li key={c.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold">{nameOf(c)} <span className="text-muted-foreground text-sm font-normal">{member ? formatBomId(member.bom_id) : "Non BOM ID"}</span></div>
                    {c.combos.length > 0 ? <ul className="font-mono text-sm">{c.combos.map((x, i) => <li key={i}>{x}</li>)}</ul> : <div className="text-muted-foreground text-sm">No combos</div>}
                    <div className="text-muted-foreground text-xs">By {c.checkedInByEmail ?? "unknown"} · {time.format(new Date(c.createdAt))}{c.updatedByEmail && c.updatedAt !== c.createdAt ? ` · edited by ${c.updatedByEmail}` : ""}</div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button type="button" variant="outline" size="sm" aria-label={`Edit ${nameOf(c)}`} onClick={() => { pick(member ? { kind: "member", member } : { kind: "guest", name: c.guestName ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil aria-hidden /></Button>
                    <Button type="button" variant="outline" size="sm" aria-label={`Remove ${nameOf(c)}`} onClick={() => { if (!confirm(`Remove ${nameOf(c)} from the check-in?`)) return; startTransition(async () => { const r = await removeCheckin(eventId, c.id); setRemoveError(r.error ?? null); }); }}><Trash2 aria-hidden /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination label="Checked-in pages" page={current} pages={pages} onChange={setPage} summary={`${visible.length} of ${checkins.length} players`} />
      </section>
    </div>
  );
}
