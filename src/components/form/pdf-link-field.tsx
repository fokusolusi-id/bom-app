"use client";
import { useState } from "react";
import { MAX_PDF_BYTES, MEDIA_BUCKET } from "@/domain/media";
import { mediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

type Prepare = (contentType: string) => Promise<{ path: string; token: string } | { error: string }>;

/** A PDF link the admin can type, or fill by uploading a file (stored in the media bucket; the field then holds its public URL). */
export function PdfLinkField({ name, defaultValue, prepare }: { name: string; defaultValue: string; prepare: Prepare }) {
  const [href, setHref] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (file.type !== "application/pdf") return setError("Choose a PDF file");
    if (file.size > MAX_PDF_BYTES) return setError("The file must be at most 10 MB");
    setBusy(true);
    try {
      const target = await prepare(file.type);
      if ("error" in target) return setError(target.error);
      const { error } = await createClient().storage.from(MEDIA_BUCKET).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
      if (error) return setError(`Upload failed: ${error.message}`);
      setHref(mediaUrl(target.path));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Input name={name} value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://... or upload a PDF below" maxLength={500} className="text-base text-white" />
      <input type="file" accept="application/pdf" disabled={busy} aria-label="Upload a PDF" className="text-sm"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      {busy && <span className="text-muted-foreground text-sm">Uploading…</span>}
      {error && <span role="alert" className="text-destructive text-sm">{error}</span>}
    </div>
  );
}
