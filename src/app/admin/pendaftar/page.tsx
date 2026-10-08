import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/server/admin-session";
import { supabaseJoinRequests } from "@/server/join-requests";

export const metadata = { title: "Pendaftar | Admin BOM" };

const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function AdminJoinRequestsPage() {
  const rows = await supabaseJoinRequests(await requireAdmin()).listRecent();
  return (
    <Card>
      <CardHeader><CardTitle>Pendaftar</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-muted-foreground text-sm">Belum ada pendaftar.</p> : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Nama</TableHead><TableHead>Kontak</TableHead><TableHead>Sub komunitas</TableHead><TableHead>Masuk</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-bold">{r.name}</TableCell>
                  <TableCell className="space-y-1 text-sm">
                    <a href={`https://wa.me/${r.whatsapp.slice(1)}`} target="_blank" rel="noreferrer" className="hover:text-primary block">{r.whatsapp}</a>
                    <a href={`mailto:${r.email}`} className="text-muted-foreground hover:text-primary block">{r.email}</a>
                  </TableCell>
                  <TableCell>{r.sub_community ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{dateFormat.format(new Date(r.created_at))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
