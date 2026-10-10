import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Registration } from "@/domain/join-request";
import { formatBomId } from "@/domain/profile";
import { check } from "./db";
import { committeeEmail, sendEmail } from "./email";

export interface RegistrationRepository {
  /** Registers the member and returns the BOM ID issued to them. */
  register(input: Registration): Promise<string>;
  /** True when no player has this blader name yet (ignoring case and extra spaces). */
  bladerNameAvailable(name: string): Promise<boolean>;
}

const ERRORS: Record<string, string> = {
  rate_limited: "Too many sign-ups. Try again later.",
  duplicate_blader: "This blader name is already taken. Choose another one.",
  duplicate_whatsapp: "This WhatsApp number is already registered. Contact the committee through the WhatsApp group.",
  guardian_required: "Guardian name and WhatsApp are required for ages under 12.",
  consent_required: "Accept the payment statement to continue.",
  proof_required: "Upload a screenshot of your payment.",
  ids_exhausted: "No BOM IDs left. Contact the committee.",
};

export function supabaseRegistration(client: SupabaseClient): RegistrationRepository {
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
    async bladerNameAvailable(name) {
      // ilike treats % and _ as wildcards; escape them so the name is compared as typed.
      const pattern = name.trim().replace(/\s+/g, " ").replace(/[\\%_]/g, "\\$&");
      const { count, error } = await client.from("players").select("id", { count: "exact", head: true }).ilike("name", pattern);
      check(error, "Failed to check the blader name");
      return (count ?? 0) === 0;
    },
  };
}

/** Notifies the committee. Failures are logged; the member is already registered. */
export async function sendRegistrationEmail(input: Registration, bomId: string) {
  const committee = committeeEmail();
  if (!committee) return;
  const lines = [
    `BOM ID: ${formatBomId(bomId)} (Registered, not yet Active)`,
    `Name: ${input.fullName}`,
    `Blader name: ${input.bladerName}`,
    `WhatsApp: ${input.whatsapp}`,
    `Age: ${input.ageGroup}${input.guardianName ? ` | Guardian: ${input.guardianName} ${input.guardianWhatsapp}` : ""}`,
    `Address: ${input.address}`,
    `Heard about BOM from: ${input.hearFrom ?? "-"}`,
    `Photo/video consent: ${input.photoConsent ? "yes" : "no"}`,
    "Payment screenshot: see /admin/members",
  ];
  try {
    await sendEmail({ to: committee, subject: `New BOM sign-up: ${input.bladerName} ${formatBomId(bomId)}`, text: lines.join("\n") });
  } catch (e) {
    console.error(e);
  }
}
