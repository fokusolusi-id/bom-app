import { AddCard, ItemGrid } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { ImageUpload } from "@/components/form/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { SPONSOR_TIERS, type Sponsor, type SponsorTier } from "@/domain/sponsor";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSponsors } from "@/server/sponsors";
import { deleteSponsor, prepareSponsorLogoUpload, saveSponsor } from "../sponsor/actions";

/** One sponsor. In a tier's "new sponsor" card `tier` fixes the tier; when editing, the tier can be changed. */
function SponsorForm({ s, tier }: { s?: Sponsor; tier?: SponsorTier }) {
  return (
    <ActionForm action={saveSponsor} resetOnSuccess={!s} className="grid gap-3 sm:grid-cols-2">
      {s?.id && <input type="hidden" name="id" value={s.id} />}
      <Input name="name" defaultValue={s?.name} placeholder="Sponsor name" aria-label="Name" maxLength={60} required />
      {tier ? (
        <input type="hidden" name="tier" value={tier} />
      ) : (
        <NativeSelect name="tier" aria-label="Tier" defaultValue={s?.tier ?? "silver"}>
          {SPONSOR_TIERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </NativeSelect>
      )}
      <Input name="website" defaultValue={s?.website ?? ""} placeholder="Website (optional)" aria-label="Website" maxLength={200} />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} placeholder="Order" aria-label="Order" />
      <ImageUpload name="logo_path" label="Logo" defaultPath={s?.logo_path} prepare={prepareSponsorLogoUpload} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} /> Show on website</label>
      <Button type="submit" className="sm:col-span-2">{s ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}

export async function SponsorSection() {
  const rows = await supabaseSponsors(await requireAdmin()).list({ includeInactive: true });
  return (
    <section id="sponsors" className="scroll-mt-20 space-y-8" aria-labelledby="m-sponsors">
      <div>
        <h2 id="m-sponsors" className="text-xl">Supported By</h2>
        <p className="text-muted-foreground text-sm">Logos appear on the homepage under Supported by. Add each sponsor under its package: Gold, Silver or Bronze. Use a PNG/WebP logo (a transparent background works best).</p>
      </div>
      {SPONSOR_TIERS.map(([tier, label]) => {
        const mine = rows.filter((r) => r.tier === tier);
        return (
          <div key={tier} id={`sponsors-${tier}`} className="scroll-mt-20 space-y-4">
            <h3 className="font-display text-lg font-extrabold italic uppercase">{label}</h3>
            <AddCard title={`New ${tier} sponsor`}><SponsorForm tier={tier} /></AddCard>
            {mine.length === 0 ? (
              <p className="text-muted-foreground text-sm">No {tier} sponsor yet.</p>
            ) : (
              <ItemGrid>
                {mine.map((s) => (
                  <Card key={s.id}>
                    <CardHeader><CardTitle>{s.name}{!s.is_active && <span className="text-muted-foreground ml-2 text-sm">(hidden)</span>}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <SponsorForm s={s} />
                      <ActionForm action={deleteSponsor.bind(null, s.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
                    </CardContent>
                  </Card>
                ))}
              </ItemGrid>
            )}
          </div>
        );
      })}
    </section>
  );
}
