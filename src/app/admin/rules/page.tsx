import { AdminPage } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { PdfLinkField } from "@/components/form/pdf-link-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { RULEBOOK_SLOTS } from "@/domain/rules-page";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSettings } from "@/server/settings";
import { prepareRulebookUpload, saveRulesPage } from "./actions";

export const metadata = { title: "Rules | Admin BOM" };

const label = "text-muted-foreground flex flex-col gap-1 text-xs";

export default async function AdminRulesPage() {
  const page = await supabaseSettings(await requireAdmin()).rulesPage();
  return (
    <AdminPage title="Rules" hint="The text and rulebook downloads on the public Rules page. The three shared principles under the intro are fixed.">
      <ActionForm action={saveRulesPage} className="space-y-10">
        <Textarea name="intro" defaultValue={page.intro} maxLength={300} rows={2} className="text-base text-white" placeholder="Intro under the title" aria-label="Intro under the title" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: RULEBOOK_SLOTS }, (_, i) => {
            const r = page.rulebooks[i];
            return (
              <Card key={i}>
                <CardHeader><CardTitle className="text-base">Rulebook {i + 1}{!r && <span className="text-muted-foreground ml-2 text-sm">(empty)</span>}</CardTitle></CardHeader>
                <CardContent className="grid gap-3">
                  <Input name={`rb_title_${i}`} defaultValue={r?.title ?? ""} maxLength={80} className="text-base text-white" placeholder="Title" aria-label="Title" />
                  <Input name={`rb_note_${i}`} defaultValue={r?.note ?? ""} maxLength={80} className="text-base text-white" placeholder="Edition or note" aria-label="Edition or note" />
                  <div className={label}>PDF link or upload<PdfLinkField name={`rb_href_${i}`} defaultValue={r?.href ?? ""} prepare={prepareRulebookUpload} /></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Textarea name="summary" defaultValue={page.summary} maxLength={1500} rows={6} className="text-base text-white" placeholder="Summary under the rulebooks (leave a blank line between paragraphs)" aria-label="Summary under the rulebooks (leave a blank line between paragraphs)" />
        <Button type="submit">Save rules page</Button>
      </ActionForm>
    </AdminPage>
  );
}
