"use server";
import { parseNewPassword } from "@/domain/access";
import { toFormState, type FormState } from "@/lib/form-state";
import { requireStaff } from "@/server/admin-session";

/** Changes the password of the signed-in account. */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    const { error } = await staff.supabase.auth.updateUser({ password: parseNewPassword((k) => formData.get(k)) });
    if (error) throw new Error(error.message);
  }, "Password changed");
}
