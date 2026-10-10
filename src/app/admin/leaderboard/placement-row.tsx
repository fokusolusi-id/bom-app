"use client";
import { Crown, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form-state";
import { removeResultRow, setPlacement } from "./actions";

/** One participant of an event: place, name, points, and icon buttons to edit the place and Tiger King or to remove them. */
export function PlacementRow({ eventId, rowId, playerId, name, bomId, place, tigerKing, points }: {
  eventId: string; rowId: string; playerId: string | null; name: string; bomId: string | null; place: number | null; tigerKing: boolean; points: number;
}) {
  const [editing, setEditing] = useState(false);
  const save = async (prev: FormState, data: FormData) => {
    const result = await setPlacement(prev, data);
    if (result.ok) setEditing(false);
    return result;
  };

  // A guest has no member record: they can only be removed here; to change them, edit the list.
  const isGuest = playerId === null;
  if (editing && playerId) {
    return (
      <li className="bg-muted/40 rounded-md p-2">
        <ActionForm action={save} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="player_id" value={playerId} />
          <span className="min-w-24 flex-1 font-bold">{bomId && <BomIdBadge id={bomId} />} {name}</span>
          <Input name="place" type="number" min={1} max={999} defaultValue={place ?? ""} placeholder="Place" aria-label="Place" className="w-24" />
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="tiger_king" defaultChecked={tigerKing} /><Crown className="size-4 text-yellow-400" aria-hidden />Tiger King</label>
          <Button type="submit" size="sm">Save</Button>
          <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={() => setEditing(false)} aria-label="Cancel"><X aria-hidden /></Button>
        </ActionForm>
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="min-w-0 flex-1">
        <span className="text-primary inline-block w-8 font-bold">{place === null ? "–" : `#${place}`}</span>{bomId ? <BomIdBadge id={bomId} className="mr-2" /> : <span className="text-muted-foreground mr-2 rounded border px-1.5 py-0.5 text-xs uppercase">Non BOM ID</span>}{name}
        {tigerKing && <Crown className="mx-1 inline size-4 align-text-bottom text-yellow-400" aria-label="Tiger King" />}
      </span>
      <span className="font-num tabular w-20 shrink-0 text-right font-bold">{isGuest ? <span className="text-muted-foreground text-xs font-normal">no points</span> : `${points} pts`}</span>
      <span className="flex items-center gap-1">
        {!isGuest && <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={() => setEditing(true)} aria-label={`Edit ${name}`}><Pencil aria-hidden /></Button>}
        <ActionForm action={removeResultRow.bind(null, eventId, rowId)}><Button variant="outline" size="sm" className="w-8 px-0" aria-label={`Remove ${name}`}><Trash2 aria-hidden /></Button></ActionForm>
      </span>
    </li>
  );
}
