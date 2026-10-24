import Image from "next/image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubCommunity } from "@/domain/sub-community";
import { mediaUrl } from "@/lib/media";
import { InstagramIcon } from "./brand-icons";

/**
 * Org chart: BOM on top, a trunk down to a bar that branches to each sub community.
 * Below lg (1024px) the branches stack into a single vertical chain; from 1024px the cards sit in one row and shrink to fit.
 */
export function SubCommunityChart({ subs }: { subs: SubCommunity[] }) {
  return (
    <div aria-label="Community structure">
      <div className="flex flex-col items-center">
        <Image src="/brand/logo-768.png" alt="Beyblade of Medan" width={160} height={160} />
        <div aria-hidden className="bg-primary h-8 w-0.5" />
      </div>
      <ul className="mx-auto flex max-w-sm flex-col lg:max-w-none lg:flex-row">
        {subs.map((s) => (
          <li
            key={s.id ?? s.name}
            className="before:bg-primary lg:after:bg-primary relative min-w-0 flex-1 pt-8 before:absolute before:top-0 before:left-1/2 before:h-8 before:w-0.5 before:-translate-x-1/2 lg:px-1 xl:px-2 lg:after:absolute lg:after:inset-x-0 lg:after:top-0 lg:after:h-0.5 lg:first:after:left-1/2 lg:last:after:right-1/2"
          >
            <Card className="h-full min-w-0 items-center text-center lg:gap-3 lg:p-3 xl:gap-4 xl:p-5">
              {s.image_path && <Image src={mediaUrl(s.image_path)} alt={s.name} width={320} height={320} className="size-32 shrink-0 rounded-md object-contain lg:size-16 xl:size-24" />}
              <CardHeader className="min-w-0 items-center lg:px-0">
                <CardTitle className="normal-case lg:text-sm xl:text-base">{s.name}</CardTitle>
                {s.focus && <p className="text-sm lg:text-xs xl:text-sm">{s.focus}</p>}
                {s.instagram && (
                  <a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary mt-1 inline-flex max-w-full items-center gap-1.5 text-sm break-all lg:text-xs xl:text-sm">
                    <InstagramIcon className="size-4" />@{s.instagram}
                  </a>
                )}
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
