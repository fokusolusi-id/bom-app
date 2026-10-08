import { MEDIA_BUCKET } from "@/domain/media";

/** Public URL of a file in the media bucket. */
export const mediaUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
