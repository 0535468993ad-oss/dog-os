-- Behavior/health journal per dog, and the daily AI insights cache written by the `insights` Edge Function.

-- Canonical breed slug (src/features/dogs/breeds.ts) alongside the free-text display name, so breed
-- predispositions in veterinary_knowledge_base.breeds can be matched reliably. Null = mixed/other.
alter table public.dogs add column breed_id text check (breed_id ~ '^[a-z0-9-]+$');

create type public.journal_category as enum ('behavior', 'health', 'training', 'general');
create type public.journal_mood as enum ('great', 'good', 'okay', 'bad');

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid not null,
  entry_date date not null default current_date,
  category public.journal_category not null default 'general',
  mood public.journal_mood,
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index journal_entries_dog_date_idx on public.journal_entries (dog_id, entry_date desc, created_at desc);
create index journal_entries_user_idx on public.journal_entries (user_id);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;

create policy "journal_entries_select_own" on public.journal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "journal_entries_insert_own" on public.journal_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "journal_entries_update_own" on public.journal_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "journal_entries_delete_own" on public.journal_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- One AI-generated set of insights per dog per day. Written only by the Edge Function (service role),
-- so clients can never plant fake "AI" content; clients may read and delete (to force a refresh).
create table public.dog_daily_insights (
  dog_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  insight_date date not null,
  -- [{ "kind": "health" | "training" | "behavior" | "nutrition", "priority": "high" | "normal", "title": string, "body": string }]
  insights jsonb not null check (jsonb_typeof(insights) = 'array'),
  model text not null,
  created_at timestamptz not null default now(),
  primary key (dog_id, insight_date),
  constraint dog_daily_insights_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index dog_daily_insights_user_idx on public.dog_daily_insights (user_id);

alter table public.dog_daily_insights enable row level security;

create policy "dog_daily_insights_select_own" on public.dog_daily_insights
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dog_daily_insights_delete_own" on public.dog_daily_insights
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.journal_entries, public.dog_daily_insights from anon;
grant select, insert, update, delete on table public.journal_entries to authenticated;
grant select, delete on table public.dog_daily_insights to authenticated;
