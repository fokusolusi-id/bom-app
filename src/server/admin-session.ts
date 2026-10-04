import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Resolves the signed-in admin's client, or redirects/throws. RLS stays the last line of defence. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) throw new Error("Forbidden");
  return supabase;
}
