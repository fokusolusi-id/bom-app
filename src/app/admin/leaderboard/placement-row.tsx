"use client";
import { Crown, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form-state";
import { removePlacement, setPlacement } from "./actions";

/** One participant of an event: place, name, points, and icon buttons to edit the place and Tiger King or to remove them. */
export function PlacementRow({ eventId, playerId, name, bomId, place, tigerKing, points }: {
  eventId: string; playerId: string; name: string; bomId: string; place: number | null; tigerKing: boolean; points: number;
}) {
  const [editing, setEditing] = useState(false);
  const save = async (prev: FormState, data: FormData) => {
    const result = await setPlacement(prev, data);
    if (result.ok) setEditing(false);
    return result;
  };

  if (editing) {
    return (
      <li className="bg-muted/40 rounded-md p-2">
        <ActionForm action={save} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="player_id" value={playerId} />
          <span className="min-w-24 flex-1 font-bold"><BomIdBadge id={bomId} /> {name}</span>
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
      <span>
        <span className="text-primary inline-block w-8 font-bold">{place === null ? "–" : `#${place}`}</span><BomIdBadge id={bomId} className="mr-2" />{name}
        {tigerKing && <Crown className="mx-1 inline size-4 align-text-bottom text-yellow-400" aria-label="Tiger King" />}
        <span className="text-muted-foreground"> · {points} pts</span>
      </span>
      <span className="flex items-center gap-1">
        <Button type="button" variant="outline" size="sm" className="w-8 px-0" onClick={() => setEditing(true)} aria-label={`Edit ${name}`}><Pencil aria-hidden /></Button>
        <ActionForm action={removePlacement.bind(null, eventId, playerId)}><Button variant="outline" size="sm" className="w-8 px-0" aria-label={`Remove ${name}`}><Trash2 aria-hidden /></Button></ActionForm>
      </span>
    </li>
  );
}
