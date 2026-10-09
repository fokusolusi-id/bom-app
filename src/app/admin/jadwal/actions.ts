"use server";
import { revalidatePath } from "next/cache";
import { parseEventInput } from "@/domain/event";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";

function revalidate() {
  revalidatePath("/admin/jadwal");
  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function saveScheduleEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabaseScheduleEvents(supabase).save(parseEventInput((k) => formData.get(k)));
    revalidate();
  }, "Disimpan");
}

export async function deleteScheduleEvent(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    await supabaseScheduleEvents(supabase).remove(id);
    revalidate();
  });
}
