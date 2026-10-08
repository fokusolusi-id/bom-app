import { Mail } from "lucide-react";
import Image from "next/image";
import { INSTAGRAM, PARTNER_EMAIL } from "@/lib/venue";
import { InstagramIcon } from "./brand-icons";

export function SiteFooter() {
  return (
    <footer className="border-border mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/brand/logo-768.png" alt="BOM Beyblade of Medan" width={48} height={48} />
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>© {new Date().getFullYear()} Beyblade of Medan. All rights reserved.</p>
              <p>Fan community. Not affiliated with Takara Tomy &amp; Hasbro.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href={`mailto:${PARTNER_EMAIL}`} className="hover:text-primary flex items-center gap-2 text-sm text-white">
              <Mail className="size-5 shrink-0" aria-hidden />
              {PARTNER_EMAIL}
            </a>
            <a href={`https://www.instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-2 text-sm text-white">
              <InstagramIcon />
              @{INSTAGRAM}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
