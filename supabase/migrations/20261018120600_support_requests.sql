-- In-app requests to the operator: privacy rights requests (access / correction / deletion / objection,
-- Privacy Protection Law §13–14, GDPR art. 15–21), accessibility issue reports (Equal Rights for Persons
-- with Disabilities regulations) and general contact. Clients can file and read their own requests;
-- only the operator (service role / dashboard) changes status.

create type public.support_request_type as enum (
  'privacy_access',
  'privacy_correction',
  'privacy_deletion',
  'privacy_objection',
  'accessibility',
  'general'
);
create type public.support_request_status as enum ('open', 'in_progress', 'closed');

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  request_type public.support_request_type not null,
  subject text not null check (char_length(btrim(subject)) between 2 and 120),
  message text not null check (char_length(btrim(message)) between 10 and 4000),
  contact_email text check (contact_email is null or (char_length(contact_email) <= 254 and contact_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')),
  status public.support_request_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_requests_user_idx on public.support_requests (user_id, created_at desc);

create trigger support_requests_set_updated_at
  before update on public.support_requests
  for each row execute function public.set_updated_at();

-- Abuse protection: at most 5 requests per user per 24 hours.
create or replace function public.limit_support_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.support_requests
    where user_id = new.user_id and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'support request rate limit exceeded' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_support_requests() from public, anon, authenticated;

create trigger support_requests_rate_limit
  before insert on public.support_requests
  for each row execute function public.limit_support_requests();

alter table public.support_requests enable row level security;

create policy "support_requests_select_own" on public.support_requests
  for select to authenticated using ((select auth.uid()) = user_id);
-- New requests always start open; clients can't set another status.
create policy "support_requests_insert_own" on public.support_requests
  for insert to authenticated with check ((select auth.uid()) = user_id and status = 'open');

revoke all on table public.support_requests from anon;
grant select, insert on table public.support_requests to authenticated;
