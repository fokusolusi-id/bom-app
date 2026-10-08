"use server";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/domain/validation";
import { parseSubCommunityInput } from "@/domain/sub-community";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { createImageUpload, removeMedia } from "@/server/media";
import { supabaseSubCommunities } from "@/server/sub-communities";

function revalidate() {
  revalidatePath("/admin/komunitas");
  revalidatePath("/komunitas");
}

export async function prepareSubCommunityImageUpload(contentType: string): Promise<{ path: string; token: string } | { error: string }> {
  const supabase = await requireAdmin();
  try {
    return await createImageUpload(supabase, "sub-communities", contentType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyiapkan upload" };
  }
}

export async function saveSubCommunity(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const input = parseSubCommunityInput((k) => formData.get(k));
    const repo = supabaseSubCommunities(supabase);
    const previous = input.id ? (await repo.get(input.id))?.image_path : null;
    await repo.save(input);
    if (previous !== input.image_path) await removeMedia(supabase, [previous]);
    revalidate();
  });
}

export async function deleteSubCommunity(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    const repo = supabaseSubCommunities(supabase);
    const existing = await repo.get(id);
    await repo.remove(id);
    await removeMedia(supabase, [existing?.image_path]);
    revalidate();
  });
}
