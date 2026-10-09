"use server";
import { revalidatePath } from "next/cache";
import { parsePlacementInput } from "@/domain/result";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { supabaseResults } from "@/server/results";

function revalidate() {
  revalidatePath("/admin/competition");
  revalidatePath("/");
  revalidatePath("/member/[bomId]", "page");
}

export async function setPlacement(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabaseResults(supabase).setPlacement(parsePlacementInput((k) => formData.get(k)));
    revalidate();
  });
}

export async function removePlacement(eventId: string, playerId: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(eventId) || !isUuid(playerId)) throw new Error("Invalid input");
    await supabaseResults(supabase).removePlacement(eventId, playerId);
    revalidate();
  });
}
