import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckinInput } from "@/domain/checkin";
import { check } from "./db";

export type Checkin = {
  id: string; eventId: string; playerId: string | null; guestName: string | null; combos: string[];
  checkedInByEmail: string | null; updatedByEmail: string | null; createdAt: string; updatedAt: string;
};

type Row = { id: string; event_id: string; player_id: string | null; guest_name: string | null; combos: string[]; checked_in_by_email: string | null; updated_by_email: string | null; created_at: string; updated_at: string };
const COLS = "id,event_id,player_id,guest_name,combos,checked_in_by_email,updated_by_email,created_at,updated_at";
const toCheckin = (r: Row): Checkin => ({
  id: r.id, eventId: r.event_id, playerId: r.player_id, guestName: r.guest_name, combos: r.combos,
  checkedInByEmail: r.checked_in_by_email, updatedByEmail: r.updated_by_email, createdAt: r.created_at, updatedAt: r.updated_at,
});

export type Actor = { id: string; email: string };

export interface CheckinRepository {
  /** Everyone checked in at the event, newest first. */
  listForEvent(eventId: string): Promise<Checkin[]>;
  /** How many are checked in at each of these events. */
  countsForEvents(eventIds: string[]): Promise<Map<string, number>>;
  /** Checks someone in, or, when they are already checked in at this event, replaces their combos (who checked them in is kept). */
  save(input: CheckinInput, by: Actor): Promise<void>;
  /** Replaces the combos of one check-in. */
  update(id: string, eventId: string, combos: string[], by: Actor): Promise<void>;
  remove(id: string, eventId: string): Promise<void>;
}

export function supabaseCheckins(client: SupabaseClient): CheckinRepository {
  return {
    async listForEvent(eventId) {
      const { data, error } = await client.from("event_checkins").select(COLS).eq("event_id", eventId).order("created_at", { ascending: false });
      check(error, "Failed to load check-ins");
      return ((data ?? []) as Row[]).map(toCheckin);
    },
    async countsForEvents(eventIds) {
      const counts = new Map<string, number>();
      if (eventIds.length === 0) return counts;
      const { data, error } = await client.from("event_checkins").select("event_id").in("event_id", eventIds);
      check(error, "Failed to load check-ins");
      for (const r of (data ?? []) as { event_id: string }[]) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
      return counts;
    },
    async save({ eventId, playerId, guestName, combos }, by) {
      let find = client.from("event_checkins").select("id").eq("event_id", eventId);
      find = playerId ? find.eq("player_id", playerId) : find.ilike("guest_name", (guestName ?? "").replace(/[\\%_]/g, "\\$&"));
      const { data: existing, error: findError } = await find.maybeSingle();
      check(findError, "Failed to check in");
      if (existing) {
        const { error } = await client.from("event_checkins").update({ combos, updated_by_email: by.email, updated_at: new Date().toISOString() }).eq("id", (existing as { id: string }).id);
        check(error, "Failed to update check-in");
        return;
      }
      const { error } = await client.from("event_checkins").insert({
        event_id: eventId, player_id: playerId, guest_name: guestName, combos, checked_in_by: by.id, checked_in_by_email: by.email, updated_by_email: by.email,
      });
      check(error, "Failed to check in");
    },
    async update(id, eventId, combos, by) {
      const { error } = await client.from("event_checkins").update({ combos, updated_by_email: by.email, updated_at: new Date().toISOString() }).eq("id", id).eq("event_id", eventId);
      check(error, "Failed to update check-in");
    },
    async remove(id, eventId) {
      const { error } = await client.from("event_checkins").delete().eq("id", id).eq("event_id", eventId);
      check(error, "Failed to remove check-in");
    },
  };
}
