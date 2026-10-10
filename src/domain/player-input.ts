import { AGE_GROUPS, checked, normalizeWhatsapp, oneOf, parseAddress } from "./join-request";
import { PLAYER_ROLES, type PlayerRole, type PlayerStatus } from "./types";
import { isUuid, parseText } from "./validation";

export type PlayerContactInput = {
  full_name: string | null; whatsapp: string | null; address: string | null; age_group: string | null;
  guardian_name: string | null; guardian_whatsapp: string | null; hear_from: string | null; photo_consent: boolean;
};

/** What an admin can edit about a player. Points are not editable: they are calculated from results. */
export type PlayerInput = { id: string; bom_id: string; name: string; status: PlayerStatus; role: PlayerRole } & PlayerContactInput;

const optional = (raw: unknown, label: string, max: number) => parseText(raw, label, max, "").replace(/\s+/g, " ") || null;

/**
 * The edit form: the player and everything the membership form collects. Players added by an admin have no sign-up, so
 * every contact field may be empty; a WhatsApp number needs no other fields. The BOM ID is part of the member's URL, so it
 * is kept to letters, digits and dashes.
 */
export function parsePlayerInput(get: (key: string) => unknown): PlayerInput {
  const id = get("id");
  if (!isUuid(id)) throw new Error("Invalid id");
  const bomId = parseText(get("bom_id"), "BOM ID", 20);
  if (!/^[A-Za-z0-9-]+$/.test(bomId)) throw new Error("BOM ID can only use letters, digits and dashes");
  const status = get("status");
  if (status !== "registered" && status !== "active") throw new Error("Invalid status");
  const role = get("role");
  if (!PLAYER_ROLES.some(([v]) => v === role)) throw new Error("Invalid role");

  const fullName = optional(get("full_name"), "Full name", 60);
  if (fullName !== null && fullName.length < 2) throw new Error("Full name must be at least 2 characters");
  const rawWhatsapp = parseText(get("whatsapp"), "WhatsApp number", 20, "");
  const rawAge = get("age_group");
  const ageGroup = rawAge === "" || rawAge === null || rawAge === undefined ? null : oneOf(rawAge, AGE_GROUPS.map(([v]) => v), "Age group");
  const minor = ageGroup === "under12";
  const rawAddress = parseText(get("address"), "Address", 300, "");
  return {
    id, bom_id: bomId, name: parseText(get("name"), "Blader name", 40), status, role: role as PlayerRole,
    full_name: fullName,
    whatsapp: rawWhatsapp ? normalizeWhatsapp(rawWhatsapp) : null,
    address: rawAddress ? parseAddress(rawAddress) : null,
    age_group: ageGroup,
    guardian_name: minor ? parseText(get("guardian_name"), "Guardian name", 60) : null,
    guardian_whatsapp: minor ? normalizeWhatsapp(get("guardian_whatsapp")) : null,
    hear_from: optional(get("hear_from"), "Heard about BOM from", 40),
    photo_consent: checked(get("photo_consent")),
  };
}
