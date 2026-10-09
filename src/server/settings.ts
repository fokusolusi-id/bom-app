import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asPointsTable, type PointsTable } from "@/domain/points-table";
import { hasSupabase } from "@/lib/supabase/env";
import { DEFAULT_POINTS_TABLE } from "@/lib/content";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

const POINTS_KEY = "points_table";

export interface SettingsRepository {
  pointsTable(): Promise<PointsTable>;
  savePointsTable(table: PointsTable): Promise<void>;
}

export function supabaseSettings(client: SupabaseClient): SettingsRepository {
  return {
    async pointsTable() {
      const { data, error } = await client.from("site_settings").select("value").eq("key", POINTS_KEY).maybeSingle();
      check(error, "Failed to load the points table");
      return asPointsTable(data?.value) ?? DEFAULT_POINTS_TABLE;
    },
    async savePointsTable(table) {
      const { error } = await client.from("site_settings").upsert({ key: POINTS_KEY, value: table, updated_at: new Date().toISOString() });
      check(error, "Failed to save the points table");
    },
  };
}

/** The points table for public pages. Falls back to the built-in table without Supabase, or if it cannot be loaded. */
export async function publicPointsTable(): Promise<PointsTable> {
  if (!hasSupabase()) return DEFAULT_POINTS_TABLE;
  try {
    return await supabaseSettings(createPublicClient()).pointsTable();
  } catch (e) {
    console.error(e);
    return DEFAULT_POINTS_TABLE;
  }
}
