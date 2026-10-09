"use server";
import { revalidatePath } from "next/cache";
import { parseSection, parseSiteMediaInput } from "@/domain/site-media";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { createImageUpload, removeMedia } from "@/server/media";
import { supabaseSiteMedia } from "@/server/site-media";

function revalidate() {
  revalidatePath("/admin/media");
  revalidatePath("/");
}

export async function prepareSiteMediaUpload(section: string, contentType: string): Promise<{ path: string; token: string } | { error: string }> {
  const supabase = await requireAdmin();
  try {
    return await createImageUpload(supabase, parseSection(section), contentType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyiapkan upload" };
  }
}

export async function saveSiteMedia(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const input = parseSiteMediaInput((k) => formData.get(k));
    const repo = supabaseSiteMedia(supabase);
    const previous = input.id ? (await repo.get(input.id))?.path : null;
    await repo.save(input);
    if (previous && previous !== input.path) await removeMedia(supabase, [previous]);
    revalidate();
  }, "Disimpan");
}

export async function deleteSiteMedia(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    const repo = supabaseSiteMedia(supabase);
    const existing = await repo.get(id);
    await repo.remove(id);
    await removeMedia(supabase, [existing?.path]);
    revalidate();
  });
}
