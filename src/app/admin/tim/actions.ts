"use server";
import { revalidatePath } from "next/cache";
import { parseTeamRoleInput } from "@/domain/team";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { createImageUpload, removeMedia } from "@/server/media";
import { supabasePlayers } from "@/server/players";
import { supabaseTeam } from "@/server/team";

function revalidate() {
  revalidatePath("/admin/tim");
  revalidatePath("/about-bom");
  revalidatePath("/member/[bomId]", "page");
}

export async function saveTeamRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const input = parseTeamRoleInput((k) => formData.get(k), (k) => formData.getAll(k), [...formData.entries()]);
    await supabaseTeam(supabase).save(input);
    const players = supabasePlayers(supabase);
    for (const [playerId, path] of Object.entries(input.photos)) {
      const previous = await players.setPhoto(playerId, path);
      if (previous !== path) await removeMedia(supabase, [previous]);
    }
    revalidate();
  });
}

export async function deleteTeamRole(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    await supabaseTeam(supabase).remove(id);
    revalidate();
  });
}

export async function prepareMemberPhotoUpload(contentType: string): Promise<{ path: string; token: string } | { error: string }> {
  const supabase = await requireAdmin();
  try {
    return await createImageUpload(supabase, "founding-team", contentType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal menyiapkan upload" };
  }
}
