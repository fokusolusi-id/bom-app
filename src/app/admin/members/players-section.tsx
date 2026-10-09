import { AdminSection, ItemGrid } from "@/components/admin/admin-page";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { AGE_GROUPS, type JoinRequest } from "@/domain/join-request";
import { sortPlayers } from "@/domain/leaderboard";
import type { Player } from "@/domain/types";
import { requireAdmin } from "@/server/admin-session";
import { supabaseJoinRequests } from "@/server/join-requests";
import { supabasePlayers } from "@/server/players";
import { savePlayer } from "../players/actions";

const ageLabel = new Map<string, string>(AGE_GROUPS);
const wa = (n: string) => `https://wa.me/${n.slice(1)}`;
const joined = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

/** Everything the membership form collected, read-only. Players added by an admin have no sign-up. */
function SignupDetails({ r }: { r?: JoinRequest }) {
  if (!r) return <p className="text-muted-foreground text-sm">No sign-up on record (added by an admin).</p>;
  const rows: [string, React.ReactNode][] = [
    ["Full name", r.name],
    ["WhatsApp", <a key="wa" href={wa(r.whatsapp)} target="_blank" rel="noreferrer" className="hover:text-primary underline">{r.whatsapp}</a>],
    ["Age group", r.age_group ? ageLabel.get(r.age_group) ?? r.age_group : "-"],
    ...(r.guardian_name ? ([["Guardian", <>{r.guardian_name}{r.guardian_whatsapp && <> · <a href={wa(r.guardian_whatsapp)} target="_blank" rel="noreferrer" className="hover:text-primary underline">{r.guardian_whatsapp}</a></>}</>]] as [string, React.ReactNode][]) : []),
    ["Address", r.address ?? "-"],
    ["Heard about BOM from", r.hear_from ?? "-"],
    ["Photo and video consent", r.photo_consent ? "Yes" : "No"],
    ["Payment proof", r.payment_proof_url ? <a key="pp" href={r.payment_proof_url} target="_blank" rel="noreferrer" className="text-primary underline">View screenshot</a> : "-"],
    ["Signed up", joined.format(new Date(r.created_at))],
  ];
  return (
    <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1 text-sm">
      {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></div>)}
    </dl>
  );
}

const field = "flex flex-col gap-1 text-xs text-muted-foreground";

function PlayerForm({ p }: { p: Player }) {
  return (
    <ActionForm action={savePlayer} className="grid grid-cols-3 gap-3">
      <input type="hidden" name="id" value={p.id} />
      <label className={`${field} col-span-2`}>Blader name<Input name="name" defaultValue={p.name} maxLength={40} required className="text-base text-white" /></label>
      <label className={field}>BOM ID<Input name="bom_id" defaultValue={p.bom_id} maxLength={20} required className="text-base text-white" /></label>
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
  const supabase = await requireAdmin();
  const [list, signups] = await Promise.all([supabasePlayers(supabase).list(1000, { includeRegistered: true }), supabaseJoinRequests(supabase).listRecent(1000)]);
  const players = sortPlayers(list, "bom_id", "asc");
  const signupOf = new Map(signups.flatMap((r) => (r.player ? [[r.player.id, r] as const] : [])));
  return (
    <AdminSection id="players" title="Players" hint="Each card shows what the player entered on the membership form (read-only) and lets you edit their name, BOM ID and status. Points are calculated from results. Changing a BOM ID changes the member's page address.">
      <ItemGrid>
        {players.map((p) => (
          <Card key={p.id}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base">{p.name}<BomIdBadge id={p.bom_id} />{p.status === "registered" && <span className="text-muted-foreground text-sm">(registered)</span>}</CardTitle></CardHeader>
            <CardContent className="space-y-4"><SignupDetails r={signupOf.get(p.id!)} /><PlayerForm p={p} /></CardContent>
          </Card>
        ))}
      </ItemGrid>
    </AdminSection>
  );
}
