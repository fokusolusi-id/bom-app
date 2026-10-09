import { parseTierLabel, type TierLabel } from "./tier";
import { isUuid, parseText } from "./validation";

export type ScheduleEvent = {
  id?: string; sub_community_id: string | null; name: string; starts_at: string; place: string; tier: TierLabel; is_active: boolean;
};
export type ScheduleEventInput = Omit<ScheduleEvent, "id"> & { id?: string };

/** An event joined with its sub community's name and logo, for display. */
export type ScheduleEventView = ScheduleEvent & { community: { name: string; image_path: string | null } | null };

const WIB = "+07:00";

/** "2026-10-10T18:00" typed in a datetime-local field is Medan time. Returns the ISO instant, or throws. */
export function wibLocalToIso(local: unknown): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/.exec(typeof local === "string" ? local.trim() : "");
  const at = m ? new Date(`${m[1]}T${m[2]}:00${WIB}`) : null;
  if (!at || Number.isNaN(at.getTime())) throw new Error("Tanggal dan jam tidak valid");
  return at.toISOString();
}

/** The reverse, for a datetime-local field's default value: an ISO instant as "YYYY-MM-DDTHH:mm" in Medan time. */
export function isoToWibLocal(iso: string): string {
  const wib = new Date(new Date(iso).getTime() + 7 * 3_600_000);
  return wib.toISOString().slice(0, 16);
}

/** "YYYY-MM-DD" of an instant in Medan time. */
export const wibDay = (iso: string) => isoToWibLocal(iso).slice(0, 10);
/** "HH:mm" of an instant in Medan time. */
export const wibTime = (iso: string) => isoToWibLocal(iso).slice(11, 16);

export function parseEventInput(get: (key: string) => unknown): ScheduleEventInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const community = get("sub_community_id");
  if (community !== null && community !== undefined && community !== "" && !isUuid(community)) throw new Error("Komunitas tidak valid");
  return {
    ...(id ? { id: id as string } : {}),
    sub_community_id: community ? (community as string) : null,
    name: parseText(get("name"), "Nama event", 80),
    starts_at: wibLocalToIso(get("starts_at")),
    place: parseText(get("place"), "Tempat", 120),
    tier: parseTierLabel(get("tier")),
    is_active: get("is_active") === "on" || get("is_active") === "true",
  };
}
