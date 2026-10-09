import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { POINTS_BY_CATEGORY, POINTS_BY_RANK, POINTS_NOTE, POINTS_SIZES } from "@/lib/content";

const row = (label: string, values: readonly number[], tone = "") => (
  <TableRow key={label}>
    <TableCell className={`font-display font-black italic uppercase ${tone}`}>{label}</TableCell>
    {values.map((v, i) => (
      <TableCell key={POINTS_SIZES[i]} className={`font-num tabular text-center ${v === 0 ? "text-muted-foreground" : "font-bold"}`}>{v}</TableCell>
    ))}
  </TableRow>
);

/** How tournament points are distributed by placing and by number of participants. */
export function PointsTable() {
  return (
    <section aria-labelledby="points-distribution" className="mt-12 space-y-3">
      <h2 id="points-distribution" className="text-2xl">How points are distributed</h2>
      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="align-bottom">Rank / Category</TableHead>
              <TableHead colSpan={POINTS_SIZES.length} className="text-primary text-center">Participant number</TableHead>
            </TableRow>
            <TableRow>
              {POINTS_SIZES.map((n) => <TableHead key={n} className="text-center">{n}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {POINTS_BY_RANK.map((r) => row(r.label, r.values, "text-primary"))}
            {POINTS_BY_CATEGORY.map((r) => row(r.label, r.values))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground text-sm"><strong className="text-white">Note:</strong> {POINTS_NOTE}</p>
    </section>
  );
}
