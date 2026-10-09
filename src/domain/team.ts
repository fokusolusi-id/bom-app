import { parseImagePath } from "./media";
import { isUuid, parseText } from "./validation";

export type TeamMember = { playerId: string; name: string; bomId: string; photo: string | null };
export type TeamRole = { id?: string; title: string; sort_order: number; members: TeamMember[] };
/** `photos` maps a member's player id to a media path (or null to clear), only for members picked in this role. */
export type TeamRoleInput = { id?: string; title: string; sort_order: number; playerIds: string[]; photos: Record<string, string | null> };

export const PHOTO_FIELD = "photo:";

export const MAX_ROLE_MEMBERS = 12;

export function parseTeamRoleInput(
  get: (key: string) => unknown, getAll: (key: string) => unknown[], entries: [string, unknown][] = [],
): TeamRoleInput {
  const id = get("id");
  if (id !== null && id !== undefined && id !== "" && !isUuid(id)) throw new Error("Invalid id");
  const order = Number(get("sort_order") ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error("Urutan harus 0-999");
  const playerIds = [...new Set(getAll("player_id").filter((v): v is string => isUuid(v)))];
  if (playerIds.length > MAX_ROLE_MEMBERS) throw new Error(`Maksimal ${MAX_ROLE_MEMBERS} anggota per peran`);
  const photos: Record<string, string | null> = {};
  for (const [key, value] of entries) {
    if (!key.startsWith(PHOTO_FIELD)) continue;
    const playerId = key.slice(PHOTO_FIELD.length);
    if (isUuid(playerId) && playerIds.includes(playerId)) photos[playerId] = parseImagePath(value, "founding-team");
  }
  return {
    ...(id ? { id: id as string } : {}),
    title: parseText(get("title"), "Judul", 60),
    sort_order: order,
    playerIds,
    photos,
  };
}

/** Public strip order: roles by sort_order, members as stored. Members of one role are listed under it. */
export const teamStrip = (roles: TeamRole[]) =>
  roles.flatMap((r) => r.members.map((m) => ({ ...m, role: r.title })));
