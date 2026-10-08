import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Memoised per request, so layout, page and actions share one auth round trip.
const getAdminSession = cache(async () => {
  if (!hasSupabase()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user, isAdmin: false };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, user, isAdmin: isAdmin === true };
});

/**
 * Resolves the signed-in admin's client, or redirects to /login (which explains why).
 * Call it in every admin page and action: layouts don't re-run on navigation. RLS stays the last line of defence.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session?.user) redirect("/login");
  if (!session.isAdmin) redirect("/login?error=forbidden");
  return session.supabase;
}
