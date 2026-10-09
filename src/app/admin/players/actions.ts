"use server";
import { revalidatePath } from "next/cache";
import { parsePlayerInput } from "@/domain/player-input";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";

export async function savePlayer(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const input = parsePlayerInput((k) => formData.get(k));
    await supabasePlayers(supabase).update(input);
    revalidatePath("/admin/members");
    revalidatePath("/leaderboard");
    revalidatePath("/member/[bomId]", "page");
    revalidatePath("/about-bom");
  }, "Saved");
}
