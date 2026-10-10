import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduleEventInput, ScheduleEventView } from "@/domain/event";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface ScheduleEventRepository {
  /** Events starting in [fromIso, toIso). Admin screens pass `includeInactive`. */
  between(fromIso: string, toIso: string, opts?: { includeInactive?: boolean }): Promise<ScheduleEventView[]>;
  /** Active events from `fromIso` on, soonest first. */
  upcoming(fromIso: string, limit: number): Promise<ScheduleEventView[]>;
  get(id: string): Promise<ScheduleEventView | null>;
  save(input: ScheduleEventInput): Promise<void>;
  /** The Challonge bracket the results came from, or null to clear it. */
  setChallongeUrl(id: string, url: string | null): Promise<void>;
  remove(id: string): Promise<void>;
}

const COLS = "id,sub_community_id,name,starts_at,place,tier,is_active,challonge_url,community:sub_communities(name,image_path,address)";

export function supabaseScheduleEvents(client: SupabaseClient): ScheduleEventRepository {
  const rows = (data: unknown) => (data ?? []) as unknown as ScheduleEventView[];
  return {
    async between(fromIso, toIso, opts) {
      let q = client.from("schedule_events").select(COLS).gte("starts_at", fromIso).lt("starts_at", toIso).order("starts_at");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error, "Failed to load schedule");
      return rows(data);
    },
    async upcoming(fromIso, limit) {
      const { data, error } = await client.from("schedule_events").select(COLS).eq("is_active", true).gte("starts_at", fromIso).order("starts_at").limit(limit);
      check(error, "Failed to load upcoming events");
      return rows(data);
    },
    async get(id) {
      const { data, error } = await client.from("schedule_events").select(COLS).eq("id", id).maybeSingle();
      check(error, "Failed to load event");
      return (data as unknown as ScheduleEventView | null) ?? null;
    },
    async save(input) {
      const { id, ...row } = input;
      const { error } = id ? await client.from("schedule_events").update(row).eq("id", id) : await client.from("schedule_events").insert(row);
      check(error, "Failed to save event");
    },
    async setChallongeUrl(id, url) {
      const { error } = await client.from("schedule_events").update({ challonge_url: url }).eq("id", id);
      check(error, "Failed to save the Challonge link");
    },
    async remove(id) {
      const { error } = await client.from("schedule_events").delete().eq("id", id);
      check(error, "Failed to delete event");
    },
  };
}

/** Public reads use the cookie-less client so pages stay statically cacheable. Fails soft: an empty calendar beats a broken page. */
export function publicScheduleEvents(): Pick<ScheduleEventRepository, "between" | "upcoming"> {
  if (!hasSupabase()) return { between: async () => [], upcoming: async () => [] };
  const repo = supabaseScheduleEvents(createPublicClient());
  return {
    between: (a, b) => repo.between(a, b).catch((e) => { console.error(e); return []; }),
    upcoming: (a, n) => repo.upcoming(a, n).catch((e) => { console.error(e); return []; }),
  };
}
