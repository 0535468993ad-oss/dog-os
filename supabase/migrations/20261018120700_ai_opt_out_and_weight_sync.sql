-- 1. Opt-out of sharing data with the AI provider (Anthropic).
--    Chat and daily insights send the dog's profile, health records and journal to Anthropic. Users may
--    object at any time (GDPR art. 21, CCPA right to limit, Privacy Protection Law). Decisions are recorded
--    in the append-only user_consents log like every other consent; the latest row wins and the default,
--    with no row, is "allowed" (the processing is disclosed in the privacy policy accepted at sign-up).
--
--    The new enum value can't be referenced in the same transaction that adds it, so everything below
--    compares consent_type as text.

alter type public.consent_type add value if not exists 'ai_data_sharing';

-- The single source of truth for "may this user's data be sent to the AI?". Runs as the caller, so RLS
-- limits it to the caller's own consents; Edge Functions call it with the user's token.
create or replace function public.ai_data_sharing_allowed()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select c.granted
      from public.user_consents c
      where c.user_id = (select auth.uid())
        and c.consent_type::text = 'ai_data_sharing'
      order by c.created_at desc
      limit 1
    ),
    true
  );
$$;

revoke execute on function public.ai_data_sharing_allowed() from public, anon;
grant execute on function public.ai_data_sharing_allowed() to authenticated;

-- 2. Atomic current weight.
--    dogs.weight_kg used to be updated by the client in a second request after logging a weight, so a
--    failure in between left the two out of sync. The trigger runs inside the statement's transaction:
--    the weight log and the dog's current weight now commit or roll back together.

create or replace function public.sync_dog_current_weight()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dog_id uuid := coalesce(new.dog_id, old.dog_id);
  v_latest numeric(5, 2);
begin
  select w.weight_kg into v_latest
  from public.weight_logs w
  where w.dog_id = v_dog_id
  order by w.measured_on desc
  limit 1;

  -- With no logs left, keep the weight entered on the dog's profile.
  if found then
    update public.dogs
    set weight_kg = v_latest
    where id = v_dog_id
      and weight_kg is distinct from v_latest;
  end if;

  return null;
end;
$$;

revoke execute on function public.sync_dog_current_weight() from public, anon, authenticated;

create trigger weight_logs_sync_dog_current_weight
  after insert or update or delete on public.weight_logs
  for each row execute function public.sync_dog_current_weight();

-- Bring existing dogs in line with their latest log.
update public.dogs d
set weight_kg = latest.weight_kg
from (
  select distinct on (dog_id) dog_id, weight_kg
  from public.weight_logs
  order by dog_id, measured_on desc
) latest
where latest.dog_id = d.id
  and d.weight_kg is distinct from latest.weight_kg;
