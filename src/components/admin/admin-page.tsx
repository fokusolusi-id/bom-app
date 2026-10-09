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
