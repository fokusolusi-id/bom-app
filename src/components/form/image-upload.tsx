"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, MEDIA_BUCKET } from "@/domain/media";
import { mediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

type Prepare = (contentType: string) => Promise<{ path: string; token: string } | { error: string }>;

/**
 * Uploads an image straight to Supabase Storage and submits only its path (hidden input `name`).
 * The file input has no name, so the file itself never goes through the server action.
 */
export function ImageUpload({ name, label, defaultPath, prepare }: {
  name: string; label: string; defaultPath?: string | null; prepare: Prepare;
}) {
  const [path, setPath] = useState(defaultPath ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hidden = useRef<HTMLInputElement>(null);

  // Follow the parent form's reset (ActionForm resets after a successful create).
  useEffect(() => {
    const form = hidden.current?.form;
    const onReset = () => { setPath(defaultPath ?? null); setError(null); };
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [defaultPath]);

  async function upload(file: File) {
    setError(null);
    if (file.size > MAX_IMAGE_BYTES) return setError("Ukuran foto maksimal 5 MB");
    setBusy(true);
    try {
      const target = await prepare(file.type);
      if ("error" in target) return setError(target.error);
      const { error } = await createClient().storage.from(MEDIA_BUCKET).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
      if (error) return setError(`Upload gagal: ${error.message}`);
      setPath(target.path);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="col-span-full flex flex-wrap items-center gap-3">
      <input ref={hidden} type="hidden" name={name} value={path ?? ""} />
      {path && <Image src={mediaUrl(path)} alt="" width={160} height={90} className="aspect-video rounded-md border object-cover" />}
      <label className="text-sm">
        <span className="sr-only">{label}</span>
        <input type="file" accept={IMAGE_ACCEPT} disabled={busy} aria-label={label} className="text-sm"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      </label>
      {busy && <span className="text-muted-foreground text-sm">Mengunggah…</span>}
      {path && !busy && <Button type="button" variant="outline" size="sm" onClick={() => setPath(null)}>Hapus foto</Button>}
      {error && <span role="alert" className="text-destructive text-sm">{error}</span>}
    </div>
  );
}
