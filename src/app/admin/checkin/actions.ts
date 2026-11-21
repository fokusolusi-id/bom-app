"use server";
import { revalidatePath } from "next/cache";
import { canManageResults } from "@/domain/access";
import { parseCheckinInput } from "@/domain/checkin";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireStaff } from "@/server/admin-session";
import { supabaseCheckins } from "@/server/checkins";
import { supabaseScheduleEvents } from "@/server/schedule-events";

/** Loads the event and checks the signed-in staff member may take check-ins for it (the same rule as managing the event). */
async function requireCheckinAccess(staff: Awaited<ReturnType<typeof requireStaff>>, eventId: string) {
  const event = await supabaseScheduleEvents(staff.supabase).get(eventId);
  if (!event || event.tier === "Break" || !canManageResults(staff, event)) throw new Error("You can only check in players for events of your own sub community");
  return staff.supabase;
}

const actor = (staff: Awaited<ReturnType<typeof requireStaff>>) => ({ id: staff.userId, email: staff.email });

/** What the form sends, with every combo field. */
const formValue = (data: FormData) => (key: string) => (key === "combos" ? data.getAll("combos") : data.get(key));

/** Checks a member (by id) or a non-member (by name) in, or updates their combos when they are already in. */
export async function saveCheckin(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    const input = parseCheckinInput(formValue(formData));
    const supabase = await requireCheckinAccess(staff, input.eventId);
    await supabaseCheckins(supabase).save(input, actor(staff));
    revalidatePath(`/admin/checkin/${input.eventId}`);
  }, "Checked in");
}

export async function removeCheckin(eventId: string, id: string): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    if (!isUuid(eventId) || !isUuid(id)) throw new Error("Invalid input");
    const supabase = await requireCheckinAccess(staff, eventId);
    await supabaseCheckins(supabase).remove(id, eventId);
    revalidatePath(`/admin/checkin/${eventId}`);
  });
}
