"use client";

import { startTransition, useActionState, useState } from "react";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { WhatsappIcon } from "@/components/bom/brand-icons";
import { MemberCard } from "@/components/bom/member-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { AGE_GROUPS, HEAR_FROM } from "@/domain/join-request";
import { MEMBERSHIP_FEE } from "@/lib/content";
import { ADMIN_WHATSAPP, ADMIN_WHATSAPP_URL, PAYMENT_ACCOUNT } from "@/lib/venue";
import { ProofUpload } from "@/components/form/proof-upload";
import { checkBladerName, registerMember } from "./actions";
import { BomIdBadge } from "@/components/bom/bom-id-badge";

type Props = { since: string; nextEvent: string | null; venue: string; whatsappInvite?: string };

const label = "text-muted-foreground mb-1 block text-xs uppercase";
const Req = () => <span className="text-destructive" aria-hidden> *</span>;

export function MembershipForm({ since, nextEvent, venue, whatsappInvite }: Props) {
  const [state, run, pending] = useActionState(registerMember, {});
  const [ageGroup, setAgeGroup] = useState("");
  const [nameTaken, setNameTaken] = useState(false);
  const [proofMissing, setProofMissing] = useState(false);

  if (state.ok && state.data) {
    return (
      <div className="space-y-4">
        <MemberCard bomId={state.data.bomId} bladerName={state.data.bladerName} since={since} />
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Welcome, {state.data.bladerName}!</CardTitle>
            <CardDescription>Your BOM ID is <BomIdBadge id={state.data.bomId} />. Save it, take a screenshot: there is no login yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>We received your payment screenshot. The committee will verify it and contact you on WhatsApp for your Emoney Membership Card.</p>
            {nextEvent && <p className="flex items-start gap-2"><CalendarDays className="text-primary size-5 shrink-0" aria-hidden />Next Ranked: {nextEvent}</p>}
            <p className="flex items-start gap-2"><MapPin className="text-primary size-5 shrink-0" aria-hidden />{venue}</p>
            {whatsappInvite && (
              <Button className="bg-[#25D366] text-black hover:bg-[#1EBE5A]" asChild>
                <a href={whatsappInvite} target="_blank" rel="noopener noreferrer"><WhatsappIcon />Join the WhatsApp group</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join BOM</CardTitle>
        <CardDescription>Get your BOM Membership Card, join the leaderboard, and battle at the next Ranked. Fields marked * are required.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* onSubmit instead of `action` so React doesn't wipe the inputs when validation fails. */}
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            if (nameTaken) return;
            if (!data.get("payment_proof")) return setProofMissing(true);
            setProofMissing(false);
            startTransition(() => run(data));
          }}
        >
          <fieldset disabled={pending} className="contents">
            <div><label className={label} htmlFor="full_name">Full name<Req /></label><Input id="full_name" name="full_name" autoComplete="name" minLength={2} maxLength={60} required /></div>
            <div><label className={label} htmlFor="blader_name">Blader name (shown publicly)<Req /></label><Input id="blader_name" name="blader_name" minLength={2} maxLength={40} required aria-invalid={nameTaken} aria-describedby="blader_name_hint"
                onChange={() => setNameTaken(false)} onBlur={async (e) => setNameTaken(!(await checkBladerName(e.target.value)).available)} />
              {nameTaken && <p id="blader_name_hint" role="alert" className="text-destructive mt-1 text-sm">This blader name is already taken. Choose another one.</p>}
            </div>
            <div><label className={label} htmlFor="whatsapp">WhatsApp number<Req /></label><Input id="whatsapp" name="whatsapp" type="tel" placeholder="08xx" autoComplete="tel" maxLength={20} required /></div>
            <div>
              <label className={label} htmlFor="age_group">Age group<Req /></label>
              <NativeSelect id="age_group" name="age_group" required defaultValue="" onChange={(e) => setAgeGroup(e.target.value)}>
                <option value="" disabled>Select</option>
                {AGE_GROUPS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </NativeSelect>
            </div>
            {ageGroup === "under12" && (
              <>
                <div><label className={label} htmlFor="guardian_name">Guardian name<Req /></label><Input id="guardian_name" name="guardian_name" maxLength={60} required /></div>
                <div><label className={label} htmlFor="guardian_whatsapp">Guardian WhatsApp<Req /></label><Input id="guardian_whatsapp" name="guardian_whatsapp" type="tel" placeholder="08xx" maxLength={20} required /></div>
              </>
            )}
            <div>
              <label className={label} htmlFor="address">Address<Req /></label>
              <Textarea id="address" name="address" rows={3} minLength={5} maxLength={300} autoComplete="street-address" required />
            </div>
            <div>
              <label className={label} htmlFor="hear_from">How did you hear about BOM (optional)</label>
              <NativeSelect id="hear_from" name="hear_from" defaultValue="">
                <option value="">-</option>
                {HEAR_FROM.map((h) => <option key={h}>{h}</option>)}
              </NativeSelect>
            </div>
            {/* Honeypot: hidden from people, filled in by bots. */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <div className="bg-muted/40 space-y-2 rounded-md border p-3 text-sm">
              <p className="font-bold">Payment: {MEMBERSHIP_FEE}, paid once</p>
              <Image src="/print/qris.jpg" alt="BOM payment QRIS" width={740} height={1043} className="mx-auto w-full max-w-xs rounded-md" />
              <p>{PAYMENT_ACCOUNT}</p>
              <p className="text-muted-foreground">
                Please contact our admin (<a href={ADMIN_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">{ADMIN_WHATSAPP}</a>) if you have any question, like wanting to choose a certain number as your ID number or to pick up the card.
              </p>
            </div>
            <div>
              <label className={label}>Upload screenshot of payment<Req /></label>
              <ProofUpload name="payment_proof" />
              {proofMissing && <p role="alert" className="text-destructive mt-1 text-sm">Upload a screenshot of your payment.</p>}
            </div>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="accepted_payment" required className="mt-1" /><span>I understand that I will have to pay the exact amount once for this membership ({PAYMENT_ACCOUNT}).<Req /></span></label>
            <label className="text-muted-foreground flex items-start gap-2 text-sm"><input type="checkbox" name="photo_consent" className="mt-1" /><span>Photos and videos of me at events may be posted (optional).</span></label>
            <Button type="submit" size="lg">{pending ? "Sending..." : "Register now"}</Button>
            <p className="text-muted-foreground text-center text-xs">{MEMBERSHIP_FEE} for the Emoney Membership Card. Takes about 30 seconds.</p>
          </fieldset>
          {state.error && <p role="alert" className="text-destructive text-sm">{state.error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
