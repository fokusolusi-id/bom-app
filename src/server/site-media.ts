import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaSection, SiteMedia, SiteMediaInput } from "@/domain/site-media";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface SiteMediaRepository {
  list(section: MediaSection, opts?: { includeInactive?: boolean }): Promise<SiteMedia[]>;
  get(id: string): Promise<SiteMedia | null>;
  save(input: SiteMediaInput): Promise<void>;
  remove(id: string): Promise<void>;
}

const COLS = "id,section,kind,path,caption,sort_order,is_active";

export function supabaseSiteMedia(client: SupabaseClient): SiteMediaRepository {
  return {
    async list(section, opts) {
      let q = client.from("site_media").select(COLS).eq("section", section).order("sort_order").order("created_at");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      check(error, "Failed to load media");
      return (data ?? []) as SiteMedia[];
    },
    async get(id) {
      const { data, error } = await client.from("site_media").select(COLS).eq("id", id).maybeSingle();
      check(error, "Failed to load media item");
      return (data as SiteMedia | null) ?? null;
    },
    async save(input) {
      const { id, ...row } = input;
      const { error } = id ? await client.from("site_media").update(row).eq("id", id) : await client.from("site_media").insert(row);
      check(error, "Failed to save media item");
    },
    async remove(id) {
      const { error } = await client.from("site_media").delete().eq("id", id);
      check(error, "Failed to delete media item");
    },
  };
}

/** Public reads use the cookie-less client so pages stay statically cacheable. Optional sections fail soft. */
export function publicSiteMedia(): Pick<SiteMediaRepository, "list"> {
  if (!hasSupabase()) return { list: async () => [] };
  const repo = supabaseSiteMedia(createPublicClient());
  return { list: (section, opts) => repo.list(section, opts).catch((e) => { console.error(e); return []; }) };
}
