import { AdminPage } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireStaff } from "@/server/admin-session";
import { changePassword } from "./actions";

export const metadata = { title: "Account | Admin BOM" };

const label = "text-muted-foreground flex flex-col gap-1 text-xs uppercase";

export default async function AdminAccountPage() {
  const { email } = await requireStaff();
  return (
    <AdminPage title="Account" hint={`Signed in as ${email}.`}>
      <Card className="max-w-md">
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent>
          <ActionForm action={changePassword} resetOnSuccess className="grid gap-4">
            <label className={label}>New password (10 characters or more)<Input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className="text-base text-white" /></label>
            <label className={label}>Repeat the new password<Input name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className="text-base text-white" /></label>
            <Button type="submit">Change password</Button>
          </ActionForm>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
