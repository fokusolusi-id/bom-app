import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { imageExtension, MEDIA_BUCKET, type MediaFolder } from "@/domain/media";
import { check } from "./db";

/** Signed URL the browser uploads to directly, so the file never passes through a server action (1 MB limit). */
export async function createImageUpload(client: SupabaseClient, folder: MediaFolder, contentType: unknown) {
  const path = `${folder}/${crypto.randomUUID()}.${imageExtension(contentType)}`;
  const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  check(error, "Failed to prepare upload");
  return { path, token: data!.token };
}

/** Best effort: a leftover file is harmless, so a failed cleanup is logged instead of failing the save. */
export async function removeMedia(client: SupabaseClient, paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (!list.length) return;
  const { error } = await client.storage.from(MEDIA_BUCKET).remove(list);
  if (error) console.error(`Failed to remove media ${list.join(", ")}: ${error.message}`);
}
