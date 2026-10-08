"use server";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/domain/validation";
import { parseSubCommunityInput } from "@/domain/sub-community";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { toFormState, type FormState } from "../form-state";

function revalidate() {
  revalidatePath("/admin/komunitas");
  revalidatePath("/komunitas");
}

export async function saveSubCommunity(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabaseSubCommunities(supabase).save(parseSubCommunityInput((k) => formData.get(k)));
    revalidate();
  });
}

export async function deleteSubCommunity(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    await supabaseSubCommunities(supabase).remove(id);
    revalidate();
  });
}
