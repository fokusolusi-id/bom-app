"use server";
import { after } from "next/server";
import { isBot, parseRegistration } from "@/domain/join-request";
import type { FormState } from "@/lib/form-state";
import { hasSupabase } from "@/lib/supabase/env";
import { sendRegistrationEmail, supabaseJoinRequests } from "@/server/join-requests";
import { createPublicClient } from "@/server/supabase-public";

export type RegisteredMember = { bomId: string; bladerName: string };

export async function registerMember(_prev: FormState<RegisteredMember>, formData: FormData): Promise<FormState<RegisteredMember>> {
  const get = (k: string) => formData.get(k);
  // Bots get a quiet fake success so they don't retry.
  if (isBot(get)) return { ok: true, data: { bomId: "BoM-000", bladerName: "Blader" } };
  if (!hasSupabase()) return { error: "Pendaftaran belum aktif" };
  try {
    const input = parseRegistration(get);
    const bomId = await supabaseJoinRequests(createPublicClient()).register(input);
    // Send after the response so a slow mail provider doesn't hold up the form.
    after(() => sendRegistrationEmail(input, bomId));
    return { ok: true, data: { bomId, bladerName: input.bladerName } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
