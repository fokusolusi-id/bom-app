import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sponsor, SponsorInput } from "@/domain/sponsor";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface SponsorRepository {
  list(opts?: { includeInactive?: boolean }): Promise<Sponsor[]>;
  get(id: string): Promise<Sponsor | null>;
  save(input: SponsorInput): Promise<void>;
  remove(id: string): Promise<void>;
}

const COLS = "id,name,tier,logo_path,website,sort_order,is_active";

export function supabaseSponsors(client: SupabaseClient): SponsorRepository {
  return {
    async list(opts) {
      let q = client.from("sponsors").select(COLS).order("sort_order").order("name");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error, "Failed to load sponsors");
      return (data ?? []) as Sponsor[];
    },
    async get(id) {
      const { data, error } = await client.from("sponsors").select(COLS).eq("id", id).maybeSingle();
      check(error, "Failed to load sponsor");
      return (data as Sponsor | null) ?? null;
    },
    async save(input) {
      const { id, ...row } = input;
      const { error } = id ? await client.from("sponsors").update(row).eq("id", id) : await client.from("sponsors").insert(row);
      check(error, "Failed to save sponsor");
    },
    async remove(id) {
      const { error } = await client.from("sponsors").delete().eq("id", id);
      check(error, "Failed to delete sponsor");
    },
  };
}

/** Public reads use the cookie-less client so pages stay statically cacheable. Optional section: fails soft. */
export function publicSponsors(): Pick<SponsorRepository, "list"> {
  if (!hasSupabase()) return { list: async () => [] };
  const repo = supabaseSponsors(createPublicClient());
  return { list: (opts) => repo.list(opts).catch((e) => { console.error(e); return []; }) };
}
