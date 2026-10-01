import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { SubCommunity } from "@/domain/sub-community";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { deleteSubCommunity, saveSubCommunity } from "./actions";

export const metadata = { title: "Sub Komunitas | Admin BOM" };

const field = "bg-input rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-ring";

function SubCommunityForm({ s }: { s?: SubCommunity }) {
  return (
    <form action={saveSubCommunity} className="grid gap-3 sm:grid-cols-2">
      {s?.id && <input type="hidden" name="id" value={s.id} />}
      <input name="name" defaultValue={s?.name} placeholder="Nama" maxLength={60} className={field} required />
      <input name="schedule" defaultValue={s?.schedule} placeholder="Jadwal (mis. Sabtu malam)" maxLength={60} className={field} required />
      <textarea name="focus" defaultValue={s?.focus ?? ""} placeholder="Fokus (umur, area, format)" maxLength={280} rows={2} className={`${field} sm:col-span-2`} />
      <input name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} aria-label="Urutan" className={field} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} /> Tampil di website</label>
      <Button type="submit" className="sm:col-span-2">{s ? "Simpan" : "Tambah"}</Button>
    </form>
  );
}

export default async function AdminSubCommunitiesPage() {
  const rows = await supabaseSubCommunities(await createClient()).listAll();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Sub komunitas baru</CardTitle></CardHeader>
        <CardContent><SubCommunityForm /></CardContent>
      </Card>
      {rows.map((s) => (
        <Card key={s.id}>
          <CardHeader><CardTitle>{s.name}{!s.is_active && <span className="text-muted-foreground ml-2 text-sm">(disembunyikan)</span>}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <SubCommunityForm s={s} />
            <form action={deleteSubCommunity.bind(null, s.id!)}><Button variant="destructive" size="sm">Hapus</Button></form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
