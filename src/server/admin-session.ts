import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Access } from "@/domain/access";
import { hasSupabase } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = { role: "admin" | "organizer"; sub_community_id: string | null; community_name: string | null };

// Memoised per request, so layout, page and actions share one auth round trip.
const getStaffSession = cache(async () => {
  if (!hasSupabase()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user, roles: [] as StaffRole[] };
  const { data } = await supabase.from("staff").select("role,sub_community_id,community:sub_communities(name)").eq("user_id", user.id);
  const roles = ((data ?? []) as unknown as { role: "admin" | "organizer"; sub_community_id: string | null; community: { name: string } | null }[])
    .map((r) => ({ role: r.role, sub_community_id: r.sub_community_id, community_name: r.community?.name ?? null }));
  return { supabase, user, roles };
});

/** What the signed-in staff member may do, from their staff rows. */
const accessOf = (roles: StaffRole[]): Access => ({
  isAdmin: roles.some((r) => r.role === "admin"),
  communityIds: roles.flatMap((r) => (r.role === "organizer" && r.sub_community_id ? [r.sub_community_id] : [])),
});

/**
 * Resolves the signed-in staff member (admin or organizer), or redirects to /login (which explains why).
 * Call it in every admin page and action: layouts don't re-run on navigation. RLS stays the last line of defence.
 */
export async function requireStaff() {
  const session = await getStaffSession();
  if (!session?.user) redirect("/login");
  if (session.roles.length === 0) redirect("/login?error=forbidden");
  return { supabase: session.supabase, userId: session.user.id, email: session.user.email ?? "", roles: session.roles, ...accessOf(session.roles) };
}

/** Admins only. Organizers are sent to the part of the admin area they may use. */
export async function requireAdmin() {
  const staff = await requireStaff();
  if (!staff.isAdmin) redirect("/admin/schedule");
  return staff.supabase;
}
