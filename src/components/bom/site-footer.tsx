import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstagramIcon, WhatsappIcon } from "./brand-icons";

// Invite links get reset when they leak, so the WhatsApp one lives in env, not code.
const whatsappInvite = process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL;

const links: { href: string; label: string; icon: ReactNode }[] = [
  { href: "mailto:admin@beybladeofmedan.com", label: "admin@beybladeofmedan.com", icon: <Mail className="size-5" aria-hidden /> },
  { href: "https://www.instagram.com/beybladeofmedan", label: "@beybladeofmedan", icon: <InstagramIcon /> },
];

export function SiteFooter() {
  return (
    <footer className="border-border mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center">
        <div className="font-display text-primary text-xl font-extrabold italic uppercase">Built in Medan. Battle anywhere.</div>
        <div className="text-muted-foreground mt-1 text-sm">Play • Compete • Rank • Grow • Belong</div>
        {whatsappInvite && (
          <Button size="lg" className="mt-6 bg-[#25D366] text-white hover:bg-[#1EBE5A]" asChild>
            <a href={whatsappInvite} target="_blank" rel="noopener noreferrer">
              <WhatsappIcon />
              Gabung Grup WhatsApp
            </a>
          </Button>
        )}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          {links.map(({ href, label, icon }) => (
            <li key={href}>
              <a
                href={href}
                {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                className="hover:text-primary flex items-center gap-2 text-white"
              >
                {icon}
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
