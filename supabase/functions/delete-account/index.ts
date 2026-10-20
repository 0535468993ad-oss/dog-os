// Right to erasure: permanently deletes the caller's account and all their data.
// POST { confirm: "DELETE" } -> { deleted: true }
// Every user-owned table references auth.users with ON DELETE CASCADE, so deleting the auth user removes
// all rows; Storage objects are not covered by FKs and are removed explicitly first.

import { errorResponse, json, logError, parseAllowedOrigins, withCors } from '../_shared/http.ts';
import { authenticate, ConfigError } from '../_shared/supabase.ts';

const PHOTO_BUCKET = 'dog-photos';

const ALLOWED_ORIGINS = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

Deno.serve(withCors(ALLOWED_ORIGINS, async (req) => {
  try {
    const auth = await authenticate(req);
    if (!auth) return errorResponse('unauthorized', 401);
    const { user, adminClient } = auth;

    const { confirm } = ((await req.json().catch(() => null)) ?? {}) as { confirm?: unknown };
    if (confirm !== 'DELETE') return errorResponse('bad_request', 400, 'Confirmation missing.');

    // Remove the user's photo folder, page by page.
    for (;;) {
      const { data: files, error: listError } = await adminClient.storage
        .from(PHOTO_BUCKET)
        .list(user.id, { limit: 100 });
      if (listError) throw listError;
      if (!files || files.length === 0) break;
      const { error: removeError } = await adminClient.storage
        .from(PHOTO_BUCKET)
        .remove(files.map((file) => `${user.id}/${file.name}`));
      if (removeError) throw removeError;
      if (files.length < 100) break;
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return json({ deleted: true });
  } catch (error) {
    if (error instanceof ConfigError) {
      logError('delete-account:config', error);
      return errorResponse('internal', 500, 'Server misconfigured.');
    }
    logError('delete-account:unexpected', error);
    return errorResponse('internal', 500);
  }
}));
