import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionForm } from "@/components/form/action-form";
import { MediaUpload } from "@/components/form/media-upload";
import type { MediaSection, SiteMedia } from "@/domain/site-media";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSiteMedia } from "@/server/site-media";
import { deleteSiteMedia, prepareSiteMediaUpload, saveSiteMedia } from "./actions";
import { AddCard, AdminPage, ItemGrid } from "@/components/admin/admin-page";

export const metadata = { title: "Media | Admin BOM" };

function MediaForm({ section, item }: { section: MediaSection; item?: SiteMedia }) {
  const prepare = prepareSiteMediaUpload.bind(null, section);
  return (
    <ActionForm action={saveSiteMedia} resetOnSuccess={!item} className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="section" value={section} />
      {section === "news" ? (
        <>
          <MediaUpload name="path" label="Upload video" defaultPath={item?.path} prepare={prepare} kind="video" />
          <Input name="youtube_url" defaultValue={item?.youtube_id ? `https://youtu.be/${item.youtube_id}` : ""} placeholder="atau link YouTube (kosongkan jika upload video)" aria-label="Link YouTube" maxLength={200} className="sm:col-span-2" />
        </>
      ) : (
        <MediaUpload name="path" label="Foto" defaultPath={item?.path} prepare={prepare} kind="image" />
      )}
      <Input name="caption" defaultValue={item?.caption ?? ""} placeholder="Keterangan (opsional)" aria-label="Keterangan" maxLength={120} />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={item?.sort_order ?? 0} aria-label="Urutan" />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={item?.is_active ?? true} /> Tampil di website</label>
      <Button type="submit" className="sm:col-span-2">{item ? "Simpan" : "Tambah"}</Button>
    </ActionForm>
  );
}

async function Section({ section, title, hint }: { section: MediaSection; title: string; hint: string }) {
  const items = await supabaseSiteMedia(await requireAdmin()).list(section, { includeInactive: true });
  return (
    <section className="space-y-4" aria-labelledby={`m-${section}`}>
      <div>
        <h2 id={`m-${section}`} className="text-xl">{title}</h2>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </div>
      <AddCard title="Tambah baru"><MediaForm section={section} /></AddCard>
      <ItemGrid>
      {items.map((m) => (
        <Card key={m.id}>
          <CardHeader><CardTitle className="text-base">{m.caption ?? (m.youtube_id ? `YouTube ${m.youtube_id}` : m.path?.split("/").pop())}{!m.is_active && <span className="text-muted-foreground ml-2 text-sm">(disembunyikan)</span>}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <MediaForm section={section} item={m} />
            <ActionForm action={deleteSiteMedia.bind(null, m.id!)}><Button variant="destructive" size="sm">Hapus</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
      </ItemGrid>
    </section>
  );
}

export default async function AdminMediaPage() {
  return (
    <AdminPage title="Slider & Galeri" hint="Konten beranda: video What's new dan foto galeri.">
      <div className="space-y-12">
      <Section section="news" title="What's new" hint="Video upload (MP4/WebM, maks 20 MB) atau link YouTube. Ditampilkan di beranda, di bawah galeri." />
      <Section section="gallery" title="Galeri" hint="Foto JPG/PNG/WebP, maks 5 MB. Tampil sebagai slideshow layar penuh dengan thumbnail di beranda, sesuai urutan." />
      </div>
    </AdminPage>
  );
}
