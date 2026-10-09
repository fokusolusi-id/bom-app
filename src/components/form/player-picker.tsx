"use client";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { formatBomId } from "@/domain/profile";

export type PickerPlayer = { id: string; name: string; bomId: string };

/** Ordered multi-select of existing players. Submits one hidden `name` input per pick, in order. */
export function PlayerPicker({ name, players, defaultIds = [], max }: {
  name: string; players: PickerPlayer[]; defaultIds?: string[]; max: number;
}) {
  const [ids, setIds] = useState(defaultIds);
  const anchor = useRef<HTMLSpanElement>(null);
  const byId = new Map(players.map((p) => [p.id, p]));
  const available = players.filter((p) => !ids.includes(p.id));

  // Follow the parent form's reset (ActionForm resets after a successful create).
  useEffect(() => {
    const form = anchor.current?.closest("form");
    const onReset = () => setIds(defaultIds);
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [defaultIds]);

  const move = (i: number, d: -1 | 1) =>
    setIds((cur) => { const n = [...cur]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });

  return (
    <div className="space-y-2">
      <span ref={anchor} hidden />
      {ids.map((id) => <input key={id} type="hidden" name={name} value={id} />)}
      <ul className="space-y-1">
        {ids.map((id, i) => {
          const p = byId.get(id);
          return (
            <li key={id} className="bg-secondary flex items-center gap-2 rounded px-2 py-1 text-sm">
              <span className="flex-1 truncate font-bold">{p?.name ?? "Unknown"} <span className="text-muted-foreground font-normal">{p ? formatBomId(p.bomId) : ""}</span></span>
              <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Naikkan"><ArrowUp /></Button>
              <Button type="button" variant="ghost" size="sm" disabled={i === ids.length - 1} onClick={() => move(i, 1)} aria-label="Turunkan"><ArrowDown /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIds((cur) => cur.filter((x) => x !== id))} aria-label="Hapus"><X /></Button>
            </li>
          );
        })}
        {ids.length === 0 && <li className="text-muted-foreground text-sm">Belum ada anggota.</li>}
      </ul>
      {ids.length < max && (
        <NativeSelect aria-label="Tambah anggota" value="" onChange={(e) => e.target.value && setIds((cur) => [...cur, e.target.value])}>
          <option value="">+ Tambah anggota</option>
          {available.map((p) => <option key={p.id} value={p.id}>{p.name} {formatBomId(p.bomId)}</option>)}
        </NativeSelect>
      )}
    </div>
  );
}
