import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionForm } from "@/components/form/action-form";
import { PlayerPicker, type PickerPlayer } from "@/components/form/player-picker";
import { MAX_ROLE_MEMBERS, type TeamRole } from "@/domain/team";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseTeam } from "@/server/team";
import { deleteTeamRole, prepareMemberPhotoUpload, saveTeamRole } from "../tim/actions";
import { AddCard, AdminSection, ItemGrid } from "@/components/admin/admin-page";

function RoleForm({ role, players }: { role?: TeamRole; players: PickerPlayer[] }) {
  return (
    <ActionForm action={saveTeamRole} resetOnSuccess={!role} className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      {role?.id && <input type="hidden" name="id" value={role.id} />}
      <Input name="title" defaultValue={role?.title} placeholder="Role title (English)" aria-label="Role title" maxLength={60} required />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={role?.sort_order ?? 0} aria-label="Order" />
      <div className="sm:col-span-2">
        <PlayerPicker name="player_id" players={players} defaultIds={role?.members.map((m) => m.playerId)} max={MAX_ROLE_MEMBERS} preparePhoto={prepareMemberPhotoUpload} />
      </div>
      <Button type="submit" className="sm:col-span-2">{role ? "Save" : "Add role"}</Button>
    </ActionForm>
  );
}

export async function TeamSection() {
  const supabase = await requireAdmin();
  const [roles, all] = await Promise.all([supabaseTeam(supabase).list(), supabasePlayers(supabase).list(1000, { includeRegistered: true })]);
  const players: PickerPlayer[] = all.filter((p) => p.id).map((p) => ({ id: p.id!, name: p.name, bomId: p.bom_id, photo: p.photo_path ?? null }));
  return (
    <AdminSection id="team" title="Founding Team" hint="Pick members from existing players; each member's photo is set right under their name. The order matches the About page.">
      <AddCard title="New role"><RoleForm players={players} /></AddCard>
      <ItemGrid>
      {roles.map((r) => (
        <Card key={r.id}>
          <CardHeader><CardTitle>{r.title}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <RoleForm role={r} players={players} />
            <ActionForm action={deleteTeamRole.bind(null, r.id!)}><Button variant="destructive" size="sm">Delete</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
      </ItemGrid>
    </AdminSection>
  );
}
