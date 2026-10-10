import { PointsMultipliers } from "@/components/bom/points-multipliers";
import { AdminSection } from "@/components/admin/admin-page";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { PointsRow } from "@/domain/points-table";
import { requireAdmin } from "@/server/admin-session";
import { supabaseSettings } from "@/server/settings";
import { savePointsTable } from "./actions";

const cell = "px-1 py-1";
const input = "text-center text-base text-white";

function Rows({ prefix, rows, columns }: { prefix: "rank" | "cat"; rows: PointsRow[]; columns: number }) {
  return rows.map((r, i) => (
    <tr key={`${prefix}${i}`}>
      <td className={cell}><Input name={`${prefix}_label_${i}`} defaultValue={r.label} maxLength={30} required aria-label="Row label" className="min-w-28 text-base text-white" /></td>
      {Array.from({ length: columns }, (_, j) => (
        <td key={j} className={cell}><Input name={`${prefix}_${i}_${j}`} type="number" step="any" min={0} defaultValue={r.values[j]} required aria-label={`${r.label}, column ${j + 1}`} className={`${input} min-w-20`} /></td>
      ))}
    </tr>
  ));
}

/** The "How points are distributed" table on the leaderboard: edit headings, row labels, every number and the note. */
export async function PointsSection() {
  const table = await supabaseSettings(await requireAdmin()).pointsTable();
  return (
    <AdminSection id="points" title="Points" hint="The table under the leaderboard. Edit the participant-number headings, the row names, any value (decimals allowed) and the note.">
      <ActionForm action={savePointsTable} className="space-y-4">
        <input type="hidden" name="sizes" value={table.sizes.length} />
        <input type="hidden" name="ranks" value={table.ranks.length} />
        <input type="hidden" name="cats" value={table.categories.length} />
        <div className="bg-card overflow-x-auto rounded-lg border p-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={`${cell} text-muted-foreground text-left text-xs uppercase`}>Rank / Category</th>
                {table.sizes.map((s, j) => (
                  <th key={j} className={cell}><Input name={`size_${j}`} defaultValue={s} maxLength={12} required aria-label={`Column ${j + 1} heading`} className={`${input} text-primary min-w-20 font-bold`} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Rows prefix="rank" rows={table.ranks} columns={table.sizes.length} />
              <Rows prefix="cat" rows={table.categories} columns={table.sizes.length} />
            </tbody>
          </table>
        </div>
        <Textarea name="note" defaultValue={table.note} maxLength={200} rows={2} className="text-base text-white" placeholder="Note under the table" aria-label="Note under the table" />
        <Button type="submit">Save points table</Button>
      </ActionForm>
      <PointsMultipliers className="mt-8" />
    </AdminSection>
  );
}
