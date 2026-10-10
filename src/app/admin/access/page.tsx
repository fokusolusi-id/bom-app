import { AdminPage } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createServiceClient, hasServiceKey } from "@/lib/supabase/service";
import { requireStaff } from "@/server/admin-session";
import { redirect } from "next/navigation";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { removeStaff } from "./actions";
import { StaffForm } from "./staff-form";

export const metadata = { title: "Access | Admin BOM" };

type Row = { id: string; user_id: string; role: "admin" | "organizer"; community: { name: string } | null };

/** Who can sign in to the admin area, and what they may do. Admins only. */
export default async function AdminAccessPage() {
  const staff = await requireStaff();
  if (!staff.isAdmin) redirect("/admin/schedule");
  const canCreate = hasServiceKey();
  const [{ data }, subs, users] = await Promise.all([
    staff.supabase.from("staff").select("id,user_id,role,community:sub_communities(name)").order("role").order("created_at"),
    supabaseSubCommunities(staff.supabase).listAll(),
    canCreate ? createServiceClient().auth.admin.listUsers({ perPage: 1000 }) : Promise.resolve(null),
  ]);
  const emailOf = new Map((users?.data.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const rows = (data ?? []) as unknown as Row[];
  return (
    <AdminPage title="Access" hint="Who can sign in to this admin area. Admins can do everything; organizers manage the schedule and results of one sub community.">
      <div className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Give access</CardTitle></CardHeader>
          <CardContent>
            {canCreate
              ? <StaffForm communities={subs.flatMap((s) => (s.id ? [{ id: s.id, name: s.name }] : []))} />
              : <p className="text-muted-foreground text-sm">Creating logins needs the server key <code>SUPABASE_SERVICE_ROLE_KEY</code>. Add it to the Vercel environment variables (and <code>.env.local</code>), redeploy, then come back.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Current access</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Login</TableHead><TableHead>Role</TableHead><TableHead>Sub community</TableHead><TableHead className="w-px text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{emailOf.get(r.user_id) ?? `${r.user_id.slice(0, 8)}…`}{r.user_id === staff.userId && <span className="text-muted-foreground ml-2 text-xs font-normal">(you)</span>}</TableCell>
                    <TableCell className="text-primary font-bold uppercase">{r.role === "admin" ? "Admin" : "Organizer"}</TableCell>
                    <TableCell>{r.community?.name ?? "All"}</TableCell>
                    <TableCell className="text-right">
                      {!(r.user_id === staff.userId && r.role === "admin") && <ActionForm action={removeStaff.bind(null, r.id)}><Button variant="outline" size="sm">Remove</Button></ActionForm>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
