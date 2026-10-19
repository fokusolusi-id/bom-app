"use server";
import { revalidatePath } from "next/cache";
import { isUuid, parseText } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import { requireAdmin } from "@/server/admin-session";
import { supabaseResults } from "@/server/results";
import { syncPlayerPoints } from "@/server/standings";

/** A Non BOM ID name turns out to be a member: all their results move to that member, and points are recalculated. */
export async function linkGuestToMember(guestName: string, playerId: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(playerId)) throw new Error("Choose a member");
    const name = parseText(guestName, "Name", 60);
    await supabaseResults(supabase).linkGuest(name, playerId);
    await syncPlayerPoints(hasServiceKey() ? createServiceClient() : supabase);
    revalidatePath("/admin/members");
    revalidatePath("/admin/leaderboard");
    revalidatePath("/leaderboard");
    revalidatePath("/");
    revalidatePath("/member/[bomId]", "page");
  }, "Linked");
}
