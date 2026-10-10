"use server";
import { revalidatePath } from "next/cache";
import { parseStaffInput } from "@/domain/access";
import { isUuid } from "@/domain/validation";
import { toFormState, type FormState } from "@/lib/form-state";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import { requireStaff } from "@/server/admin-session";


/** Creates the login (or reuses an existing one with this email) and gives it a role. The password is only ever sent to Supabase. */
export async function addStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    if (!staff.isAdmin) throw new Error("Only an admin can manage access");
    if (!hasServiceKey()) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY on the server to create logins");
    const input = parseStaffInput((k) => formData.get(k));
    const auth = createServiceClient().auth.admin;
    let userId: string;
    const created = await auth.createUser({ email: input.email, password: input.password, email_confirm: true });
    if (created.data.user) {
      userId = created.data.user.id;
    } else if (/already|registered|exists/i.test(created.error?.message ?? "")) {
      // This email already has a login: give it the role and leave its password alone.
      const { data } = await auth.listUsers({ perPage: 1000 });
      const existing = data.users.find((u) => u.email?.toLowerCase() === input.email);
      if (!existing) throw new Error("Could not find that login");
      userId = existing.id;
    } else {
      throw new Error(created.error?.message ?? "Could not create the login");
    }
    const { error } = await staff.supabase.from("staff").insert({ user_id: userId, role: input.role, sub_community_id: input.subCommunityId });
    if (error?.code === "23505") throw new Error("This login already has that access");
    if (error) throw new Error("Could not save the access");
    revalidatePath("/admin/access");
  }, "Access given. Send them the email and password privately; they can change the password from the profile menu.");
}

export async function removeStaff(id: string): Promise<FormState> {
  const staff = await requireStaff();
  return toFormState(async () => {
    if (!staff.isAdmin) throw new Error("Only an admin can manage access");
    if (!isUuid(id)) throw new Error("Invalid input");
    const { data } = await staff.supabase.from("staff").select("user_id,role").eq("id", id).maybeSingle();
    if (!data) throw new Error("Access not found");
    if (data.user_id === staff.userId && data.role === "admin") throw new Error("You cannot remove your own admin access");
    const { error } = await staff.supabase.from("staff").delete().eq("id", id);
    if (error) throw new Error("Could not remove the access");
    revalidatePath("/admin/access");
  });
}
