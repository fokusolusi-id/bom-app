import { parsePaymentProofPath } from "./media";
import { parseText } from "./validation";

export const AGE_GROUPS = [["under12", "Under 12"], ["all", "All Ages"]] as const;
export const HEAR_FROM = ["Instagram", "WhatsApp group", "Friend", "At an event", "Other"] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number][0];

export type Registration = {
  fullName: string;
  bladerName: string;
  whatsapp: string;
  address: string;
  ageGroup: AgeGroup;
  guardianName: string | null;
  guardianWhatsapp: string | null;
  hearFrom: string | null;
  acceptedPayment: boolean;
  photoConsent: boolean;
  paymentProofPath: string;
};

export type JoinRequest = {
  id: string; name: string; blader_name: string | null; whatsapp: string; address: string | null; age_group: AgeGroup | null;
  guardian_name: string | null; guardian_whatsapp: string | null; hear_from: string | null; photo_consent: boolean; created_at: string; payment_proof_url?: string | null;
  player: { id: string; bom_id: string; status: "registered" | "active" } | null;
};

/** Normalises 08xx / 62xx / +62xx numbers to +62xx. */
export function normalizeWhatsapp(raw: unknown): string {
  const digits = typeof raw === "string" ? raw.replace(/[\s\-().]/g, "") : "";
  const local = digits.replace(/^\+?62/, "").replace(/^0/, "");
  const number = `+62${local}`;
  if (!/^\+62[0-9]{8,13}$/.test(number)) throw new Error("Nomor WhatsApp tidak valid");
  return number;
}

const checked = (v: unknown) => v === "on" || v === "true";

function oneOf<T extends string>(raw: unknown, allowed: readonly T[], label: string): T {
  if (typeof raw !== "string" || !(allowed as readonly string[]).includes(raw)) throw new Error(`${label} wajib dipilih`);
  return raw as T;
}

function parseAddress(raw: unknown): string {
  const v = parseText(raw, "Alamat", 300).replace(/\s+/g, " ");
  if (v.length < 5) throw new Error("Alamat minimal 5 karakter");
  return v;
}

export function parseRegistration(get: (key: string) => unknown): Registration {
  const fullName = parseText(get("full_name"), "Nama lengkap", 60).replace(/\s+/g, " ");
  if (fullName.length < 2) throw new Error("Nama lengkap minimal 2 karakter");
  const bladerName = parseText(get("blader_name"), "Nama blader", 40).replace(/\s+/g, " ");
  if (bladerName.length < 2) throw new Error("Nama blader minimal 2 karakter");

  const ageGroup = oneOf(get("age_group"), AGE_GROUPS.map(([v]) => v), "Kelompok usia");
  const minor = ageGroup === "under12";
  const guardianName = minor ? parseText(get("guardian_name"), "Nama wali", 60) : null;
  const guardianWhatsapp = minor ? normalizeWhatsapp(get("guardian_whatsapp")) : null;

  if (!checked(get("accepted_payment"))) throw new Error("Setujui pernyataan pembayaran untuk lanjut");

  return {
    fullName,
    bladerName,
    whatsapp: normalizeWhatsapp(get("whatsapp")),
    address: parseAddress(get("address")),
    ageGroup,
    guardianName,
    guardianWhatsapp,
    hearFrom: parseText(get("hear_from"), "Sumber", 40, "") || null,
    acceptedPayment: true,
    photoConsent: checked(get("photo_consent")),
    paymentProofPath: parsePaymentProofPath(get("payment_proof")),
  };
}

/** Honeypot: the hidden "website" field is only ever filled in by bots. */
export const isBot = (get: (key: string) => unknown) => typeof get("website") === "string" && get("website") !== "";
