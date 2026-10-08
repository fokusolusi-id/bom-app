import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JoinRequest, JoinRequestInput } from "@/domain/join-request";
import { check } from "./db";
import { committeeEmail, sendEmail } from "./email";

export interface JoinRequestRepository {
  submit(input: JoinRequestInput): Promise<void>;
  listRecent(limit?: number): Promise<JoinRequest[]>;
}

export function supabaseJoinRequests(client: SupabaseClient): JoinRequestRepository {
  return {
    async submit(input) {
      const { error } = await client.rpc("submit_join_request", {
        p_name: input.name, p_email: input.email, p_whatsapp: input.whatsapp, p_sub_community: input.sub_community,
      });
      if (error?.message.includes("rate_limited")) throw new Error("Terlalu banyak pendaftaran. Coba lagi nanti.");
      check(error, "Failed to submit join request");
    },
    async listRecent(limit = 200) {
      const { data, error } = await client.from("join_requests")
        .select("id,name,email,whatsapp,sub_community,created_at").order("created_at", { ascending: false }).limit(limit);
      check(error, "Failed to load join requests");
      return (data ?? []) as JoinRequest[];
    },
  };
}

/** Notifies the committee and confirms to the applicant. Failures are logged; the request is already saved. */
export async function sendJoinRequestEmails(input: JoinRequestInput) {
  const details = [
    `Nama: ${input.name}`,
    `Email: ${input.email}`,
    `WhatsApp: ${input.whatsapp}`,
    `Sub komunitas: ${input.sub_community ?? "-"}`,
  ].join("\n");
  const committee = committeeEmail();
  const results = await Promise.allSettled([
    committee && sendEmail({ to: committee, replyTo: input.email, subject: `Pendaftar baru BOM: ${input.name}`, text: details }),
    sendEmail({
      to: input.email,
      subject: "Pendaftaran BOM diterima",
      text: `Halo ${input.name},\n\nTerima kasih sudah mendaftar di BOM (Beyblade of Medan). Pengurus akan menghubungi kamu lewat WhatsApp untuk BOM ID dan jadwal gathering terdekat.\n\n${details}\n\nBuilt in Medan. Battle anywhere.`,
    }),
  ]);
  for (const r of results) if (r.status === "rejected") console.error(r.reason);
}
