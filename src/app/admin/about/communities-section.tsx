import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { SubCommunity } from "@/domain/sub-community";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { ActionForm } from "@/components/form/action-form";
import { ImageUpload } from "@/components/form/image-upload";
import { deleteSubCommunity, prepareSubCommunityImageUpload, saveSubCommunity } from "../komunitas/actions";
import { AddCard, AdminSection, ItemGrid } from "@/components/admin/admin-page";

function SubCommunityForm({ s }: { s?: SubCommunity }) {
  return (
    <ActionForm action={saveSubCommunity} resetOnSuccess={!s} className="grid gap-4">
      {s?.id && <input type="hidden" name="id" value={s.id} />}
      <Input name="name" defaultValue={s?.name} maxLength={60} required placeholder="Name" aria-label="Name" />
      <Input name="address" defaultValue={s?.address ?? ""} maxLength={120} placeholder="Address (used by this community's events)" aria-label="Address (used by this community's events)" />
      <Input name="instagram" defaultValue={s?.instagram ?? ""} maxLength={100} placeholder="Instagram (@handle or link)" aria-label="Instagram (@handle or link)" />
      <Textarea name="focus" defaultValue={s?.focus ?? ""} maxLength={280} rows={2} placeholder="Focus (age, area, format)" aria-label="Focus (age, area, format)" />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} placeholder="Order" aria-label="Order" />
      <div><ImageUpload name="image_path" label="Sub community photo" defaultPath={s?.image_path} prepare={prepareSubCommunityImageUpload} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} /> Show on website</label>
      <Button type="submit" >{s ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}

export async function CommunitiesSection() {
  const rows = await supabaseSubCommunities(await requireAdmin()).listAll();
  return (
    <AdminSection id="sub-communities" title="Sub Communities" hint="Shown on the homepage and the About page.">
      <AddCard title="New sub community"><SubCommunityForm /></AddCard>
      <ItemGrid single>
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
    </AdminSection>
  );
}
