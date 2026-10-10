import { sortPlayers } from "@/domain/leaderboard";
import type { Player } from "@/domain/types";
import type { PlayerRowData } from "./players-table";

/** Players as the admin table and sign-up list need them: plain data for client components, in BOM ID order. */
export function toRows(players: Player[]): PlayerRowData[] {
  return sortPlayers(players, "bom_id", "asc").flatMap((p) => {
    if (!p.id) return [];
    const c = p.contact;
    return [{
      id: p.id, bom_id: p.bom_id, name: p.name, points: Number(p.points), status: p.status ?? "active", role: p.role ?? "member", created_at: p.created_at ?? null,
      full_name: c?.full_name ?? null, whatsapp: c?.whatsapp ?? null, address: c?.address ?? null, age_group: c?.age_group ?? null,
      guardian_name: c?.guardian_name ?? null, guardian_whatsapp: c?.guardian_whatsapp ?? null, hear_from: c?.hear_from ?? null,
      photo_consent: c?.photo_consent ?? false, payment_proof_url: c?.payment_proof_url ?? null,
    }];
  });
}
