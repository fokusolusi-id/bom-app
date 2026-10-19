import Link from "next/link";
import { InstagramIcon, TiktokIcon, WhatsappIcon } from "@/components/bom/brand-icons";
import { SectionHeading } from "@/components/bom/section-heading";
import { Button } from "@/components/ui/button";
import { INSTAGRAM, PARTNER_EMAIL, TIKTOK, WHATSAPP_INVITE } from "@/lib/venue";

/** How to get started: membership, the WhatsApp group, Instagram, TikTok and the partnership email. Shared by About BOM and Schedule. */
export function JoinUs({ className }: { className?: string }) {
  return (
      <section aria-labelledby="join" className={className}>
      <SectionHeading id="join">Join us</SectionHeading>
      <p className="max-w-xl">New to this? Just come to a weekly Ranked session. Bring your bey and we&apos;ll help with the rest.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button size="lg" asChild><Link href="/membership">Join Membership</Link></Button>
        {WHATSAPP_INVITE && (
          <Button size="lg" className="bg-[#25D366] text-black hover:bg-[#1EBE5A]" asChild>
            <a href={WHATSAPP_INVITE} target="_blank" rel="noopener noreferrer"><WhatsappIcon />WhatsApp</a>
          </Button>
        )}
        <Button size="lg" variant="outline" asChild>
          <a href={`https://www.instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer"><InstagramIcon />Instagram</a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href={`https://www.tiktok.com/@${TIKTOK}`} target="_blank" rel="noopener noreferrer"><TiktokIcon />TikTok</a>
        </Button>
      </div>
      <p className="text-muted-foreground mt-4 text-sm">Sponsors and partnerships: <a href={`mailto:${PARTNER_EMAIL}`} className="hover:text-primary text-white">{PARTNER_EMAIL}</a></p>
    </section>
  );
}
