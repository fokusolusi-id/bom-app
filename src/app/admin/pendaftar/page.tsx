import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionForm } from "@/components/form/action-form";
import { AGE_GROUPS } from "@/domain/join-request";
import { requireAdmin } from "@/server/admin-session";
import { supabaseJoinRequests } from "@/server/join-requests";
import { setPlayerStatus } from "./actions";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { AdminPage } from "@/components/admin/admin-page";

export const metadata = { title: "Sign-ups | Admin BOM" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
const ageLabel = new Map<string, string>(AGE_GROUPS);
const wa = (n: string) => `https://wa.me/${n.slice(1)}`;

export default async function AdminJoinRequestsPage() {
  const rows = await supabaseJoinRequests(await requireAdmin()).listRecent();
  return (
    <AdminPage title="Sign-ups" hint="New sign-ups from the membership form. Activate a member to show them on the leaderboard.">
    <Card>
      <CardContent>
        {rows.length === 0 ? <p className="text-muted-foreground text-sm">No sign-ups yet.</p> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Blader</TableHead><TableHead>Contact</TableHead><TableHead>Details</TableHead><TableHead>Status</TableHead><TableHead>Received</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-bold">{r.blader_name ?? r.name}</div>
                    {r.player && <BomIdBadge id={r.player.bom_id} />}
                  </TableCell>
                  <TableCell className="space-y-1 text-sm">
                    <div>{r.name}</div>
                    <a href={wa(r.whatsapp)} target="_blank" rel="noreferrer" className="hover:text-primary block">{r.whatsapp}</a>
                    {r.guardian_name && r.guardian_whatsapp && (
                      <a href={wa(r.guardian_whatsapp)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary block">Guardian: {r.guardian_name} {r.guardian_whatsapp}</a>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground space-y-0.5 text-xs">
                    <div>{r.age_group ? ageLabel.get(r.age_group) : "-"}</div>
                    <div>Address: {r.address ?? "-"}</div>
                    <div>From: {r.hear_from ?? "-"}{r.photo_consent ? " · photo OK" : ""}</div>
                    {r.payment_proof_url ? <a href={r.payment_proof_url} target="_blank" rel="noreferrer" className="text-primary block underline">Payment proof</a> : <div>Payment proof: -</div>}
                  </TableCell>
                  <TableCell>
                    {r.player ? (
                      <ActionForm action={setPlayerStatus.bind(null, r.player.id, r.player.status === "active" ? "registered" : "active")}>
                        <Button variant={r.player.status === "active" ? "outline" : "default"} size="sm">{r.player.status === "active" ? "Active: deactivate" : "Registered: activate"}</Button>
                      </ActionForm>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{dateFormat.format(new Date(r.created_at))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </AdminPage>
  );
}
