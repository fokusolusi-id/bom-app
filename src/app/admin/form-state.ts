export type FormState = { ok?: boolean; error?: string };

/**
 * Runs a mutation and turns a thrown error into an inline form message.
 * Call requireAdmin()/redirect() outside `run`: their control-flow throws must propagate.
 */
export async function toFormState(run: () => Promise<void>): Promise<FormState> {
  try {
    await run();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}
