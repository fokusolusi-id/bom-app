import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlacementInput, ResultRow } from "@/domain/result";
import type { PlacementRow } from "@/domain/types";
import { TIER_LABELS } from "@/domain/tier";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";


/** The top eight of an event, in order, with its sub community. */
export type Podium = { name: string; tier: string; startsAt: string; challongeUrl: string | null; communityLogo: string | null; communityName: string | null; participants: number; top: { place: number; name: string; bomId: string | null; tigerKing: boolean; combos: string[] }[] };

export type GuestSummary = { name: string; events: { eventId: string; eventName: string; tier: string; startsAt: string; place: number | null }[] };

export interface ResultsRepository {
  /** The most recent past events (shown on the site) with a member in the top eight, newest first. Guests without a BOM ID are left out. */
  recentPodiums(nowIso: string, limit: number): Promise<Podium[]>;
  /** A player's places at events, newest first. Only events shown on the site. */
  placementsForPlayer(playerId: string): Promise<PlacementRow[]>;
  /** Places recorded for these events, for the admin. */
  placementsForEvents(eventIds: string[]): Promise<{ id: string; event_id: string; player_id: string | null; guest_name: string | null; place: number | null; tiger_king: boolean; combos: string[] }[]>;
  /** Removes one row of an event's results, a guest or a member. */
  removeRow(eventId: string, rowId: string): Promise<void>;
  /** Deletes every result row of the event, members and guests. The event itself stays in the schedule. */
  clearEvent(eventId: string): Promise<void>;
  /** People in results without a BOM ID (guests), by name, with the events they took part in. */
  guests(): Promise<GuestSummary[]>;
  /** Makes every result of this guest name belong to a member instead. */
  linkGuest(guestName: string, playerId: string): Promise<void>;
  setPlacement(input: PlacementInput): Promise<void>;
  /** Makes these rows the whole result of the event: new ones are added, changed ones updated, the rest removed. */
  replaceForEvent(eventId: string, rows: ResultRow[]): Promise<void>;
}

