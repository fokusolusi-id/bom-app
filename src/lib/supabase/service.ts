import "server-only";
import { createClient } from "@supabase/supabase-js";

/** True when the server has the service role key, which can create logins and bypasses the database rules. */
export const hasServiceKey = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Client with the service role key. Server-only, never reaches the browser. Use it for the few things a signed-in user
 * cannot do under the database rules: creating logins and recalculating everyone's points after an organizer saves results.
 */
export function createServiceClient() {
  if (!hasServiceKey()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
