"use server";
import { revalidatePath } from "next/cache";
import { parseRulesPage } from "@/domain/rules-page";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { createImageUpload } from "@/server/media";
import { supabaseSettings } from "@/server/settings";

export async function saveRulesPage(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabaseSettings(supabase).saveRulesPage(parseRulesPage((k) => formData.get(k)));
    revalidatePath("/admin/rules");
    revalidatePath("/rules");
  }, "Saved");
}

export async function prepareRulebookUpload(contentType: string): Promise<{ path: string; token: string } | { error: string }> {
  const supabase = await requireAdmin();
  try {
    return await createImageUpload(supabase, "rules", contentType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not prepare the upload" };
  }
}
