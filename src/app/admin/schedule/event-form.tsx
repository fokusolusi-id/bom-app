"use client";
import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { isoToWibLocal, type EventType, type ScheduleEventView } from "@/domain/event";
import { EVENT_TYPE_LABEL } from "@/lib/event-style";
import { saveScheduleEvent } from "../jadwal/actions";

/** Add or edit a schedule event. A break or holiday only needs a date, so the rest of the form disappears for it. */
export function EventForm({ e, communities, defaultCommunity, types, allowBom }: {
  e?: ScheduleEventView; communities: { id: string; name: string }[]; defaultCommunity?: string; types: readonly EventType[]; allowBom: boolean;
}) {
  const [tier, setTier] = useState<EventType>(e?.tier ?? (types.length === 1 ? types[0] : "Ranked"));
  const isBreak = tier === "Break";
  return (
    <ActionForm action={saveScheduleEvent} resetOnSuccess={!e} className="grid gap-3 sm:grid-cols-2">
      {e?.id && <input type="hidden" name="id" value={e.id} />}
      {types.length === 1 ? (
        <input type="hidden" name="tier" value={types[0]} />
      ) : (
        <NativeSelect name="tier" aria-label="Competition type" value={tier} onChange={(ev) => setTier(ev.target.value as EventType)} className={isBreak ? "sm:col-span-2" : ""}>
          {types.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABEL(t)}</option>)}
        </NativeSelect>
      )}
      {isBreak ? (
        <label className="text-muted-foreground flex flex-col gap-1 text-xs sm:col-span-2">Date of the break
          <Input name="starts_on" type="date" defaultValue={e ? isoToWibLocal(e.starts_at).slice(0, 10) : ""} required className="text-base text-white" />
        </label>
      ) : (
        <>
          <NativeSelect name="sub_community_id" aria-label="Community" defaultValue={e ? (e.sub_community_id ?? "") : (defaultCommunity ?? "")}>
            {allowBom && <option value="">All communities (BOM)</option>}
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </NativeSelect>
          <Input name="name" defaultValue={e?.name === "Break / Holiday" ? "" : e?.name} placeholder="Event name (e.g. Weekly Ranked)" aria-label="Event name" maxLength={80} required className="sm:col-span-2" />
          <label className="text-muted-foreground flex flex-col gap-1 text-xs">Date and time (WIB)
            <Input name="starts_at" type="datetime-local" defaultValue={e ? isoToWibLocal(e.starts_at) : ""} required className="text-base text-white" />
          </label>
          <label className="text-muted-foreground flex flex-col gap-1 text-xs">Place (optional)
            <Input name="place" defaultValue={e?.place ?? ""} placeholder="Empty = the community's address" maxLength={120} className="text-base text-white" />
          </label>
          <label className="text-muted-foreground flex flex-col gap-1 text-xs sm:col-span-2">Challonge link (optional)
            <Input name="challonge_url" type="url" defaultValue={e?.challonge_url ?? ""} placeholder="https://challonge.com/your_bracket" maxLength={200} className="text-base text-white" />
          </label>
        </>
      )}
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={e?.is_active ?? true} /> Show on website</label>
      <Button type="submit" className="sm:col-span-2">{e ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}
