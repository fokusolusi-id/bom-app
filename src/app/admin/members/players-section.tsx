import { AdminSection, ItemGrid } from "@/components/admin/admin-page";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { sortPlayers } from "@/domain/leaderboard";
import type { Player } from "@/domain/types";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { savePlayer } from "../players/actions";

const field = "flex flex-col gap-1 text-xs text-muted-foreground";

function PlayerForm({ p }: { p: Player }) {
  return (
    <ActionForm action={savePlayer} className="grid grid-cols-3 gap-3">
      <input type="hidden" name="id" value={p.id} />
      <label className={`${field} col-span-2`}>Blader name<Input name="name" defaultValue={p.name} maxLength={40} required className="text-base text-white" /></label>
      <label className={field}>BOM ID<Input name="bom_id" defaultValue={p.bom_id} maxLength={20} required className="text-base text-white" /></label>
      <label className={field}>Points<Input name="points" type="number" min={0} defaultValue={p.points} required className="text-base text-white" /></label>
      <label className={field}>Wins<Input name="wins" type="number" min={0} defaultValue={p.wins} required className="text-base text-white" /></label>
      <label className={field}>Losses<Input name="losses" type="number" min={0} defaultValue={p.losses} required className="text-base text-white" /></label>
      <label className={`${field} col-span-2`}>Status
        <NativeSelect name="status" defaultValue={p.status ?? "active"} className="text-base text-white">
          <option value="active">Active (on the leaderboard)</option>
          <option value="registered">Registered (not yet active)</option>
        </NativeSelect>
      </label>
      <Button type="submit" className="self-end">Save</Button>
    </ActionForm>
  );
}

export async function PlayersSection() {
  const players = sortPlayers(await supabasePlayers(await requireAdmin()).list(1000, { includeRegistered: true }), "bom_id", "asc");
  return (
    <AdminSection id="players" title="Players" hint="Edit any player: name, BOM ID, record and status. Changing a BOM ID changes the member's page address.">
      <ItemGrid>
        {players.map((p) => (
          <Card key={p.id}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base">{p.name}<BomIdBadge id={p.bom_id} />{p.status === "registered" && <span className="text-muted-foreground text-sm">(registered)</span>}</CardTitle></CardHeader>
            <CardContent><PlayerForm p={p} /></CardContent>
          </Card>
        ))}
      </ItemGrid>
    </AdminSection>
  );
}
