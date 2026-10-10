"use server";
import { revalidatePath } from "next/cache";
import { parseEventInput } from "@/domain/event";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireAdmin } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";

function revalidate() {
  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function saveScheduleEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    const repo = supabaseScheduleEvents(supabase);
    const input = parseEventInput((k) => formData.get(k));
    const day = new Date(input.starts_at).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const from = new Date(`${day}T00:00:00+07:00`);
    const sameDay = await repo.between(from.toISOString(), new Date(from.getTime() + 86_400_000).toISOString(), { includeInactive: true });
    const clash = sameDay.find((e) => e.id !== input.id);
    if (clash) throw new Error(`${day} already has "${clash.name}". Edit or delete it first.`);
    await repo.save(input);
    revalidate();
  }, "Saved");
}

export async function deleteScheduleEvent(id: string): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    if (!isUuid(id)) throw new Error("Invalid input");
    await supabaseScheduleEvents(supabase).remove(id);
    revalidate();
  });
}