export function supabaseResults(client: SupabaseClient): ResultsRepository {
  return {
    async recentPodiums(nowIso, limit) {
      const { data, error } = await client
        .from("schedule_events")
        .select("name,tier,starts_at,challonge_url,community:sub_communities(name,image_path),event_placements(place,tiger_king,combos,guest_name,player:players(name,bom_id))")
        // Unrank included: it earns no points, but its results are shown like any other event.
        .in("tier", TIER_LABELS).eq("is_active", true).lte("starts_at", nowIso)
        .order("starts_at", { ascending: false }).limit(30);
      check(error, "Failed to load latest results");
      type Row = { name: string; tier: string; starts_at: string; challonge_url: string | null; community: { name: string; image_path: string | null } | null; event_placements: { place: number | null; tiger_king: boolean; combos: string[]; guest_name: string | null; player: { name: string; bom_id: string } | null }[] };
      return ((data ?? []) as unknown as Row[])
        .map((e) => ({
          name: e.name, tier: e.tier, startsAt: e.starts_at, challongeUrl: e.challonge_url, communityLogo: e.community?.image_path ?? null, communityName: e.community?.name ?? null, participants: e.event_placements.length,
          top: e.event_placements
            // Places 1 to 8 as they were played, members and guests alike; a guest (Non BOM ID) has no profile.
            .flatMap((p) => (p.place !== null && p.place <= 8 && (p.player || p.guest_name) ? [{ place: p.place, name: p.player?.name ?? p.guest_name!, bomId: p.player?.bom_id ?? null, tigerKing: p.tiger_king, combos: p.combos ?? [] }] : []))
            .sort((a, b) => a.place - b.place || a.name.localeCompare(b.name)),
        }))
        .filter((p) => p.top.length > 0)
        .slice(0, limit);
    },
    async placementsForPlayer(playerId) {
      const { data, error } = await client
        .from("event_placements")
        .select("place,event:schedule_events!inner(id,name,tier,starts_at,is_active)")
        .eq("player_id", playerId);
      check(error, "Failed to load placements");
      const rows = (data ?? []) as unknown as (PlacementRow & { event: { is_active: boolean } })[];
      return rows.filter((r) => r.event.is_active).sort((a, b) => b.event.starts_at.localeCompare(a.event.starts_at));
    },
    async placementsForEvents(eventIds) {
      if (eventIds.length === 0) return [];
      const { data, error } = await client.from("event_placements").select("id,event_id,player_id,guest_name,place,tiger_king,combos").in("event_id", eventIds);
      check(error, "Failed to load placements");
      return (data ?? []) as { id: string; event_id: string; player_id: string | null; guest_name: string | null; place: number | null; tiger_king: boolean; combos: string[] }[];
    },
    async setPlacement({ eventId, playerId, place, tigerKing, combos }) {
      // One Tiger King per event: giving it to this player takes it from whoever had it.
      if (tigerKing) {
        const { error: clearError } = await client.from("event_placements").update({ tiger_king: false }).eq("event_id", eventId).neq("player_id", playerId);
        check(clearError, "Failed to update Tiger King");
      }
      const { error } = await client.from("event_placements").upsert({ event_id: eventId, player_id: playerId, place, tiger_king: tigerKing, combos }, { onConflict: "event_id,player_id" });
      check(error, "Failed to save placement");
    },
    async replaceForEvent(eventId, rows) {
      const members = rows.flatMap((r) => (r.playerId ? [{ event_id: eventId, player_id: r.playerId, place: r.place, tiger_king: r.tigerKing, combos: r.combos }] : []));
      const guests = rows.flatMap((r) => (r.guestName ? [{ event_id: eventId, guest_name: r.guestName, place: r.place, tiger_king: false, combos: r.combos }] : []));
      if (members.length) {
        const { error } = await client.from("event_placements").upsert(members, { onConflict: "event_id,player_id" });
        check(error, "Failed to save results");
      }
      // Members that are no longer in the list, and last time's guests (the list holds every guest again), go.
      let removeOthers = client.from("event_placements").delete().eq("event_id", eventId);
      removeOthers = members.length ? removeOthers.or(`guest_name.not.is.null,player_id.not.in.(${members.map((m) => m.player_id).join(",")})`) : removeOthers;
      const { error: removeError } = await removeOthers;
      check(removeError, "Failed to save results");
      if (guests.length) {
        const { error } = await client.from("event_placements").insert(guests);
        check(error, "Failed to save results");
      }
    },
    async guests() {
      const { data, error } = await client
        .from("event_placements")
        .select("guest_name,place,event:schedule_events!inner(id,name,tier,starts_at)")
        .not("guest_name", "is", null);
      check(error, "Failed to load the Non BOM ID list");
      const byName = new Map<string, GuestSummary>();
      for (const r of (data ?? []) as unknown as { guest_name: string; place: number | null; event: { id: string; name: string; tier: string; starts_at: string } }[]) {
        const key = r.guest_name.toLowerCase();
        const entry = byName.get(key) ?? { name: r.guest_name, events: [] };
        entry.events.push({ eventId: r.event.id, eventName: r.event.name, tier: r.event.tier, startsAt: r.event.starts_at, place: r.place });
        byName.set(key, entry);
      }
      return [...byName.values()]
        .map((g) => ({ ...g, events: g.events.sort((a, b) => b.startsAt.localeCompare(a.startsAt)) }))
        .sort((a, b) => b.events.length - a.events.length || a.name.localeCompare(b.name));
    },
    async linkGuest(guestName, playerId) {
      const { error } = await client.from("event_placements").update({ player_id: playerId, guest_name: null }).ilike("guest_name", guestName.replace(/[\\%_]/g, "\\$&"));
      if (error?.message.includes("event_placements_event_player_key")) throw new Error("That member already has a result in one of these events. Remove one of them first.");
      check(error, "Failed to link the results");
    },
    async clearEvent(eventId) {
      const { error } = await client.from("event_placements").delete().eq("event_id", eventId);
      check(error, "Failed to delete the results");
    },
    async removeRow(eventId, rowId) {
      const { error } = await client.from("event_placements").delete().eq("event_id", eventId).eq("id", rowId);
      check(error, "Failed to remove result");
    },
  };
}

/** Results for public pages. Nothing without Supabase. */
export function publicResults(): Pick<ResultsRepository, "recentPodiums" | "placementsForPlayer"> {
  return hasSupabase() ? supabaseResults(createPublicClient()) : { recentPodiums: async () => [], placementsForPlayer: async () => [] };
}
