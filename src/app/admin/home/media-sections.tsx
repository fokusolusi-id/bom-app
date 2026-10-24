import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionForm } from "@/components/form/action-form";
import { MediaUpload } from "@/components/form/media-upload";
import type { MediaSection, SiteMedia } from "@/domain/site-media";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSiteMedia } from "@/server/site-media";
import { deleteSiteMedia, prepareSiteMediaUpload, saveSiteMedia } from "../media/actions";
import { AddCard, ItemGrid } from "@/components/admin/admin-page";

function MediaForm({ section, item }: { section: MediaSection; item?: SiteMedia }) {
  const prepare = prepareSiteMediaUpload.bind(null, section);
  return (
    <ActionForm action={saveSiteMedia} resetOnSuccess={!item} className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="section" value={section} />
      {section === "news" ? (
        <>
          <MediaUpload name="path" label="Upload video" defaultPath={item?.path} prepare={prepare} kind="video" />
          <Input name="youtube_url" defaultValue={item?.youtube_id ? `https://youtu.be/${item.youtube_id}` : ""} placeholder="or a YouTube link (leave empty if you upload a video)" aria-label="Link YouTube" maxLength={200} className="sm:col-span-2" />
        </>
      ) : (
        <MediaUpload name="path" label={section === "popup" ? "Photo or video" : "Photo"} defaultPath={item?.path} prepare={prepare} kind={section === "popup" ? "any" : "image"} />
      )}
      <Input name="caption" defaultValue={item?.caption ?? ""} placeholder="Caption (optional)" aria-label="Caption" maxLength={120} />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={item?.sort_order ?? 0} placeholder="Order" aria-label="Order" />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={item?.is_active ?? true} /> Show on website</label>
      <Button type="submit" className="sm:col-span-2">{item ? "Save" : "Add"}</Button>
    </ActionForm>
  );
}

async function Section({ id, section, title, hint }: { id: string; section: MediaSection; title: string; hint: string }) {
  const items = await supabaseSiteMedia(await requireAdmin()).list(section, { includeInactive: true });
  return (
    <section id={id} className="scroll-mt-20 space-y-4" aria-labelledby={`m-${section}`}>
      <div>
        <h2 id={`m-${section}`} className="text-xl">{title}</h2>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </div>
      <AddCard title="Add new"><MediaForm section={section} /></AddCard>
      <ItemGrid>
      {items.map((m) => (
        <Card key={m.id}>
          <CardHeader><CardTitle className="text-base">{m.caption ?? (m.youtube_id ? `YouTube ${m.youtube_id}` : m.path?.split("/").pop())}{!m.is_active && <span className="text-muted-foreground ml-2 text-sm">(hidden)</span>}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <MediaForm section={section} item={m} />
            <ActionForm action={deleteSiteMedia.bind(null, m.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
      </ItemGrid>
    </section>
  );
}

export const SliderSection = () => (
  <Section id="slider" section="news" title="Slider (What's new)" hint="Uploaded video (MP4/WebM, max 20 MB) or a YouTube link. Shown on the homepage below the gallery." />
);

export const PopupSection = () => (
  <Section id="popup" section="popup" title="Event pop-up" hint="Pictures (JPG/PNG/WebP, max 5 MB) or a video (MP4/WebM, max 20 MB) of upcoming events. When the homepage opens they show in a pop-up: one item, or a slider if there are several, in this order. A video plays in a loop, with sound. Add a caption to say what it is; put a | in it for a second line, for example: BK2 Cup #1 2026 | 31.10.2026. Untick 'Show on website' to hide one, or delete them all to turn the pop-up off." />
);

export const GallerySection = () => (
  <Section id="gallery" section="gallery" title="Gallery" hint="JPG/PNG/WebP photos, max 5 MB. Shown on the homepage as a full-screen slideshow with thumbnails, in this order." />
);
