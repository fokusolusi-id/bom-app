import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JoinRequest, Registration } from "@/domain/join-request";
import { PROOF_BUCKET } from "@/domain/media";
import { formatBomId } from "@/domain/profile";
import { check } from "./db";
import { committeeEmail, sendEmail } from "./email";

export interface JoinRequestRepository {
  /** Registers the member and returns the BOM ID issued to them. */
  register(input: Registration): Promise<string>;
  listRecent(limit?: number): Promise<JoinRequest[]>;
}

const ERRORS: Record<string, string> = {
  rate_limited: "Terlalu banyak pendaftaran. Coba lagi nanti.",
  duplicate_whatsapp: "Nomor WhatsApp ini sudah terdaftar. Hubungi pengurus lewat grup WhatsApp.",
  guardian_required: "Nama dan WhatsApp wali wajib untuk usia di bawah 12.",
  consent_required: "Setujui pernyataan pembayaran untuk lanjut.",
  proof_required: "Upload screenshot bukti pembayaran.",
  ids_exhausted: "BOM ID penuh. Hubungi pengurus.",
};

export function supabaseJoinRequests(client: SupabaseClient): JoinRequestRepository {
  return {
    async register(input) {
      const { data, error } = await client.rpc("register_member", {
        p_full_name: input.fullName, p_blader_name: input.bladerName, p_whatsapp: input.whatsapp, p_address: input.address,
        p_age_group: input.ageGroup, p_guardian_name: input.guardianName, p_guardian_whatsapp: input.guardianWhatsapp,
        p_hear_from: input.hearFrom, p_payment_ack: input.acceptedPayment, p_payment_proof: input.paymentProofPath,
        p_photo: input.photoConsent,
      });
      const known = Object.keys(ERRORS).find((k) => error?.message.includes(k));
      if (known) throw new Error(ERRORS[known]);
      check(error, "Failed to register member");
      return data as string;
    },
    async listRecent(limit = 200) {
      const { data, error } = await client.from("join_requests")
        .select("id,name,blader_name,whatsapp,address,age_group,guardian_name,guardian_whatsapp,hear_from,photo_consent,created_at,payment_proof_path,player:players(id,bom_id,status)")
        .order("created_at", { ascending: false }).limit(limit);
      check(error, "Failed to load join requests");
      const rows = (data ?? []) as unknown as (JoinRequest & { payment_proof_path: string | null })[];
      // Proofs live in a private bucket: hand the admin short-lived signed links.
      const paths = rows.map((r) => r.payment_proof_path).filter((p): p is string => !!p);
      const signed = paths.length ? await client.storage.from(PROOF_BUCKET).createSignedUrls(paths, 3600) : { data: [], error: null };
      check(signed.error, "Failed to sign payment proofs");
      const urls = new Map((signed.data ?? []).map((u) => [u.path, u.signedUrl]));
      return rows.map(({ payment_proof_path, ...r }) => ({ ...r, payment_proof_url: payment_proof_path ? urls.get(payment_proof_path) ?? null : null }));
    },
  };
}

/** Notifies the committee. Failures are logged; the member is already registered. */
export async function sendRegistrationEmail(input: Registration, bomId: string) {
  const committee = committeeEmail();
  if (!committee) return;
  const lines = [
    `BOM ID: ${formatBomId(bomId)} (Registered, belum Active)`,
    `Nama: ${input.fullName}`,
    `Nama blader: ${input.bladerName}`,
    `WhatsApp: ${input.whatsapp}`,
    `Usia: ${input.ageGroup}${input.guardianName ? ` | Wali: ${input.guardianName} ${input.guardianWhatsapp}` : ""}`,
    `Alamat: ${input.address}`,
    `Tahu BOM dari: ${input.hearFrom ?? "-"}`,
    `Izin foto/video: ${input.photoConsent ? "ya" : "tidak"}`,
    "Bukti pembayaran: lihat di /admin/pendaftar",
  ];
  try {
    await sendEmail({ to: committee, subject: `Pendaftar baru BOM: ${input.bladerName} ${formatBomId(bomId)}`, text: lines.join("\n") });
  } catch (e) {
    console.error(e);
  }
}
