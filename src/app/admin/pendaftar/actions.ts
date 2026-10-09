"use server";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";

export async function setPlayerStatus(playerId: string, status: "registered" | "active"): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(playerId) || (status !== "registered" && status !== "active")) throw new Error("Invalid input");
    await supabasePlayers(supabase).setStatus(playerId, status);
    revalidatePath("/admin/members");
    revalidatePath("/leaderboard");
    revalidatePath("/about-bom");
    revalidatePath("/member/[bomId]", "page");
  });
}
