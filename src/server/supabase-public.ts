import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Cookie-less anon client for public reads, so pages stay statically cacheable (ISR). */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
