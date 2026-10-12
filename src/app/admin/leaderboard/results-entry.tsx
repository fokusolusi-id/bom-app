"use client";
import { Crown } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { Input, Textarea } from "@/components/ui/input";
import { formatBomId } from "@/domain/profile";
import { formatResultsText, parseResultsText } from "@/domain/result";
import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";
import { fetchChallongeResults, saveEventResults, setPlacement } from "./actions";

// What a numbered list looks like: place, BOM ID, name, then up to three combos. The last member is not in the club yet.
const TEMPLATE = "1 [BOM-001] Decade (TK)\nAP 1-80 LR\nHR 9-60 LO\nPW 3-60 R\n\n2 [BOM-002] Mr. DiBo\nDSt 6-70 J\nCDg 3-60 E\nTB 1-60 R\n\n3 [Non BOM ID] Vampire\nAP 1-50 R\nPW 3-60 LR\nHR 9-60 Nr";
const memberLabel = (p: { name: string; bom_id: string }) => `${p.name} ${formatBomId(p.bom_id)}`;
const squash = (v: string) => v.toLowerCase().replace(/[\s-[\]]/g, "");

/** The member a typed text points to: the exact suggestion, a blader name, or a BOM ID ("BoM-001", "bom 1" or "1"). */
function findMember(members: { id: string; name: string; bom_id: string }[], text: string) {
  const q = text.trim();
  if (!q) return undefined;
  const typed = /^(?:bom)?[\s-]*(\d+)$/i.exec(q)?.[1];
  return members.find((p) => memberLabel(p).toLowerCase() === q.toLowerCase())
    ?? members.find((p) => p.name.toLowerCase() === q.toLowerCase())
    ?? members.find((p) => squash(p.bom_id) === squash(q))
    ?? (typed ? members.find((p) => Number(/\d+/.exec(p.bom_id)?.[0]) === Number(typed)) : undefined);
}

const MODES = [["manual", "Add one by one"], ["paste", "Paste a list"], ["challonge", "From Challonge"]] as const;
type Mode = (typeof MODES)[number][0];

