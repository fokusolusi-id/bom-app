"use client";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import type { ResultEvent } from "./results-browser";
import { PlacementRow } from "./placement-row";

const PARTICIPANTS_PER_PAGE = 8;

/** The participants of one event, 8 per page. Starts on page 1 for each event (the caller keys it by event). */
export function Participants({ eventId, rows }: { eventId: string; rows: ResultEvent["rows"] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PARTICIPANTS_PER_PAGE));
  // Deleting the last member on a page moves back to the page before.
  const current = Math.min(page, pages - 1);
  const shownRows = rows.slice(current * PARTICIPANTS_PER_PAGE, (current + 1) * PARTICIPANTS_PER_PAGE);
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">{rows.length} participants</p>
      <ul className="space-y-2 text-sm">
        {shownRows.map((pl) => (
          <PlacementRow key={pl.id} eventId={eventId} rowId={pl.id} playerId={pl.playerId} name={pl.name} bomId={pl.bomId} place={pl.place} tigerKing={pl.tigerKing} combos={pl.combos} points={pl.points} />
        ))}
      </ul>
      <Pagination label="Participants pages" page={current} pages={pages} onChange={setPage} />
    </div>
  );
}
