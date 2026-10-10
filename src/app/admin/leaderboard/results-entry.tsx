"use client";
import { Crown } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/form/action-form";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { Input, Textarea } from "@/components/ui/input";
import { formatBomId } from "@/domain/profile";
import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";
import { fetchChallongeResults, saveEventResults, setPlacement } from "./actions";

const TEMPLATE = "Mr. DiBo\nPrett (TK)\nBoM-010\nHirono\nZenn X";
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold" htmlFor={`results-${eventId}`}>{mode === "challonge" ? "Results from the bracket" : "Enter all results at once"}</label>
            <HelpTip label="How to enter results">
              <p>One member per line, by blader name or BOM ID (BoM-003, bom 3 or just 3).</p>
              <p>The first line is 1st place, the second 2nd, up to 8th. Every line after that took part without a place.</p>
              <p>Start a line with its place (3. Name) when two members share it.</p>
              <p>A name that matches no member is saved as Non BOM ID: it counts as a participant but is not shown on the leaderboard or in results.</p>
              <p>Add (TK) after the Tiger King, once. Saving replaces the results of this event.</p>
              <pre className="bg-muted/60 rounded p-2 whitespace-pre">{TEMPLATE}</pre>
            </HelpTip>
          </div>
          <Textarea id={`results-${eventId}`} name="results" value={list} onChange={(e) => setList(e.target.value)} rows={Math.min(14, Math.max(6, list.split("\n").length + 1))} placeholder={TEMPLATE} className="font-mono text-base text-white" />
          <Button type="submit">Save results</Button>
        </ActionForm>
      )}
      </div>
    </div>
  );
}
