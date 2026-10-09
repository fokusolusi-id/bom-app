/** Video id from a YouTube link (watch, youtu.be, shorts, embed, live). Returns null when it is not one. */
export function parseYoutubeId(raw: unknown): string | null {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, kind, rest] = url.pathname.split("/");
    id = kind === "watch" ? (url.searchParams.get("v") ?? undefined) : ["shorts", "embed", "live", "v"].includes(kind) ? rest : undefined;
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
