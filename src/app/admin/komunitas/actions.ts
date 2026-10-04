"use server";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/domain/match-input";
import { parseSubCommunityInput } from "@/domain/sub-community";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSubCommunities } from "@/server/sub-communities";

export async function saveSubCommunity(formData: FormData) {
  const input = parseSubCommunityInput((k) => formData.get(k));
  const supabase = await requireAdmin();
  await supabaseSubCommunities(supabase).save(input);
  revalidatePath("/admin/komunitas");
  revalidatePath("/komunitas");
}

export async function deleteSubCommunity(id: string) {
  if (!isUuid(id)) throw new Error("Invalid input");
  const supabase = await requireAdmin();
  await supabaseSubCommunities(supabase).remove(id);
  revalidatePath("/admin/komunitas");
  revalidatePath("/komunitas");
}
