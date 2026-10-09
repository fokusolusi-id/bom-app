"use server";
import { revalidatePath } from "next/cache";
import { parseSponsorInput } from "@/domain/sponsor";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { createImageUpload, removeMedia } from "@/server/media";
import { supabaseSponsors } from "@/server/sponsors";

function revalidate() {
  revalidatePath("/admin/home");
  revalidatePath("/");
}

export async function prepareSponsorLogoUpload(contentType: string): Promise<{ path: string; token: string } | { error: string }> {
  const supabase = await requireAdmin();
  try {
    return await createImageUpload(supabase, "sponsors", contentType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not prepare the upload" };
  }
}

export async function saveSponsor(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const input = parseSponsorInput((k) => formData.get(k));
    const repo = supabaseSponsors(supabase);
    const previous = input.id ? (await repo.get(input.id))?.logo_path : null;
    await repo.save(input);
    if (previous && previous !== input.logo_path) await removeMedia(supabase, [previous]);
    revalidate();
  }, "Saved");
}

export async function deleteSponsor(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    const repo = supabaseSponsors(supabase);
    const existing = await repo.get(id);
    await repo.remove(id);
    await removeMedia(supabase, [existing?.logo_path]);
    revalidate();
  });
}
