"use client";
import { ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AGE_GROUPS, HEAR_FROM } from "@/domain/join-request";
import { PLAYER_ROLES, type PlayerRole, type PlayerStatus } from "@/domain/types";
import type { FormState } from "@/lib/form-state";
import { deletePlayer, savePlayer } from "../players/actions";

export type PlayerRowData = {
  id: string; bom_id: string; name: string; points: number; status: PlayerStatus; role: PlayerRole; created_at: string | null;
  full_name: string | null; whatsapp: string | null; address: string | null; age_group: string | null; guardian_name: string | null;
  guardian_whatsapp: string | null; hear_from: string | null; photo_consent: boolean; payment_proof_url: string | null;
};

const PAGE_SIZE = 25;
const roleLabel = new Map<string, string>(PLAYER_ROLES);
const joined = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Jakarta" });
const label = "text-muted-foreground flex flex-col gap-1 text-xs uppercase";
const input = "text-base text-white";

const roleTone: Record<PlayerRole, string> = { member: "text-muted-foreground", organizer: "text-primary", admin: "text-yellow-400" };

function EditForm({ p, onDone }: { p: PlayerRowData; onDone: () => void }) {
  const [minor, setMinor] = useState(p.age_group === "under12");
  const save = async (prev: FormState, data: FormData) => {
    const result = await savePlayer(prev, data);
    if (result.ok) onDone();
    return result;
  };
  return (
    <ActionForm action={save} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={p.id} />

      <h3 className="text-primary text-sm font-bold uppercase sm:col-span-2">Member</h3>
      <label className={label}>Blader name<Input name="name" defaultValue={p.name} maxLength={40} required className={input} /></label>
      <label className={label}>BOM ID<Input name="bom_id" defaultValue={p.bom_id} maxLength={20} required className={input} /></label>
      <label className={label}>Role
        <NativeSelect name="role" defaultValue={p.role} className={input}>{PLAYER_ROLES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</NativeSelect>
      </label>
      <label className={label}>Status
        <NativeSelect name="status" defaultValue={p.status} className={input}>
          <option value="active">Active (on the leaderboard)</option>
          <option value="registered">Registered (not yet active)</option>
        </NativeSelect>
      </label>
      <label className={label}>Joined<Input value={p.created_at ? joined.format(new Date(p.created_at)) : "-"} readOnly disabled className={input} /></label>

      <h3 className="text-primary text-sm font-bold uppercase sm:col-span-2">Membership details</h3>
      <label className={label}>Full name<Input name="full_name" defaultValue={p.full_name ?? ""} maxLength={60} className={input} /></label>
      <label className={label}>WhatsApp number<Input name="whatsapp" type="tel" defaultValue={p.whatsapp ?? ""} maxLength={20} className={input} /></label>
      <label className={label}>Age group
        <NativeSelect name="age_group" defaultValue={p.age_group ?? ""} onChange={(e) => setMinor(e.target.value === "under12")} className={input}>
          <option value="">-</option>
          {AGE_GROUPS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </NativeSelect>
      </label>
      <label className={label}>Heard about BOM from
        <NativeSelect name="hear_from" defaultValue={p.hear_from ?? ""} className={input}>
          <option value="">-</option>
          {HEAR_FROM.map((h) => <option key={h} value={h}>{h}</option>)}
        </NativeSelect>
      </label>
      {minor && (
        <>
          <label className={label}>Guardian name<Input name="guardian_name" defaultValue={p.guardian_name ?? ""} maxLength={60} required className={input} /></label>
          <label className={label}>Guardian WhatsApp<Input name="guardian_whatsapp" type="tel" defaultValue={p.guardian_whatsapp ?? ""} maxLength={20} required className={input} /></label>
        </>
      )}
      <label className={`${label} sm:col-span-2`}>Address<Input name="address" defaultValue={p.address ?? ""} maxLength={300} className={input} /></label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="photo_consent" defaultChecked={p.photo_consent} /> Photo and video consent</label>
      <p className="text-muted-foreground text-sm sm:col-span-2">
        {p.payment_proof_url ? <a href={p.payment_proof_url} target="_blank" rel="noreferrer" className="text-primary underline">View payment screenshot</a> : "No payment screenshot."}
      </p>
      <Button type="submit" className="sm:col-span-2">Save</Button>
    </ActionForm>
  );
}

/** Every player in a searchable table, with edit and delete in a dialog on the right of each row. */
export function PlayersTable({ players }: { players: PlayerRowData[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PlayerRowData | null>(null);
  const [deleting, setDeleting] = useState<PlayerRowData | null>(null);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    const squash = (v: string) => v.toLowerCase().replace(/[\s-]/g, "");
    return players.filter((p) =>
      [p.name, p.bom_id, p.full_name ?? "", p.whatsapp ?? "", roleLabel.get(p.role) ?? "", p.status].some((v) => v.toLowerCase().includes(q) || squash(v).includes(squash(q))),
    );
  }, [players, query]);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = matches.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const remove = async () => {
    const result = await deletePlayer(deleting!.id);
    if (result.ok) setDeleting(null);
    return result;
  };
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <Input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search name, BOM ID, WhatsApp or role" aria-label="Search members" className="pl-9" />
      </div>
      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead className="w-32 whitespace-nowrap">BOM ID</TableHead>
              <TableHead>Blader</TableHead>
              <TableHead>Full name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell className="font-num tabular text-muted-foreground">{current * PAGE_SIZE + i + 1}</TableCell>
                <TableCell className="whitespace-nowrap"><BomIdBadge id={p.bom_id} className="whitespace-nowrap" /></TableCell>
                <TableCell className="font-bold">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.full_name ?? "-"}</TableCell>
                <TableCell className={`font-bold ${roleTone[p.role]}`}>{roleLabel.get(p.role)}</TableCell>
                <TableCell className={p.status === "active" ? "" : "text-muted-foreground"}>{p.status === "active" ? "Active" : "Registered"}</TableCell>
                <TableCell>
                  <span className="flex justify-end gap-1">
                    <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Pencil aria-hidden /></Button>
                    <Button type="button" variant="outline" size="sm" className="text-destructive w-8 px-0" onClick={() => { setDeleteError(null); setDeleting(p); }} aria-label={`Delete ${p.name}`}><Trash2 aria-hidden /></Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {matches.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">No member matches &ldquo;{query}&rdquo;.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <nav aria-label="Members pages" className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft aria-hidden />Previous</Button>
        <span className="text-muted-foreground text-sm">Page {current + 1} of {pages} · {matches.length} of {players.length} members</span>
        <Button type="button" variant="outline" size="sm" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Next<ChevronRight aria-hidden /></Button>
      </nav>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.name}` : "Edit member"} wide>
        {editing && <EditForm key={editing.id} p={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete member">
        {deleting && (
          <div className="space-y-4">
            <p>Delete <strong>{deleting.name}</strong> <BomIdBadge id={deleting.bom_id} />?</p>
            <p className="text-muted-foreground text-sm">This removes the member, their membership details and their results. Points of everyone else are recalculated. It cannot be undone.</p>
            {deleteError && <p role="alert" className="text-destructive text-sm">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={async () => { const r = await remove(); if (!r.ok) setDeleteError(r.error ?? "Could not delete"); }}>Delete member</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
