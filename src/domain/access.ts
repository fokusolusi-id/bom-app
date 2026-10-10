import { isUuid, parseText } from "./validation";

/** What the signed-in staff member may do. Admins can do everything; organizers only manage their own sub communities. */
export type Access = { isAdmin: boolean; communityIds: string[] };

/** Organizers run the weekly gatherings: Unrank and Ranked. Cup and above belong to BOM as a whole. */
export const ORGANIZER_EVENT_TYPES = ["Unrank", "Ranked"] as const;

/** Results (and points) exist only for Ranked events at this level. */
export const ORGANIZER_RESULT_TYPES = ["Ranked"] as const;

/** Can this person create, edit or delete this schedule event? */
export function canManageEvent(access: Access, event: { sub_community_id: string | null; tier: string }): boolean {
  if (access.isAdmin) return true;
  return event.sub_community_id !== null && access.communityIds.includes(event.sub_community_id) && (ORGANIZER_EVENT_TYPES as readonly string[]).includes(event.tier);
}

/** Can this person enter the results of this event? */
export function canManageResults(access: Access, event: { sub_community_id: string | null; tier: string }): boolean {
  if (access.isAdmin) return true;
  return event.sub_community_id !== null && access.communityIds.includes(event.sub_community_id) && (ORGANIZER_RESULT_TYPES as readonly string[]).includes(event.tier);
}

export type StaffInput = { email: string; password: string; role: "admin" | "organizer"; subCommunityId: string | null };

/** The "give access" form: a login (email and password) and what it may do. An organizer needs a sub community. */
export function parseStaffInput(get: (key: string) => unknown): StaffInput {
  const email = parseText(get("email"), "Email", 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email address");
  const password = typeof get("password") === "string" ? (get("password") as string) : "";
  if (password.length < 10 || password.length > 72) throw new Error("The password must be 10 to 72 characters");
  const role = get("role");
  if (role !== "admin" && role !== "organizer") throw new Error("Choose a role");
  const community = get("sub_community_id");
  if (role === "organizer" && !isUuid(community)) throw new Error("Choose the sub community this organizer manages");
  return { email, password, role, subCommunityId: role === "organizer" ? (community as string) : null };
}

/** The "change password" form. */
export function parseNewPassword(get: (key: string) => unknown): string {
  const password = typeof get("password") === "string" ? (get("password") as string) : "";
  if (password.length < 10 || password.length > 72) throw new Error("The password must be 10 to 72 characters");
  if (password !== get("confirm")) throw new Error("The two passwords are not the same");
  return password;
}
