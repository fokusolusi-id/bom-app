"use server";
import { revalidatePath } from "next/cache";
import { parseTeamRoleInput } from "@/domain/team";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { parseImagePath } from "@/domain/media";
import { requireAdmin } from "@/server/admin-session";
import { createImageUpload, removeMedia } from "@/server/media";
import { supabasePlayers } from "@/server/players";
import { supabaseTeam } from "@/server/team";

function revalidate() {
  revalidatePath("/admin/tim");
  revalidatePath("/about-bom");
}

export async function saveTeamRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const input = parseTeamRoleInput((k) => formData.get(k), (k) => formData.getAll(k));
    await supabaseTeam(supabase).save(input);
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

export async function saveMemberPhoto(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const playerId = formData.get("player_id");
    if (!isUuid(playerId)) throw new Error("Invalid input");
    const path = parseImagePath(formData.get("photo_path"), "founding-team");
    const previous = await supabasePlayers(supabase).setPhoto(playerId, path);
    if (previous !== path) await removeMedia(supabase, [previous]);
    revalidate();
    revalidatePath("/member/[bomId]", "page");
  }, "Foto disimpan");
}
