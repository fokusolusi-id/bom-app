"use client";
import { useState } from "react";
import { ResultCard } from "@/components/bom/result-card";
import { Pagination } from "@/components/ui/pagination";
import type { LatestResult } from "@/server/latest-result";

const PAGE_SIZE = 6;

/** Every event with results, newest first, six to a page (two columns, so cards side by side line up row by row). */
export function ResultsArchive({ results }: { results: LatestResult[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = results.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const rows = Math.ceil(shown.length / 2);
  return (
    <div className="space-y-6">
      <ul
        aria-label="All results"
        className="grid gap-4 md:grid-cols-2 md:[grid-template-rows:var(--rows)]"
        style={{ "--rows": `repeat(${rows}, auto auto 1fr auto)` } as React.CSSProperties}
      >
        {shown.map((r, i) => (
          <li key={`${r.title}-${r.date}`} className="md:row-span-4 md:grid md:grid-rows-subgrid">
            <ResultCard r={r} latest={current === 0 && i === 0} />
          </li>
        ))}
      </ul>
      <Pagination label="Results pages" page={current} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} summary={`${results.length} ${results.length === 1 ? "event" : "events"}`} />
    </div>
  );
}
