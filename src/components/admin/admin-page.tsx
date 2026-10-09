import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Shared frame of every admin page: title, one-line hint, then the page's blocks. */
export function AdminPage({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">{title}</h1>
        {hint && <p className="text-muted-foreground mt-1 text-sm">{hint}</p>}
      </header>
      {children}
    </div>
  );
}

/** Full-width card with the "add new" form. */
export function AddCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Existing items, two columns from the md breakpoint. */
export function ItemGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid items-start gap-4 md:grid-cols-2">{children}</div>;
}

/** One part of a combined admin page. `id` is the anchor the side menu jumps to. */
export function AdminSection({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-6" aria-labelledby={`${id}-title`}>
      <div>
        <h2 id={`${id}-title`} className="text-2xl">{title}</h2>
        {hint && <p className="text-muted-foreground mt-1 text-sm">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** A combined admin page: a title, a side menu that jumps to each section, and the sections themselves. */
export function AdminSectionsPage({ title, hint, sections, children }: { title: string; hint?: string; sections: readonly (readonly [id: string, label: string])[]; children: React.ReactNode }) {
  return (
    <AdminPage title={title} hint={hint}>
      <div className="grid gap-8 md:grid-cols-[11rem_1fr]">
        <nav aria-label={`${title} sections`} className="md:sticky md:top-20 md:self-start">
          <ul className="font-display flex flex-wrap gap-4 text-sm font-bold italic uppercase md:flex-col md:gap-1">
            {sections.map(([id, label]) => <li key={id}><a href={`#${id}`} className="hover:text-primary block py-1">{label}</a></li>)}
          </ul>
        </nav>
        <div className="min-w-0 space-y-14">{children}</div>
      </div>
    </AdminPage>
  );
}
