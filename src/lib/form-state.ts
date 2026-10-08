export type FormState = { ok?: boolean; error?: string; message?: string };

/**
 * Runs a mutation and turns a thrown error into an inline form message.
 * Call requireAdmin()/redirect() outside `run`: their control-flow throws must propagate.
 */
export async function toFormState(run: () => Promise<void>, message?: string): Promise<FormState> {
  try {
    await run();
    return { ok: true, message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}
