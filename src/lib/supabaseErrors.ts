/**
 * The table/view doesn't exist in the database (a migration hasn't been applied): PostgREST PGRST205
 * ("not in the schema cache") or Postgres 42P01. A deployment problem, not a transient failure.
 */
export function isSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  return error.code === 'PGRST205' || error.code === '42P01';
}
