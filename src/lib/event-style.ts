import type { EventType } from "@/domain/event";

/**
 * Colours of each event type, shared by the calendar cells and the homepage cards. They follow the competition path
 * tiles: grey Unrank, dark Ranked, light green Cup (the dark green grenade needs a light ground), orange Major with black text,
 * red Championship, light Break.
 * `ink` is the main text and icon colour, `soft` the secondary text; both are picked for contrast on `bg`.
 * `edge` is the tile border colour (used by the homepage cards; calendar cells have no border).
 */
export const EVENT_STYLE: Record<EventType, { bg: string; ink: string; soft: string; edge: string }> = {
  Unrank: { bg: "bg-[var(--bom-fur-dark)]", ink: "text-white", soft: "text-white/85", edge: "border-[var(--bom-fur)]" },
  Ranked: { bg: "bg-[var(--bom-surface-3)]", ink: "text-white", soft: "text-white/80", edge: "border-white" },
  Cup: { bg: "bg-[#8fcf72]", ink: "text-black", soft: "text-black/75", edge: "border-white" },
  Major: { bg: "bg-[var(--bom-orange)]", ink: "text-black", soft: "text-black/80", edge: "border-white" },
  Championship: { bg: "bg-[var(--bom-loss)]", ink: "text-white", soft: "text-white/90", edge: "border-white" },
  Break: { bg: "bg-[var(--bom-fur-light)]", ink: "text-black", soft: "text-black/75", edge: "border-[var(--bom-fur)]" },
};

export const EVENT_TYPE_LABEL = (type: EventType) => (type === "Break" ? "Break / Holiday" : `BOM ${type}`);
