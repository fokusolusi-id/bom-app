import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { ActionForm } from "@/components/form/action-form";
import { funnel } from "@/lib/content";
import { publicSubCommunities } from "@/server/sub-communities";
import { submitJoinRequest } from "./actions";

export const metadata = { title: "Mulai dari Nol | BOM" };
export const revalidate = 60;

export default async function MulaiPage() {
  const subs = await publicSubCommunities().listActive();
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <RibbonBanner>Mulai dari Nol</RibbonBanner>
      <p className="text-muted-foreground mt-4 max-w-xl text-sm">Belum punya bey? Tidak masalah. Kompetitif di puncak, ramah di pintu.</p>
      <ol className="mt-6 grid gap-4 md:grid-cols-5">
        {funnel.map(([t, d], i) => (
          <Card key={t}>
            <CardHeader>
              <div className="font-display text-primary text-3xl font-black italic">{i + 1}</div>
              <CardTitle>{t}</CardTitle>
              <CardDescription>{d}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </ol>

      <Card id="daftar" className="mt-12 max-w-2xl">
        <CardHeader>
          <CardTitle>Daftar BOM</CardTitle>
          <CardDescription>Isi data kamu, pengurus akan menghubungi lewat WhatsApp untuk BOM ID dan jadwal gathering.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={submitJoinRequest} resetOnSuccess className="grid gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="Nama" aria-label="Nama" autoComplete="name" minLength={2} maxLength={60} required />
            <Input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" maxLength={120} required />
            <Input name="whatsapp" type="tel" placeholder="No. WhatsApp (08xx)" aria-label="Nomor WhatsApp" autoComplete="tel" maxLength={20} required />
            <NativeSelect name="sub_community" aria-label="Sub komunitas" defaultValue="">
              <option value="">Sub komunitas (opsional)</option>
              {subs.map((s) => <option key={s.name}>{s.name}</option>)}
            </NativeSelect>
            {/* Honeypot: hidden from people, filled in by bots. */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <Button type="submit" className="sm:col-span-2">Daftar</Button>
          </ActionForm>
        </CardContent>
      </Card>
    </main>
  );
}
