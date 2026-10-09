"use client";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/input";
import { formatBomId } from "@/domain/profile";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { MediaUpload } from "@/components/form/media-upload";
import { PHOTO_FIELD } from "@/domain/team";

export type PickerPlayer = { id: string; name: string; bomId: string; photo: string | null };

/** Ordered multi-select of existing players. Submits one hidden `name` input per pick, in order, plus each pick's photo (`photo:<id>`). */
export function PlayerPicker({ name, players, defaultIds = [], max, preparePhoto }: {
  name: string; players: PickerPlayer[]; defaultIds?: string[]; max: number;
  preparePhoto: (contentType: string) => Promise<{ path: string; token: string } | { error: string }>;
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
            <li key={id} className="bg-secondary space-y-2 rounded px-2 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate font-bold">{p?.name ?? "Unknown"} {p && <BomIdBadge id={p.bomId} className="ml-1 align-middle" />}</span>
                <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Naikkan"><ArrowUp /></Button>
                <Button type="button" variant="ghost" size="sm" disabled={i === ids.length - 1} onClick={() => move(i, 1)} aria-label="Turunkan"><ArrowDown /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIds((cur) => cur.filter((x) => x !== id))} aria-label="Hapus"><X /></Button>
              </div>
              <MediaUpload name={`${PHOTO_FIELD}${id}`} label={`Foto ${p?.name ?? ""}`} defaultPath={p?.photo} prepare={preparePhoto} kind="image" />
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
