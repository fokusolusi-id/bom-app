"use server";
import { revalidatePath } from "next/cache";
import { challongeResultsText, entriesFromChallonge, parseChallongeUrl } from "@/domain/challonge";
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
  let guests: string[] = [];
  const state = await toFormState(async () => {
    if (!isUuid(eventId)) throw new Error("Invalid input");
    const supabase = await requireResultsAccess(staff, eventId);
    const players = await supabasePlayers(supabase).list(1000, { includeRegistered: true });
    const rows = parseResultsText(String(formData.get("results") ?? ""), players.flatMap((p) => (p.id ? [{ id: p.id, name: p.name, bom_id: p.bom_id }] : [])));
    guests = rows.flatMap((r) => (r.guestName ? [r.guestName] : []));
    await supabaseResults(supabase).replaceForEvent(eventId, rows);
    // The Challonge bracket the list came from, kept with the event so the site can link to it.
    await supabaseScheduleEvents(supabase).setChallongeUrl(eventId, parseChallongeUrl(formData.get("challonge_url"))?.url ?? null);
    await revalidate(supabase);
  }, "Results saved");
  return state.ok && guests.length > 0
    ? { ...state, message: `Results saved. Marked as Non BOM ID (counted as participants, not shown on the leaderboard or in results): ${guests.join(", ")}.` }
    : state;
}

export async function removeResultRow(eventId: string, rowId: string): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    if (!isUuid(eventId) || !isUuid(rowId)) throw new Error("Invalid input");
    const supabase = await requireResultsAccess(staff, eventId);
    await supabaseResults(supabase).removeRow(eventId, rowId);
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

export type ChallongeResult = { text: string; unmatched: string[]; url: string };

/** Reads the final ranking of a finished Challonge bracket and returns it as the results list, ready to check and save. Nothing is saved here. */
export async function fetchChallongeResults(eventId: string, link: string): Promise<{ data?: ChallongeResult; error?: string }> {
  const staff = await requireStaff();
  try {
    if (!isUuid(eventId)) throw new Error("Invalid input");
    await requireResultsAccess(staff, eventId);
    const key = process.env.CHALLONGE_API_KEY;
    if (!key) throw new Error("Set CHALLONGE_API_KEY on the server to read Challonge brackets");
    const parsed = parseChallongeUrl(link);
    if (!parsed) throw new Error("Paste the Challonge bracket link");
    const response = await fetch(`https://api.challonge.com/v1/tournaments/${encodeURIComponent(parsed.apiId)}.json?include_participants=1&api_key=${encodeURIComponent(key)}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (response.status === 404) throw new Error("Challonge cannot find this bracket. Check the link, and that the bracket belongs to the account of the API key.");
    if (response.status === 401 || response.status === 403) throw new Error("Challonge refused the API key");
    if (!response.ok) throw new Error(`Challonge answered with an error (${response.status})`);
    const players = await supabasePlayers(staff.supabase).list(1000, { includeRegistered: true });
    const { text, unmatched } = challongeResultsText(entriesFromChallonge(await response.json()), players);
    return { data: { text, unmatched, url: parsed.url } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not read the bracket" };
  }
}
