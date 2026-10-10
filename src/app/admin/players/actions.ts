"use server";
import { revalidatePath } from "next/cache";
import { parsePlayerInput } from "@/domain/player-input";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { syncPlayerPoints } from "@/server/standings";

function revalidate() {
  revalidatePath("/admin/members");
  revalidatePath("/admin/leaderboard");
  revalidatePath("/leaderboard");
  revalidatePath("/member/[bomId]", "page");
  revalidatePath("/about-bom");
  revalidatePath("/");
}

export async function savePlayer(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabasePlayers(supabase).update(parsePlayerInput((k) => formData.get(k)));
    revalidate();
  }, "Saved");
}

/** Removes a player with their payment screenshot and results. Event points depend on the number of participants, so everyone's total is recalculated. */
export async function deletePlayer(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    await supabasePlayers(supabase).remove(id);
    await syncPlayerPoints(supabase);
    revalidate();
  });
}
