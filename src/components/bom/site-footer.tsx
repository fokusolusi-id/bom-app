import { InstagramIcon } from "./brand-icons";

export function SiteFooter() {
  return (
    <footer className="border-border mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-display text-primary text-xl font-extrabold italic uppercase">Built in Medan. Battle anywhere.</div>
            <div className="text-muted-foreground mt-1 text-sm">Play • Compete • Rank • Grow • Belong</div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <a
              href="https://www.instagram.com/beybladeofmedan"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary flex items-center gap-2 text-sm text-white"
            >
              <InstagramIcon />
              @beybladeofmedan
            </a>
            <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} Beyblade of Medan. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
