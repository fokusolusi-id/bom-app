import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { SubCommunity } from "@/domain/sub-community";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { ActionForm } from "@/components/form/action-form";
import { ImageUpload } from "@/components/form/image-upload";
import { deleteSubCommunity, prepareSubCommunityImageUpload, saveSubCommunity } from "./actions";
import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";

export const metadata = { title: "Sub Communities | Admin BOM" };

function SubCommunityForm({ s }: { s?: SubCommunity }) {
  return (
    <ActionForm action={saveSubCommunity} resetOnSuccess={!s} className="grid gap-3 sm:grid-cols-2">
      {s?.id && <input type="hidden" name="id" value={s.id} />}
      <Input name="name" defaultValue={s?.name} placeholder="Name" aria-label="Name" maxLength={60} required />
      <Input name="instagram" defaultValue={s?.instagram ?? ""} placeholder="Instagram (@handle or link)" aria-label="Instagram" maxLength={100} />
      <Textarea name="focus" defaultValue={s?.focus ?? ""} placeholder="Focus (age, area, format)" aria-label="Focus" maxLength={280} rows={2} className="sm:col-span-2" />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} aria-label="Order" />
      <ImageUpload name="image_path" label="Sub community photo" defaultPath={s?.image_path} prepare={prepareSubCommunityImageUpload} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} /> Show on website</label>
      <Button type="submit" className="sm:col-span-2">{s ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}

export default async function AdminSubCommunitiesPage() {
  const rows = await supabaseSubCommunities(await requireAdmin()).listAll();
  return (
    <AdminPage title="Sub Communities" hint="Shown on the homepage and the About page.">
      <AddCard title="New sub community"><SubCommunityForm /></AddCard>
      <ItemGrid>
      {rows.map((s) => (
        <Card key={s.id}>
          <CardHeader><CardTitle>{s.name}{!s.is_active && <span className="text-muted-foreground ml-2 text-sm">(hidden)</span>}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <SubCommunityForm s={s} />
            <ActionForm action={deleteSubCommunity.bind(null, s.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
      </ItemGrid>
    </AdminPage>
  );
}
