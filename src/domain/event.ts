import { TIER_LABELS, usesBomLogo, type TierLabel } from "./tier";
import { isUuid, parseText } from "./validation";

/** What kind of day it is: a competition level, or a break / holiday with no gathering. */
export type EventType = TierLabel | "Break";
export const EVENT_TYPES: readonly EventType[] = [...TIER_LABELS, "Break"];

export function parseEventType(value: unknown): EventType {
  if (typeof value !== "string" || !(EVENT_TYPES as readonly string[]).includes(value)) throw new Error("Invalid event type");
  return value as EventType;
}

/** Cup and above, and breaks, belong to BOM as a whole and show the BOM logo. */
export const eventUsesBomLogo = (type: EventType) => type === "Break" || usesBomLogo(type);

export type ScheduleEvent = {
  id?: string; sub_community_id: string | null; name: string; starts_at: string; place: string | null; tier: EventType; is_active: boolean; challonge_url?: string | null;
};
export type ScheduleEventInput = Omit<ScheduleEvent, "id"> & { id?: string };

/** An event joined with its sub community's name, logo and address, for display. */
export type ScheduleEventView = ScheduleEvent & { community: { name: string; image_path: string | null; address: string | null } | null };

/** Where an event takes place: its own place, else its community's address, else `fallback` (the main venue). */
export const eventPlace = (e: { place: string | null; community?: { address: string | null } | null }, fallback: string) =>
  e.place ?? e.community?.address ?? fallback;

const WIB = "+07:00";

/** "2026-10-10T18:00" typed in a datetime-local field is Medan time. Returns the ISO instant, or throws. */
export function wibLocalToIso(local: unknown): string {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/.exec(typeof local === "string" ? local.trim() : "");
  const at = m ? new Date(`${m[1]}T${m[2]}:00${WIB}`) : null;
  if (!at || Number.isNaN(at.getTime())) throw new Error("Invalid date and time");
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
  if (community !== null && community !== undefined && community !== "" && !isUuid(community)) throw new Error("Invalid community");
  return {
    ...(id ? { id: id as string } : {}),
    sub_community_id: community ? (community as string) : null,
    name: parseText(get("name"), "Event name", 80),
    starts_at: wibLocalToIso(get("starts_at")),
    place: parseText(get("place"), "Place", 120, "") || null,
    tier: parseEventType(get("tier")),
    is_active: get("is_active") === "on" || get("is_active") === "true",
  };
}

// Which type wins a day: breaks first, then bigger competitions. Unrank and Ranked (one per sub komunitas) tie.
const PRIORITY: Record<EventType, number> = { Break: 0, Championship: 1, Major: 2, Cup: 3, Ranked: 4, Unrank: 4 };

const sortKey = (e: { starts_at: string }) => `${(e as { id?: string }).id ?? ""}|${e.starts_at}`;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * One event per day. The day's top-priority type wins; when several sub komunitas tie (e.g. five Saturday gatherings)
 * one is picked at random. The pick is seeded by the date, so it does not flicker between page loads.
 * Input order is kept for the days returned.
 */
export function pickOnePerDay<T extends { starts_at: string; tier: EventType }>(events: T[]): T[] {
  const byDay = new Map<string, T[]>();
  for (const e of events) {
    const day = wibDay(e.starts_at);
    byDay.set(day, [...(byDay.get(day) ?? []), e]);
  }
  const winners = new Set<T>();
  for (const [day, list] of byDay) {
    const best = Math.min(...list.map((e) => PRIORITY[e.tier]));
    // Sorted so the pick does not depend on the order the database returns rows in.
    const tied = list.filter((e) => PRIORITY[e.tier] === best).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    winners.add(tied[hash(day) % tied.length]);
  }
  return events.filter((e) => winners.has(e));
}

/** How many different days have a Ranked event: "2" for a Thursday and a Saturday gathering in the same week. */
export function rankedDays(events: { starts_at: string; tier: EventType }[]): number {
  return new Set(events.filter((e) => e.tier === "Ranked").map((e) => wibDay(e.starts_at))).size;
}
