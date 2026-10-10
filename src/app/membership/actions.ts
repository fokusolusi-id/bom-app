"use server";
import { after } from "next/server";
import { isBot, parseRegistration } from "@/domain/join-request";
import type { FormState } from "@/lib/form-state";
import { hasSupabase } from "@/lib/supabase/env";
import { sendRegistrationEmail, supabaseRegistration } from "@/server/registration";
import { createPublicClient } from "@/server/supabase-public";

export type RegisteredMember = { bomId: string; bladerName: string };

export async function registerMember(_prev: FormState<RegisteredMember>, formData: FormData): Promise<FormState<RegisteredMember>> {
  const get = (k: string) => formData.get(k);
  // Bots get a quiet fake success so they don't retry.
  if (isBot(get)) return { ok: true, data: { bomId: "BoM-000", bladerName: "Blader" } };
  if (!hasSupabase()) return { error: "Pendaftaran belum aktif" };
  try {
    const input = parseRegistration(get);
    const bomId = await supabaseRegistration(createPublicClient()).register(input);
    // Send after the response so a slow mail provider doesn't hold up the form.
    after(() => sendRegistrationEmail(input, bomId));
    return { ok: true, data: { bomId, bladerName: input.bladerName } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

/** Live check while typing the blader name: is it still free? Unknown (no database, error) counts as free; registration checks again. */
export async function checkBladerName(name: string): Promise<{ available: boolean }> {
  if (!hasSupabase() || name.trim().length < 2 || name.length > 40) return { available: true };
  try {
    return { available: await supabaseRegistration(createPublicClient()).bladerNameAvailable(name) };
  } catch (e) {
    console.error(e);
    return { available: true };
  }
}
