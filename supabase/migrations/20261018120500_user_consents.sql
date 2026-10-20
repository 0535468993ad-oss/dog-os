-- Consent audit log (Israeli Privacy Protection Law / GDPR accountability). Append-only: rows are never
-- updated or deleted by clients; a withdrawal is a new row with granted = false.

create type public.consent_type as enum ('terms_of_service', 'privacy_policy', 'ai_disclaimer', 'analytics');
create type public.consent_source as enum ('signup', 'reconsent', 'settings', 'cookie_banner');

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  consent_type public.consent_type not null,
  document_version text not null check (document_version ~ '^\d{4}-\d{2}-\d{2}$'),
  granted boolean not null,
  source public.consent_source not null,
  created_at timestamptz not null default now()
);

create index user_consents_user_type_idx on public.user_consents (user_id, consent_type, created_at desc);

alter table public.user_consents enable row level security;

create policy "user_consents_select_own" on public.user_consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_consents_insert_own" on public.user_consents
  for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on table public.user_consents from anon;
grant select, insert on table public.user_consents to authenticated;

-- Record sign-up consents server-side, at account creation. The client sends them in the sign-up
-- metadata as consents: [{ "type": "...", "version": "YYYY-MM-DD" }]; anything malformed is ignored.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  consents jsonb := new.raw_user_meta_data -> 'consents';
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(new.raw_user_meta_data ->> 'display_name', 60))
  on conflict (id) do nothing;

  if jsonb_typeof(consents) = 'array' then
    insert into public.user_consents (user_id, consent_type, document_version, granted, source)
    select new.id, c.type::public.consent_type, c.version, true, 'signup'
    from jsonb_to_recordset(consents) as c (type text, version text)
    where c.type in ('terms_of_service', 'privacy_policy', 'ai_disclaimer')
      and c.version ~ '^\d{4}-\d{2}-\d{2}$';
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
