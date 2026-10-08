import { parseText } from "./validation";

export type JoinRequestInput = { name: string; email: string; whatsapp: string; sub_community: string | null };
export type JoinRequest = JoinRequestInput & { id: string; created_at: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalises 08xx / 62xx / +62xx numbers to +62xx. */
export function normalizeWhatsapp(raw: unknown): string {
  const digits = typeof raw === "string" ? raw.replace(/[\s\-().]/g, "") : "";
  const local = digits.replace(/^\+?62/, "").replace(/^0/, "");
  const number = `+62${local}`;
  if (!/^\+62[0-9]{8,13}$/.test(number)) throw new Error("Nomor WhatsApp tidak valid");
  return number;
}

export function parseJoinRequest(get: (key: string) => unknown): JoinRequestInput {
  const name = parseText(get("name"), "Nama", 60).replace(/\s+/g, " ");
  if (name.length < 2) throw new Error("Nama minimal 2 karakter");
  const email = parseText(get("email"), "Email", 120).toLowerCase();
  if (!EMAIL.test(email)) throw new Error("Email tidak valid");
  return {
    name,
    email,
    whatsapp: normalizeWhatsapp(get("whatsapp")),
    sub_community: parseText(get("sub_community"), "Sub komunitas", 60, "") || null,
  };
}

/** Honeypot: the hidden "website" field is only ever filled in by bots. */
export const isBot = (get: (key: string) => unknown) => typeof get("website") === "string" && get("website") !== "";
