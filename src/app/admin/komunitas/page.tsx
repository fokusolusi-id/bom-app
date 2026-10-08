import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { SubCommunity } from "@/domain/sub-community";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { ActionForm } from "@/components/form/action-form";
import { ImageUpload } from "@/components/form/image-upload";
import { deleteSubCommunity, prepareSubCommunityImageUpload, saveSubCommunity } from "./actions";

export const metadata = { title: "Sub Komunitas | Admin BOM" };

function SubCommunityForm({ s }: { s?: SubCommunity }) {
  return (
    <ActionForm action={saveSubCommunity} resetOnSuccess={!s} className="grid gap-3 sm:grid-cols-2">
      {s?.id && <input type="hidden" name="id" value={s.id} />}
      <Input name="name" defaultValue={s?.name} placeholder="Nama" aria-label="Nama" maxLength={60} required />
      <Input name="schedule" defaultValue={s?.schedule} placeholder="Jadwal (mis. Sabtu malam)" aria-label="Jadwal" maxLength={60} required />
      <Input name="instagram" defaultValue={s?.instagram ?? ""} placeholder="Instagram (@handle atau link)" aria-label="Instagram" maxLength={100} />
      <Textarea name="focus" defaultValue={s?.focus ?? ""} placeholder="Fokus (umur, area, format)" aria-label="Fokus" maxLength={280} rows={2} className="sm:col-span-2" />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} aria-label="Urutan" />
      <ImageUpload name="image_path" label="Foto sub komunitas" defaultPath={s?.image_path} prepare={prepareSubCommunityImageUpload} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} /> Tampil di website</label>
      <Button type="submit" className="sm:col-span-2">{s ? "Simpan" : "Tambah"}</Button>
    </ActionForm>
  );
}

export default async function AdminSubCommunitiesPage() {
  const rows = await supabaseSubCommunities(await requireAdmin()).listAll();
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
            <ActionForm action={deleteSubCommunity.bind(null, s.id!)}><Button variant="destructive" size="sm">Hapus</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
