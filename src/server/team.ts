import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamMember, TeamRole, TeamRoleInput } from "@/domain/team";
import { hasSupabase } from "@/lib/supabase/env";
import { check } from "./db";
import { createPublicClient } from "./supabase-public";

export interface TeamRepository {
  list(): Promise<TeamRole[]>;
  save(input: TeamRoleInput): Promise<void>;
  remove(id: string): Promise<void>;
}

type Row = {
  id: string; title: string; sort_order: number;
  team_members: { sort_order: number; players: { id: string; name: string; bom_id: string; photo_path: string | null } | null }[];
};

export function supabaseTeam(client: SupabaseClient): TeamRepository {
  return {
    async list() {
      const { data, error } = await client
        .from("team_roles")
        .select("id,title,sort_order,team_members(sort_order,players(id,name,bom_id,photo_path))")
        .order("sort_order").order("title");
      check(error, "Failed to load team");
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        id: r.id, title: r.title, sort_order: r.sort_order,
        members: r.team_members
          .filter((m) => m.players)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m): TeamMember => ({ playerId: m.players!.id, name: m.players!.name, bomId: m.players!.bom_id, photo: m.players!.photo_path })),
      }));
    },
    async save(input) {
      const { error } = await client.rpc("save_team_role", {
        p_id: input.id ?? null, p_title: input.title, p_sort: input.sort_order, p_players: input.playerIds,
      });
      check(error, "Failed to save team role");
    },
    async remove(id) {
      const { error } = await client.from("team_roles").delete().eq("id", id);
      check(error, "Failed to delete team role");
    },
  };
}

/** Public reads use the cookie-less client so pages stay statically cacheable. */
export function publicTeam(): TeamRepository {
  if (!hasSupabase()) {
    const none = async () => { throw new Error("Supabase belum dikonfigurasi"); };
    return { list: async () => [], save: none, remove: none };
  }
  const repo = supabaseTeam(createPublicClient());
  // The About page must not go down over an optional section (e.g. the migration is not applied yet).
  return { ...repo, list: () => repo.list().catch((e) => { console.error(e); return []; }) };
}
