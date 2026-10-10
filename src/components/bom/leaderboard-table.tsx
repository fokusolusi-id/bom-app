"use client";

import { ArrowDown, ArrowUp, Crown, Sparkles, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BomIdBadge } from "@/components/bom/bom-id-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ranks, searchPlayers, sortPlayers, type SortDir, type SortKey } from "@/domain/leaderboard";
import { formatBomId } from "@/domain/profile";
import type { Player } from "@/domain/types";

type Row = Pick<Player, "bom_id" | "name" | "points"> & { week: number; previous: number | null; change: number; trophies: number; move: "up" | "down" | "new" | null };

export const PAGE_SIZE = 25;

/** Leaderboard with search (name or BOM ID), sorting by points (default, highest first), blader name or BOM ID, and pages of 25. */
export function LeaderboardTable({ players }: { players: Row[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "points", dir: "desc" });
  const rank = useMemo(() => ranks(players), [players]);
  const matches = useMemo(() => sortPlayers(searchPlayers(players, query), sort.key, sort.dir), [players, query, sort]);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = matches.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggle = (key: SortKey) => {
    setPage(0);
    setSort((cur) => (cur.key === key ? { key, dir: cur.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "points" ? "desc" : "asc" }));
  };

  const header = (key: SortKey, label: string, className = "") => {
    const active = sort.key === key;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
        <button type="button" onClick={() => toggle(key)} className={`inline-flex items-center gap-1 uppercase ${active ? "text-primary" : "hover:text-primary"}`}>
          {label}<Icon className="size-3.5" aria-hidden />
        </button>
      </TableHead>
    );
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="relative ml-auto max-w-md">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <Input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search blader name or BOM ID" aria-label="Search by blader name or BOM ID" className="pl-9" />
      </div>
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              {header("bom_id", "BOM ID", "w-px whitespace-nowrap pr-1")}
              {header("name", "Blader", "pl-1")}
              <TableHead className="whitespace-nowrap">Trophy</TableHead>
              {header("points", "Total Points", "text-right whitespace-nowrap")}
              <TableHead className="text-right whitespace-nowrap">Points This Week</TableHead>
              <TableHead className="text-right whitespace-nowrap">Rank Last Week</TableHead>
              <TableHead className="whitespace-nowrap">Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.bom_id}>
                <TableCell className="font-num tabular text-primary text-2xl font-black italic">{rank.get(p.bom_id)}</TableCell>
                <TableCell className="w-px pr-1 whitespace-nowrap">
                  <Link href={`/member/${p.bom_id.toLowerCase()}`} aria-label={`Profile ${p.name} ${formatBomId(p.bom_id)}`}>
                    <BomIdBadge id={p.bom_id} className="transition-colors hover:bg-white" />
                  </Link>
                </TableCell>
                <TableCell className="pl-1 font-bold">{p.name}</TableCell>
                <TableCell>
                  {p.trophies > 0
                    ? <span className="inline-flex gap-0.5 text-yellow-400" role="img" aria-label={`${p.trophies} Tiger King`}>{Array.from({ length: p.trophies }, (_, i) => <Crown key={i} className="size-5" aria-hidden />)}</span>
                    : <span className="text-muted-foreground">–</span>}
                </TableCell>
                <TableCell className="font-num tabular text-right text-xl font-black italic">{p.points}</TableCell>
                <TableCell className="font-num tabular text-right">{p.week > 0 ? `+${p.week}` : "–"}</TableCell>
                <TableCell className="font-num tabular text-muted-foreground text-right">{p.previous ?? "–"}</TableCell>
                <TableCell>
                  {p.move === "up" && <span className="inline-flex items-center gap-1 text-green-500"><ArrowUp className="size-4" aria-hidden />Up {p.change}</span>}
                  {p.move === "down" && <span className="inline-flex items-center gap-1 text-red-500"><ArrowDown className="size-4" aria-hidden />Down {p.change}</span>}
                  {p.move === "new" && <span className="inline-flex items-center gap-1 text-yellow-400"><Sparkles className="size-4" aria-hidden />New</span>}
                  {p.move === null && <span className="text-muted-foreground">–</span>}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-muted-foreground py-6 text-center">No blader matches &ldquo;{query}&rdquo;.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {(
        <nav aria-label="Leaderboard pages" className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft aria-hidden />Previous</Button>
          <span className="text-muted-foreground text-sm">Page {current + 1} of {pages}</span>
          <Button type="button" variant="outline" size="sm" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>Next<ChevronRight aria-hidden /></Button>
        </nav>
      )}
    </div>
  );
}
