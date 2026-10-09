import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionForm } from "@/components/form/action-form";
import { ImageUpload } from "@/components/form/image-upload";
import { formatBomId } from "@/domain/profile";
import { PlayerPicker, type PickerPlayer } from "@/components/form/player-picker";
import { MAX_ROLE_MEMBERS, type TeamRole } from "@/domain/team";
import { requireAdmin } from "@/server/admin-session";
import { supabasePlayers } from "@/server/players";
import { supabaseTeam } from "@/server/team";
import { deleteTeamRole, prepareMemberPhotoUpload, saveMemberPhoto, saveTeamRole } from "./actions";

export const metadata = { title: "Founding Team | Admin BOM" };

function RoleForm({ role, players }: { role?: TeamRole; players: PickerPlayer[] }) {
  return (
    <ActionForm action={saveTeamRole} resetOnSuccess={!role} className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      {role?.id && <input type="hidden" name="id" value={role.id} />}
      <Input name="title" defaultValue={role?.title} placeholder="Role title (English)" aria-label="Role title" maxLength={60} required />
      <Input name="sort_order" type="number" min={0} max={999} defaultValue={role?.sort_order ?? 0} aria-label="Urutan" />
      <div className="sm:col-span-2">
        <PlayerPicker name="player_id" players={players} defaultIds={role?.members.map((m) => m.playerId)} max={MAX_ROLE_MEMBERS} />
      </div>
      <Button type="submit" className="sm:col-span-2">{role ? "Simpan" : "Tambah peran"}</Button>
    </ActionForm>
  );
}

export default async function AdminTeamPage() {
  const supabase = await requireAdmin();
  const [roles, all] = await Promise.all([supabaseTeam(supabase).list(), supabasePlayers(supabase).list(1000, { includeRegistered: true })]);
  const players: PickerPlayer[] = all.filter((p) => p.id).map((p) => ({ id: p.id!, name: p.name, bomId: p.bom_id }));
  const members = [...new Map(roles.flatMap((r) => r.members).map((m) => [m.playerId, m])).values()];
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Members are picked from existing players. Order here is the order shown on About BOM.</p>
      <Card>
        <CardHeader><CardTitle>New role</CardTitle></CardHeader>
        <CardContent><RoleForm players={players} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Member photos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {members.length === 0 && <p className="text-muted-foreground text-sm">Add members to a role first.</p>}
          {members.map((m) => (
            <ActionForm key={m.playerId} action={saveMemberPhoto} className="border-b pb-4 last:border-0 last:pb-0">
              <input type="hidden" name="player_id" value={m.playerId} />
              <p className="col-span-full font-bold">{m.name} <span className="text-muted-foreground font-normal">{formatBomId(m.bomId)}</span></p>
              <ImageUpload name="photo_path" label={`Foto ${m.name}`} defaultPath={m.photo} prepare={prepareMemberPhotoUpload} />
              <Button type="submit" size="sm" className="mt-2">Simpan foto</Button>
            </ActionForm>
          ))}
        </CardContent>
      </Card>
      {roles.map((r) => (
        <Card key={r.id}>
          <CardHeader><CardTitle>{r.title}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <RoleForm role={r} players={players} />
            <ActionForm action={deleteTeamRole.bind(null, r.id!)}><Button variant="destructive" size="sm">Hapus</Button></ActionForm>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
