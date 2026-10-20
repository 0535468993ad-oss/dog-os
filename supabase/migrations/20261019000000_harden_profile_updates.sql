-- Least privilege on profiles: the table-wide UPDATE grant let a client rewrite bookkeeping columns
-- (created_at, updated_at). RLS already limits updates to the caller's own row; column grants now limit
-- them to the fields the app edits. id is covered by RLS's WITH CHECK, timestamps by the trigger.

revoke update on table public.profiles from authenticated;
grant update (display_name, active_dog_id, onboarding_completed) on table public.profiles to authenticated;
