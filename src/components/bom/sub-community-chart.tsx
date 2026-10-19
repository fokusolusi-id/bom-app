import Image from "next/image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubCommunity } from "@/domain/sub-community";
import { mediaUrl } from "@/lib/media";
import { InstagramIcon } from "./brand-icons";

/**
 * Org chart: BOM on top, a trunk down to a bar that branches to each sub community.
 * Below xl (1280px) the branches stack into a single vertical chain.
 */
export function SubCommunityChart({ subs }: { subs: SubCommunity[] }) {
  return (
    <div aria-label="Community structure">
      <div className="flex flex-col items-center">
        <Image src="/brand/logo-768.png" alt="BOM" width={160} height={160} />
        <div aria-hidden className="bg-primary h-8 w-0.5" />
      </div>
      <ul className="mx-auto flex max-w-sm flex-col xl:max-w-none xl:flex-row">
        {subs.map((s) => (
          <li
            key={s.id ?? s.name}
            className="before:bg-primary xl:after:bg-primary relative flex-1 pt-8 before:absolute before:top-0 before:left-1/2 before:h-8 before:w-0.5 before:-translate-x-1/2 xl:px-2 xl:after:absolute xl:after:inset-x-0 xl:after:top-0 xl:after:h-0.5 xl:first:after:left-1/2 xl:last:after:right-1/2"
          >
            <Card className="h-full items-center text-center">
              {s.image_path && <Image src={mediaUrl(s.image_path)} alt={s.name} width={320} height={320} className="size-32 shrink-0 rounded-md object-contain xl:size-28" />}
              <CardHeader className="items-center">
                <CardTitle className="normal-case">{s.name}</CardTitle>
                {s.focus && <p className="text-sm">{s.focus}</p>}
                {s.instagram && (
                  <a href={`https://www.instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary mt-1 inline-flex items-center gap-1.5 text-sm">
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
