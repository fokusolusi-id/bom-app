"use server";
import { after } from "next/server";
import { isBot, parseJoinRequest } from "@/domain/join-request";
import { toFormState, type FormState } from "@/lib/form-state";
import { hasSupabase } from "@/lib/supabase/env";
import { sendJoinRequestEmails, supabaseJoinRequests } from "@/server/join-requests";
import { createPublicClient } from "@/server/supabase-public";

const THANKS = "Terima kasih! Pengurus BOM akan menghubungi kamu lewat WhatsApp.";

export async function submitJoinRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const get = (k: string) => formData.get(k);
  if (isBot(get)) return { ok: true, message: THANKS };
  if (!hasSupabase()) return { error: "Pendaftaran belum aktif" };
  return toFormState(async () => {
    const input = parseJoinRequest(get);
    await supabaseJoinRequests(createPublicClient()).submit(input);
    // Send after the response so a slow mail provider doesn't hold up the form.
    after(() => sendJoinRequestEmails(input));
  }, THANKS);
}
