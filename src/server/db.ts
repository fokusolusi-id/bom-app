import "server-only";

/** Throws a labelled error for a failed Supabase call. */
export function check(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what}: ${error.message}`);
}
