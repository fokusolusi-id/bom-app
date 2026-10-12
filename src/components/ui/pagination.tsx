"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The page numbers to show: all of them up to 9 pages, else the first, the last and the ones around the current page, with gaps as null. */
export function pageNumbers(pages: number, current: number): (number | null)[] {
  if (pages <= 9) return Array.from({ length: pages }, (_, i) => i);
  const wanted = new Set([0, 1, pages - 2, pages - 1, current - 1, current, current + 1].filter((n) => n >= 0 && n < pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]));
}

/** Previous and Next on the sides, every page number in the middle (each one a button). `page` is 0-based. */
export function Pagination({ label, page, pages, onChange, summary, className }: {
  label: string; page: number; pages: number; onChange: (page: number) => void; summary?: string; className?: string;
}) {
  if (pages <= 1 && !summary) return null;
  return (
    <nav aria-label={label} className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft aria-hidden /><span className="hidden sm:inline">Previous</span></Button>
        <ul className="flex flex-wrap items-center justify-center gap-1">
          {pageNumbers(pages, page).map((n, i) => (
            <li key={n ?? `gap-${i}`}>
              {n === null ? <span className="text-muted-foreground px-1" aria-hidden>…</span> : (
                <Button
                  type="button" size="sm" variant={n === page ? "default" : "outline"} className="font-num min-w-8 px-2" aria-label={`Page ${n + 1}`} aria-current={n === page ? "page" : undefined}
                  onClick={() => onChange(n)}
                >{n + 1}</Button>
              )}
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" size="sm" disabled={page === pages - 1} onClick={() => onChange(page + 1)}><span className="hidden sm:inline">Next</span><ChevronRight aria-hidden /></Button>
      </div>
      {summary && <p className="text-muted-foreground text-center text-sm">{summary}</p>}
    </nav>
  );
}
