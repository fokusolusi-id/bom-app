import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PointsRow, PointsTable as PointsTableData } from "@/domain/points-table";

const row = (r: PointsRow, tone = "") => (
  <TableRow key={r.label}>
    <TableCell className={`font-display font-black italic uppercase ${tone}`}>{r.label}</TableCell>
    {r.values.map((v, i) => (
      <TableCell key={i} className={`font-num tabular text-center ${v === 0 ? "text-muted-foreground" : "font-bold"}`}>{v}</TableCell>
    ))}
  </TableRow>
);

/** How tournament points are distributed by placing and by number of participants. Edited in the admin (Competition > Points). */
export function PointsTable({ table }: { table: PointsTableData }) {
  return (
    <section aria-labelledby="points-distribution" className="mt-12 space-y-3">
      <h2 id="points-distribution" className="text-2xl">How points are distributed</h2>
      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="align-bottom">Rank / Category</TableHead>
              <TableHead colSpan={table.sizes.length} className="text-primary text-center">Participant number</TableHead>
            </TableRow>
            <TableRow>
              {table.sizes.map((n, i) => <TableHead key={i} className="text-center">{n}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.ranks.map((r) => row(r, "text-primary"))}
            {table.categories.map((r) => row(r))}
          </TableBody>
        </Table>
      </div>
      {table.note && <p className="text-muted-foreground text-sm"><strong className="text-white">Note:</strong> {table.note}</p>}
    </section>
  );
}