/** Three ways to enter an event's results: add a member at a time, paste the whole list, or read the final ranking of a Challonge bracket. */
export function ResultsEntry({ eventId, text, challongeUrl, members, hasChallongeKey }: {
  eventId: string; text: string; challongeUrl: string | null; members: { id: string; name: string; bom_id: string }[]; hasChallongeKey: boolean;
}) {
  const [mode, setMode] = useState<Mode>(challongeUrl ? "challonge" : "paste");
  const [list, setList] = useState(text);
  const [link, setLink] = useState(challongeUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [memberText, setMemberText] = useState("");
  const [note, setNote] = useState<{ error?: string; unmatched?: string[] } | null>(null);

  // What the list will save as, worked out as you type: which names are members, and which are Non BOM ID.
  const preview = useMemo(() => {
    if (list.trim() === "") return null;
    try {
      return { rows: parseResultsText(list, members) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Check the list" };
    }
  }, [list, members]);

  // Typing "dewa", "bom 1" or the full suggestion all find the member.
  const chosen = findMember(members, memberText);

  const addMember = async (prev: FormState, data: FormData) => {
    const result = await setPlacement(prev, data);
    if (result.ok) setMemberText("");
    return result;
  };

  async function grab() {
    setBusy(true);
    setNote(null);
    const result = await fetchChallongeResults(eventId, link);
    setBusy(false);
    if (result.error || !result.data) return setNote({ error: result.error });
    setList(result.data.text);
    setLink(result.data.url);
    setNote({ unmatched: result.data.unmatched });
  }

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="How to enter results" className="flex flex-wrap border-b">
        {MODES.map(([value, label]) => (
          <button
            key={value} id={`tab-${eventId}-${value}`} type="button" role="tab" aria-selected={mode === value} aria-controls={`panel-${eventId}`} onClick={() => setMode(value)}
            className={cn("font-label -mb-px border-b-2 px-4 py-2 text-sm font-bold uppercase italic", mode === value ? "text-primary border-primary" : "text-muted-foreground hover:text-primary border-transparent")}
          >{label}</button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${eventId}`} aria-labelledby={`tab-${eventId}-${mode}`} className="space-y-4 pt-2">
      {mode === "manual" && (
        <ActionForm action={addMember} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_7rem]">
          <input type="hidden" name="event_id" value={eventId} />
          {/* Type to search by blader name or BOM ID; the suggestions are the members, and the matching one is submitted. */}
          <div>
            <Input list={`members-${eventId}`} value={memberText} onChange={(e) => setMemberText(e.target.value)} placeholder="Member: type a name or BOM ID" aria-label="Member" autoComplete="off" required className="text-base"
              onInvalid={(e) => e.currentTarget.setCustomValidity("Pick a member from the list")} onInput={(e) => e.currentTarget.setCustomValidity(chosen ? "" : "Pick a member from the list")} />
            <datalist id={`members-${eventId}`}>{members.map((p) => <option key={p.id} value={memberLabel(p)} />)}</datalist>
            <input type="hidden" name="player_id" value={chosen?.id ?? ""} />
          </div>
          <Input name="place" type="number" min={1} max={999} placeholder="Place (top 8)" aria-label="Place" />
          <Textarea name="combos" rows={3} placeholder={"Winning combos, one per line (top 8 and Tiger King)\nAP 1-80 LR"} aria-label="Winning combos" className="font-mono text-base sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="tiger_king" /><Crown className="size-4 text-yellow-400" aria-hidden /> Tiger King (one per event)</label>
          <Button type="submit" className="sm:col-span-2">Add or update member</Button>
        </ActionForm>
      )}

      {mode !== "manual" && (
        <ActionForm action={saveEventResults.bind(null, eventId)} className="space-y-3">
          {mode === "challonge" && (
            <div className="space-y-2">
              <label className="text-sm font-bold" htmlFor={`challonge-${eventId}`}>Challonge bracket</label>
              <div className="flex flex-wrap gap-2">
                <Input id={`challonge-${eventId}`} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://challonge.com/your_bracket" maxLength={200} className="min-w-0 flex-1 text-base text-white" />
                <Button type="button" variant="outline" disabled={busy || !link.trim() || !hasChallongeKey} onClick={grab}>{busy ? "Reading…" : "Get the ranking"}</Button>
              </div>
              {!hasChallongeKey && <p className="text-muted-foreground text-xs">Reading a bracket needs the server key <code>CHALLONGE_API_KEY</code> (your Challonge API key). Until it is set, paste the list instead.</p>}
              <p className="text-muted-foreground text-xs">The bracket must be finished. The ranking fills the list below, where you can fix names and add the Tiger King before saving. The link is kept with the event.</p>
              {note?.error && <p role="alert" className="text-destructive text-sm">{note.error}</p>}
              {note?.unmatched && note.unmatched.length > 0 && <p role="alert" className="text-sm text-yellow-400">No BOM ID found for: {note.unmatched.join(", ")}. They will be saved as Non BOM ID: counted as participants, but not shown on the leaderboard or in results. To make one a member, write their blader name or BOM ID on the line.</p>}
              {note?.unmatched && note.unmatched.length === 0 && <p role="status" className="text-success text-sm">Every name matched a member. Check the list and save.</p>}
            </div>
          )}
          <input type="hidden" name="challonge_url" value={mode === "challonge" ? link : (challongeUrl ?? "")} />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <div className="space-y-2">
          <div className="flex h-8 items-center gap-2">
            <label className="text-sm font-bold" htmlFor={`results-${eventId}`}>{mode === "challonge" ? "Results from the bracket" : "Enter all results at once"}</label>
            {list.trim() === "" && <Button type="button" variant="outline" size="sm" onClick={() => setList(TEMPLATE)}>Insert the template</Button>}
            <HelpTip label="How to enter results">
              <p>One member per entry: place, then the BOM ID in brackets, then the name. The three lines under it are the combos they won with (only the top 8 and the Tiger King).</p>
              <p>Add (TK) after the Tiger King, once. Two members can share a place.</p>
              <p><b>Not a member?</b> Write <code>[Non BOM ID]</code> instead of the BOM ID. A name that matches no member is also saved as Non BOM ID automatically: it counts as a participant but is not shown on the leaderboard or in results.</p>
              <p>A plain list of names, one per line, still works (first line is 1st place). Saving replaces the results of this event.</p>
              <pre className="bg-muted/60 rounded p-2 whitespace-pre">{TEMPLATE}</pre>
            </HelpTip>
          </div>
          <Textarea id={`results-${eventId}`} name="results" value={list} onChange={(e) => setList(e.target.value)} rows={Math.min(24, Math.max(10, list.split("\n").length + 1))} placeholder={TEMPLATE} className="font-mono text-base text-white" />
            </div>
            <div className="space-y-2">
          <div className="flex h-8 items-center"><h3 className="text-sm font-bold">Detected</h3></div>
          {!preview && <p className="text-muted-foreground text-sm">Type or paste a list, and it shows here who is a member and who is Non BOM ID.</p>}
          {preview?.error && <p role="alert" className="text-destructive text-sm">{preview.error}</p>}
          {preview?.rows && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="text-muted-foreground text-xs uppercase">
                {preview.rows.filter((r) => r.playerId).length} members
                {preview.rows.some((r) => !r.playerId) && <>, <span className="text-yellow-400">{preview.rows.filter((r) => !r.playerId).length} Non BOM ID</span></>}
              </p>
              <ul className="space-y-1">
                {preview.rows.map((r, i) => {
                  const member = r.playerId ? members.find((m) => m.id === r.playerId) : undefined;
                  return (
                    <li key={i} className="flex flex-wrap items-center gap-x-2">
                      <span className="text-primary w-6 font-bold">{r.place ?? "–"}</span>
                      {member ? <span className="bg-primary text-primary-foreground rounded px-1.5 text-xs font-bold">{formatBomId(member.bom_id)}</span> : <span className="rounded border border-yellow-400 px-1.5 text-xs text-yellow-400 uppercase">Non BOM ID</span>}
                      <span>{member?.name ?? r.guestName}</span>
                      {r.tigerKing && <Crown className="size-4 text-yellow-400" aria-label="Tiger King" />}
                      {r.warning && <span className="text-xs text-yellow-400">⚠ {r.warning}</span>}
                      {r.combos.length > 0 && <span className="text-muted-foreground text-xs">{r.combos.length} combo{r.combos.length > 1 ? "s" : ""}</span>}
                    </li>
                  );
                })}
              </ul>
              <Button type="button" variant="outline" size="sm" onClick={() => setList(formatResultsText(preview.rows, members))}>Write the detected BOM IDs into the list</Button>
            </div>
          )}
            </div>
          </div>
          <Button type="submit">Save results</Button>
        </ActionForm>
      )}
      </div>
    </div>
  );
}
