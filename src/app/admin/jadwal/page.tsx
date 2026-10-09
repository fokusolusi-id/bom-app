import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";
import { TierBadge } from "@/components/bom/tier-badge";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { isoToWibLocal, type ScheduleEventView } from "@/domain/event";
import { TIER_LABELS } from "@/domain/tier";
import { VENUE } from "@/lib/venue";
import { requireAdmin } from "@/server/admin-session";
import { supabaseScheduleEvents } from "@/server/schedule-events";
import { supabaseSubCommunities } from "@/server/sub-communities";
import { deleteScheduleEvent, saveScheduleEvent } from "./actions";

export const metadata = { title: "Jadwal | Admin BOM" };

const when = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" });
const DAY = 86_400_000;

function EventForm({ e, communities }: { e?: ScheduleEventView; communities: { id: string; name: string }[] }) {
  return (
    <ActionForm action={saveScheduleEvent} resetOnSuccess={!e} className="grid gap-3 sm:grid-cols-2">
      {e?.id && <input type="hidden" name="id" value={e.id} />}
      <Input name="name" defaultValue={e?.name} placeholder="Nama event (mis. Weekly Ranked)" aria-label="Nama event" maxLength={80} required className="sm:col-span-2" />
      <NativeSelect name="sub_community_id" aria-label="Komunitas" defaultValue={e?.sub_community_id ?? ""}>
        <option value="">Semua komunitas (BOM)</option>
        {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </NativeSelect>
      <NativeSelect name="tier" aria-label="Jenis kompetisi" defaultValue={e?.tier ?? "Ranked"}>
        {TIER_LABELS.map((t) => <option key={t} value={t}>BOM {t}</option>)}
      </NativeSelect>
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">Tanggal dan jam (WIB)
        <Input name="starts_at" type="datetime-local" defaultValue={e ? isoToWibLocal(e.starts_at) : ""} required className="text-base text-white" />
      </label>
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">Tempat
        <Input name="place" defaultValue={e?.place ?? VENUE} maxLength={120} required className="text-base text-white" />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={e?.is_active ?? true} /> Tampil di website</label>
      <Button type="submit" className="sm:col-span-2">{e ? "Simpan" : "Tambah"}</Button>
    </ActionForm>
  );
}

export default async function AdminSchedulePage() {
  const supabase = await requireAdmin();
  const now = new Date();
  const from = new Date(now.getTime() - 30 * DAY).toISOString();
  const to = new Date(now.getTime() + 365 * DAY).toISOString();
  const [events, subs] = await Promise.all([
    supabaseScheduleEvents(supabase).between(from, to, { includeInactive: true }),
    supabaseSubCommunities(supabase).listAll(),
  ]);
  const communities = subs.flatMap((s) => (s.id ? [{ id: s.id, name: s.name }] : []));
  return (
    <AdminPage title="Jadwal" hint="Event di halaman Schedule dan beranda. Menampilkan 30 hari terakhir sampai satu tahun ke depan.">
      <AddCard title="Event baru"><EventForm communities={communities} /></AddCard>
      <ItemGrid>
        {events.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <TierBadge tier={e.tier} className="w-auto" />{e.name}
                {!e.is_active && <span className="text-muted-foreground text-sm">(disembunyikan)</span>}
              </CardTitle>
              <p className="text-muted-foreground text-sm">{when.format(new Date(e.starts_at))} WIB · {e.community?.name ?? "BOM"}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <EventForm e={e} communities={communities} />
              <ActionForm action={deleteScheduleEvent.bind(null, e.id!)}><Button variant="destructive" size="sm">Hapus</Button></ActionForm>
            </CardContent>
          </Card>
        ))}
      </ItemGrid>
    </AdminPage>
  );
}
