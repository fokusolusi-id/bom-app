"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, PROOF_BUCKET } from "@/domain/media";
import { createClient } from "@/lib/supabase/client";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Uploads a payment screenshot straight to the private proofs bucket and submits only its path
 * (hidden input `name`). The bucket accepts anonymous uploads but only admins can read.
 */
export function ProofUpload({ name }: { name: string }) {
  const [path, setPath] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hidden = useRef<HTMLInputElement>(null);

  // Follow the parent form's reset.
  useEffect(() => {
    const form = hidden.current?.form;
    const onReset = () => { setPath(null); setFileName(""); setError(null); };
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, []);

  async function upload(file: File) {
    setError(null);
    const ext = EXT[file.type];
    if (!ext) return setError("Format harus JPG, PNG, atau WebP");
    if (file.size > MAX_IMAGE_BYTES) return setError("Ukuran file maksimal 5 MB");
    setBusy(true);
    try {
      const target = `proofs/${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient().storage.from(PROOF_BUCKET).upload(target, file, { contentType: file.type });
      if (error) return setError(`Upload gagal: ${error.message}`);
      setPath(target);
      setFileName(file.name);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input ref={hidden} type="hidden" name={name} value={path ?? ""} />
      {path ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-success truncate">✓ {fileName}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => { setPath(null); setFileName(""); }}>Ganti</Button>
        </div>
      ) : (
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          disabled={busy}
          required
          aria-label="Upload screenshot of payment"
          className="text-sm"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }}
        />
      )}
      {busy && <span className="text-muted-foreground text-sm">Mengunggah…</span>}
      {error && <span role="alert" className="text-destructive block text-sm">{error}</span>}
    </div>
  );
}
