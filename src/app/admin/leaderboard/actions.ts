"use server";
import { revalidatePath } from "next/cache";
import { parsePlacementInput, parseResultsText } from "@/domain/result";
import { parsePointsTable } from "@/domain/points-table";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { canManageResults } from "@/domain/access";
import { requireAdmin, requireStaff } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import { supabasePlayers } from "@/server/players";
import { supabaseResults } from "@/server/results";
import { supabaseSettings } from "@/server/settings";
import { syncPlayerPoints } from "@/server/standings";

/** Points follow the results: recalculate every player's total, then refresh the pages that show them. */
async function revalidate(supabase: Awaited<ReturnType<typeof requireAdmin>>) {
  // Organizers cannot write other members' points under the database rules, so the recalculation uses the service key when there is one.
  await syncPlayerPoints(hasServiceKey() ? createServiceClient() : supabase);
  revalidatePath("/admin/leaderboard");
  revalidatePath("/leaderboard");
  revalidatePath("/admin/members");
  revalidatePath("/");
  revalidatePath("/member/[bomId]", "page");
}

/** Loads the event and checks the signed-in staff member may enter its results. */
async function requireResultsAccess(staff: Awaited<ReturnType<typeof requireStaff>>, eventId: string) {
  const event = await supabaseScheduleEvents(staff.supabase).get(eventId);
  if (!event || !canManageResults(staff, event)) throw new Error("You can only enter results for Ranked events of your own sub community");
  return staff.supabase;
}

export async function setPlacement(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    const input = parsePlacementInput((k) => formData.get(k));
    const supabase = await requireResultsAccess(staff, input.eventId);
    await supabaseResults(supabase).setPlacement(input);
    await revalidate(supabase);
  });
}

/** Replaces the whole result of an event with a typed list, one player per line in finishing order. */
export async function saveEventResults(eventId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    if (!isUuid(eventId)) throw new Error("Invalid input");
    const supabase = await requireResultsAccess(staff, eventId);
    const players = await supabasePlayers(supabase).list(1000, { includeRegistered: true });
    const rows = parseResultsText(String(formData.get("results") ?? ""), players.flatMap((p) => (p.id ? [{ id: p.id, name: p.name, bom_id: p.bom_id }] : [])));
    await supabaseResults(supabase).replaceForEvent(eventId, rows);
    await revalidate(supabase);
  }, "Results saved");
}

export async function removePlacement(eventId: string, playerId: string): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    if (!isUuid(eventId) || !isUuid(playerId)) throw new Error("Invalid input");
    const supabase = await requireResultsAccess(staff, eventId);
    await supabaseResults(supabase).removePlacement(eventId, playerId);
    await revalidate(supabase);
  });
}

export async function savePointsTable(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  return toFormState(async () => {
    await supabaseSettings(supabase).savePointsTable(parsePointsTable((k) => formData.get(k)));
    await revalidate(supabase);
  }, "Saved");
}
