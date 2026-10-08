import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubCommunity, SubCommunityInput } from "@/domain/sub-community";
import { subs } from "@/lib/content";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface SubCommunityRepository {
  listActive(): Promise<SubCommunity[]>;
  listAll(): Promise<SubCommunity[]>;
  save(input: SubCommunityInput): Promise<void>;
  remove(id: string): Promise<void>;
}

const COLS = "id,name,schedule,focus,sort_order,is_active";

export function supabaseSubCommunities(client: SupabaseClient): SubCommunityRepository {
  const list = async (activeOnly: boolean) => {
    let q = client.from("sub_communities").select(COLS).order("sort_order").order("name");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    check(error, "Failed to load sub communities");
    return (data ?? []) as SubCommunity[];
  };
  return {
    listActive: () => list(true),
    listAll: () => list(false),
    async save(input) {
      const { id, ...row } = input;
      const { error } = id
        ? await client.from("sub_communities").update(row).eq("id", id)
        : await client.from("sub_communities").insert(row);
      check(error, "Failed to save sub community");
    },
    async remove(id) {
      const { error } = await client.from("sub_communities").delete().eq("id", id);
      check(error, "Failed to delete sub community");
    },
  };
}

// Used when Supabase env vars are not set (local preview).
export function staticSubCommunities(): SubCommunityRepository {
  const rows: SubCommunity[] = subs.map(([name, schedule], i) => ({ name, schedule, focus: null, sort_order: i + 1, is_active: true }));
  const readOnly = async () => { throw new Error("Supabase belum dikonfigurasi"); };
  return { listActive: async () => rows, listAll: async () => rows, save: readOnly, remove: readOnly };
}

export function publicSubCommunities(): SubCommunityRepository {
  return hasSupabase() ? supabaseSubCommunities(createPublicClient()) : staticSubCommunities();
}
