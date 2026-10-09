"use client";
import { useEffect, useRef, useState } from "react";
import { isVideoPath, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, MEDIA_ACCEPT, MEDIA_BUCKET } from "@/domain/media";
import { mediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

type Prepare = (contentType: string) => Promise<{ path: string; token: string } | { error: string }>;

/** Upload of one photo (`kind="image"`) or one video (`kind="video"`) with a preview. Submits only the storage path. */
export function MediaUpload({ name, label, defaultPath, prepare, kind }: {
  name: string; label: string; defaultPath?: string | null; prepare: Prepare; kind: "image" | "video";
}) {
  const [path, setPath] = useState(defaultPath ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hidden = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = hidden.current?.form;
    const onReset = () => { setPath(defaultPath ?? null); setError(null); };
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [defaultPath]);

  async function upload(file: File) {
    setError(null);
    const isVideo = file.type.startsWith("video/");
    if (isVideo !== (kind === "video")) return setError(kind === "video" ? "Choose a video file (MP4/WebM)" : "Choose a photo file (JPG/PNG/WebP)");
    if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) return setError(`The file must be at most ${isVideo ? "20" : "5"} MB`);
    setBusy(true);
    try {
      const target = await prepare(file.type);
      if ("error" in target) return setError(target.error);
      const { error } = await createClient().storage.from(MEDIA_BUCKET).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
      if (error) return setError(`Upload failed: ${error.message}`);
      setPath(target.path);
    } finally {
      setBusy(false);
    }
  }

  const accept = MEDIA_ACCEPT.split(",").filter((t) => t.startsWith("video/") === (kind === "video")).join(",");
  return (
    <div className="col-span-full flex flex-wrap items-center gap-3">
      <input ref={hidden} type="hidden" name={name} value={path ?? ""} />
      {path && (isVideoPath(path)
        ? <video src={mediaUrl(path)} muted playsInline preload="metadata" className="bg-muted h-24 rounded-md border" />
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary upload
        : <img src={mediaUrl(path)} alt="" className="bg-muted h-24 rounded-md border object-contain" />)}
      <label className="text-sm">
        <span className="sr-only">{label}</span>
        <input type="file" accept={accept} disabled={busy} aria-label={label} className="text-sm"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      </label>
      {busy && <span className="text-muted-foreground text-sm">Uploading…</span>}
      {error && <span role="alert" className="text-destructive text-sm">{error}</span>}
    </div>
  );
}
