// Client-side mirror of the dog-photos bucket rules (supabase/migrations/20261018120000_core_schema.sql):
// the server enforces them; checking here first gives a clear failure instead of a rejected upload, and
// keeps an unexpected picker MIME string out of the storage path.

/** Bucket file_size_limit (5 MiB). */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
} as const;

export type PhotoContentType = keyof typeof TYPES;

export class PhotoRejectedError extends Error {
  constructor(readonly reason: 'type' | 'size') {
    super(`photo_rejected_${reason}`);
    this.name = 'PhotoRejectedError';
  }
}

/** The allowed content type and file extension for a picker MIME type (missing → JPEG); null if not allowed. */
export function photoFileType(mimeType: string | null | undefined): { contentType: PhotoContentType; ext: string } | null {
  const normalized = (mimeType ?? 'image/jpeg').trim().toLowerCase();
  const contentType = normalized === 'image/jpg' ? 'image/jpeg' : normalized;
  if (!Object.prototype.hasOwnProperty.call(TYPES, contentType)) return null;
  return { contentType: contentType as PhotoContentType, ext: TYPES[contentType as PhotoContentType] };
}

/** Decoded byte length of a base64 string, without decoding it. */
export function base64ByteLength(base64: string): number {
  const clean = base64.replace(/\s/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

/** Throws PhotoRejectedError unless the photo's type and size match the bucket rules. */
export function assertPhotoAllowed(mimeType: string | null | undefined, byteLength: number): { contentType: PhotoContentType; ext: string } {
  const type = photoFileType(mimeType);
  if (!type) throw new PhotoRejectedError('type');
  if (byteLength > MAX_PHOTO_BYTES) throw new PhotoRejectedError('size');
  return type;
}
