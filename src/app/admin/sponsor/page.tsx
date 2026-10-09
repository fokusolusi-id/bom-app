import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { ImageUpload } from "@/components/form/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { SPONSOR_TIERS, type Sponsor } from "@/domain/sponsor";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSponsors } from "@/server/sponsors";
import { deleteSponsor, prepareSponsorLogoUpload, saveSponsor } from "./actions";

export const metadata = { title: "Sponsor | Admin BOM" };

function SponsorForm({ s }: { s?: Sponsor }) {
  return (
    <ActionForm action={saveSponsor} resetOnSuccess={!s} className="grid gap-3 sm:grid-cols-2">
      {s?.id && <input type="hidden" name="id" value={s.id} />}
      <Input name="name" defaultValue={s?.name} placeholder="Sponsor name" aria-label="Name" maxLength={60} required />
      <NativeSelect name="tier" aria-label="Tier" defaultValue={s?.tier ?? "silver"}>
        {SPONSOR_TIERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </NativeSelect>
      <Input name="website" defaultValue={s?.website ?? ""} placeholder="Website (optional)" aria-label="Website" maxLength={200} />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} aria-label="Order" />
      <ImageUpload name="logo_path" label="Logo" defaultPath={s?.logo_path} prepare={prepareSponsorLogoUpload} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} /> Show on website</label>
      <Button type="submit" className="sm:col-span-2">{s ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}

export default async function AdminSponsorsPage() {
  const rows = await supabaseSponsors(await requireAdmin()).list({ includeInactive: true });
  return (
    <AdminPage title="Sponsor" hint="Logos appear on the homepage under Supported by. Use a PNG/WebP logo (a transparent background works best).">
      <AddCard title="New sponsor"><SponsorForm /></AddCard>
      <ItemGrid>
        {rows.map((s) => (
          <Card key={s.id}>
            <CardHeader><CardTitle>{s.name}{!s.is_active && <span className="text-muted-foreground ml-2 text-sm">(disembunyikan)</span>}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <SponsorForm s={s} />
              <ActionForm action={deleteSponsor.bind(null, s.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
            </CardContent>
          </Card>
        ))}
      </ItemGrid>
    </AdminPage>
  );
}
