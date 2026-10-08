"use server";
import { revalidatePath } from "next/cache";
import { parsePlacementInput, parseTournamentInput } from "@/domain/tournament";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { supabaseTournaments } from "@/server/tournaments";

function revalidate() {
  revalidatePath("/admin/turnamen");
  // Profiles list placements; they also refresh on their 60s revalidate.
  revalidatePath("/member/[bomId]", "page");
}

export async function saveTournament(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabaseTournaments(supabase).save(parseTournamentInput((k) => formData.get(k)));
    revalidate();
  });
}

export async function deleteTournament(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    await supabaseTournaments(supabase).remove(id);
    revalidate();
  });
}

export async function setPlacement(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabaseTournaments(supabase).setPlacement(parsePlacementInput((k) => formData.get(k)));
    revalidate();
  });
}

export async function removePlacement(tournamentId: string, playerId: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(tournamentId) || !isUuid(playerId)) throw new Error("Invalid input");
    await supabaseTournaments(supabase).removePlacement(tournamentId, playerId);
    revalidate();
  });
}
