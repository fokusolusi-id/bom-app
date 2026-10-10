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
  get(id: string): Promise<SubCommunity | null>;
  save(input: SubCommunityInput): Promise<void>;
  remove(id: string): Promise<void>;
}

const COLS = "id,name,focus,sort_order,is_active,image_path,instagram,address";

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
    async get(id) {
      const { data, error } = await client.from("sub_communities").select(COLS).eq("id", id).maybeSingle();
      check(error, "Failed to load sub community");
      return (data as SubCommunity | null) ?? null;
    },
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
  const rows: SubCommunity[] = subs.map(([name], i) => ({ name, focus: null, sort_order: i + 1, is_active: true, image_path: null, instagram: null, address: null }));
  const readOnly = async () => { throw new Error("Supabase belum dikonfigurasi"); };
  return { listActive: async () => rows, listAll: async () => rows, get: async () => null, save: readOnly, remove: readOnly };
}

export function publicSubCommunities(): SubCommunityRepository {
  return hasSupabase() ? supabaseSubCommunities(createPublicClient()) : staticSubCommunities();
}
