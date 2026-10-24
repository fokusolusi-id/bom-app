import { AddCard, ItemGrid } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { ImageUpload } from "@/components/form/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { SPONSOR_TIERS, type Sponsor, type SponsorTier } from "@/domain/sponsor";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSponsors } from "@/server/sponsors";
import { deletePackageSponsor, deleteSponsor, prepareSponsorLogoUpload, savePackageSponsor, saveSponsor } from "../sponsor/actions";

type SaveAction = typeof saveSponsor;

/**
 * One sponsor. `tier` fixes the package (in a new Gold, Silver or Bronze sponsor); `withTier` shows the package choice (editing one);
 * with neither it is a plain "Supported by" logo and the package is not asked.
 */
function SponsorForm({ s, save, tier, withTier }: { s?: Sponsor; save: SaveAction; tier?: SponsorTier; withTier?: boolean }) {
  return (
    <ActionForm action={save} resetOnSuccess={!s} className="grid gap-3 sm:grid-cols-2">
      {s?.id && <input type="hidden" name="id" value={s.id} />}
      <Input name="name" defaultValue={s?.name} placeholder="Name" aria-label="Name" maxLength={60} required />
      {withTier ? (
        <NativeSelect name="tier" aria-label="Package" defaultValue={s?.tier ?? "silver"}>
          {SPONSOR_TIERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </NativeSelect>
      ) : (
        <input type="hidden" name="tier" value={tier ?? s?.tier ?? "silver"} />
      )}
      <Input name="website" defaultValue={s?.website ?? ""} placeholder="Website (optional)" aria-label="Website" maxLength={200} />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={s?.sort_order ?? 0} placeholder="Order" aria-label="Order" />
      <ImageUpload name="logo_path" label="Logo" defaultPath={s?.logo_path} prepare={prepareSponsorLogoUpload} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={s?.is_active ?? true} /> Show on website</label>
      <Button type="submit" className="sm:col-span-2">{s ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}

function SponsorCard({ s, save, remove, withTier }: { s: Sponsor; save: SaveAction; remove: typeof deleteSponsor; withTier?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>{s.name}{!s.is_active && <span className="text-muted-foreground ml-2 text-sm">(hidden)</span>}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <SponsorForm s={s} save={save} withTier={withTier} />
        <ActionForm action={remove.bind(null, s.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
      </CardContent>
    </Card>
  );
}

/** "Supported by": the logos in the slider on the homepage. No packages. */
export async function SponsorSection() {
  const rows = await supabaseSponsors(await requireAdmin()).list({ includeInactive: true });
  return (
    <section id="sponsors" className="scroll-mt-20 space-y-4" aria-labelledby="m-sponsors">
      <div>
        <h2 id="m-sponsors" className="text-xl">Supported By</h2>
        <p className="text-muted-foreground text-sm">Logos in the slider on the homepage under Supported by, in the order you set. Use a PNG/WebP logo (a transparent background works best).</p>
      </div>
      <AddCard title="New supporter"><SponsorForm save={saveSponsor} /></AddCard>
      <ItemGrid>{rows.map((s) => <SponsorCard key={s.id} s={s} save={saveSponsor} remove={deleteSponsor} />)}</ItemGrid>
    </section>
  );
}

/** "Sponsors": the Gold, Silver and Bronze sponsors, shown on the Sponsorship page and above Supported by on the homepage. */
export async function PackageSponsorsSection() {
  const rows = await supabaseSponsors(await requireAdmin(), "package_sponsors").list({ includeInactive: true });
  return (
    <section id="package-sponsors" className="scroll-mt-20 space-y-8" aria-labelledby="m-package-sponsors">
      <div>
        <h2 id="m-package-sponsors" className="text-xl">Sponsors</h2>
        <p className="text-muted-foreground text-sm">Add each sponsor under its package. They show on the Sponsorship page and above Supported by on the homepage, Gold first.</p>
      </div>
      {SPONSOR_TIERS.map(([tier, label]) => {
        const mine = rows.filter((r) => r.tier === tier);
        return (
          <div key={tier} id={`sponsors-${tier}`} className="scroll-mt-20 space-y-4">
            <h3 className="font-display text-lg font-extrabold italic uppercase">{label}</h3>
            <AddCard title={`New ${tier} sponsor`}><SponsorForm save={savePackageSponsor} tier={tier} /></AddCard>
            {mine.length === 0 ? (
              <p className="text-muted-foreground text-sm">No {tier} sponsor yet.</p>
            ) : (
              <ItemGrid>{mine.map((s) => <SponsorCard key={s.id} s={s} save={savePackageSponsor} remove={deletePackageSponsor} withTier />)}</ItemGrid>
            )}
          </div>
        );
      })}
    </section>
  );
}
