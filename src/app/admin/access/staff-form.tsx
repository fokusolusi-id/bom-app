"use client";
import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { addStaff } from "./actions";

const label = "text-muted-foreground flex flex-col gap-1 text-xs uppercase";

/** Give someone access: a login (email and password) and a role. Organizers manage one sub community. */
export function StaffForm({ communities }: { communities: { id: string; name: string }[] }) {
  const [role, setRole] = useState("organizer");
  return (
    <ActionForm action={addStaff} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
      <label className={label}>Email<Input name="email" type="email" autoComplete="off" maxLength={120} required className="text-base text-white" /></label>
      <label className={label}>Password (10 characters or more)<Input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required className="text-base text-white" /></label>
      <label className={label}>Role
        <NativeSelect name="role" value={role} onChange={(e) => setRole(e.target.value)} className="text-base text-white">
          <option value="organizer">Organizer (schedule and results of one sub community)</option>
          <option value="admin">Admin (everything)</option>
        </NativeSelect>
      </label>
      {role === "organizer" && (
        <label className={label}>Sub community
          <NativeSelect name="sub_community_id" defaultValue="" required className="text-base text-white">
            <option value="" disabled>Choose</option>
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </NativeSelect>
        </label>
      )}
      <Button type="submit" className="sm:col-span-2">Give access</Button>
    </ActionForm>
  );
}
