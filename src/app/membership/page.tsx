import { Check } from "lucide-react";
import Image from "next/image";
import { RibbonBanner } from "@/components/bom/ribbon-banner";
import { SectionHeading } from "@/components/bom/section-heading";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWhen } from "@/domain/next-event";
import { faq, MEMBERSHIP_FEE, memberBenefits, registrationSteps } from "@/lib/content";
import { VENUE, WHATSAPP_INVITE } from "@/lib/venue";
import { loadUpcomingEvents } from "@/server/events";
import { publicSubCommunities } from "@/server/sub-communities";
import { MembershipForm } from "./membership-form";

export const metadata = { title: "Membership | BOM" };
export const revalidate = 60;

const sinceFmt = new Intl.DateTimeFormat("en-GB", { month: "2-digit", year: "numeric", timeZone: "Asia/Jakarta" });

export default async function MembershipPage() {
  const subs = await publicSubCommunities().listActive();
  const [next] = await loadUpcomingEvents(subs, 1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 md:grid-cols-[1fr_26rem] md:items-start">
        {/* On mobile the form comes first: most visitors arrive from a WhatsApp or Instagram link. */}
        <div className="order-first md:order-last md:sticky md:top-6">
          <MembershipForm since={sinceFmt.format(new Date()).replace("/", ".")} nextEvent={next ? formatWhen(next) : null} venue={VENUE} whatsappInvite={WHATSAPP_INVITE} />
        </div>

        <div className="space-y-12">
          <section>
            <RibbonBanner>Membership Registration</RibbonBanner>
            <h1 className="mt-6 text-4xl leading-none md:text-6xl">Official Membership Card <span className="text-primary">Beyblade of Medan</span></h1>
            <div className="text-muted-foreground mt-6 max-w-xl space-y-4">
              <p>We are excited to announce that registration for the BOM Community membership is now open!</p>
              <p>With only <strong className="text-foreground">{MEMBERSHIP_FEE}</strong> (for Emoney card) you&apos;ll receive a Membership Card that comes with amazing benefits:</p>
            </div>
            <ul className="mt-4 max-w-xl space-y-2">
              {memberBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2"><Check className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />{b}</li>
              ))}
            </ul>
            <p className="mt-4 max-w-xl">Don&apos;t miss out on these exclusive perks—join us now and elevate your Beyblade experience with us!</p>
            <Image src="/print/bom-emoney-03.png" alt="BOM Emoney Membership Card" width={1028} height={650} className="mt-6 w-full max-w-md rounded-xl" />
          </section>

          <section aria-labelledby="how">
            <SectionHeading id="how">How it works</SectionHeading>
            <ol className="grid gap-4 sm:grid-cols-3">
              {registrationSteps.map(([t, d], i) => (
                <li key={t}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="font-display text-primary text-3xl font-black italic">{i + 1}</div>
                      <CardTitle>{t}</CardTitle>
                      <CardDescription>{d}</CardDescription>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="faq">
            <SectionHeading id="faq">FAQ</SectionHeading>
            <div className="space-y-2">
              {faq.map(([q, a]) => (
                <details key={q} className="bg-card rounded-lg border px-4 py-3">
                  <summary className="cursor-pointer font-bold">{q}</summary>
                  <p className="text-muted-foreground mt-2 text-sm">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="privacy" aria-labelledby="privacy-title">
            <SectionHeading id="privacy-title">Privacy notice</SectionHeading>
            <p className="text-muted-foreground max-w-xl text-sm">
              Your blader name, BOM ID and match results are public on the leaderboard and your profile. Your full name, WhatsApp number and guardian details are only seen by the BOM committee. Photos and videos are only posted with your consent.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
