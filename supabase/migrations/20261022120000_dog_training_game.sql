-- Per-dog training gamification and anti-cheat state, synced from the app. The device keeps an offline
-- cache (AsyncStorage); this table is the source of truth across devices and survives sign-out.
--
-- The summary columns are what the server can check and query; `state` holds the full client state
-- (session log, temperament, chosen tracks, rapid-action log) so another device can rebuild streaks
-- and trophies. Conflicts resolve last-write-wins on client_updated_at.

create table public.dog_training_game (
  dog_id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  level smallint not null default 1 check (level between 1 and 10),
  streak_days integer not null default 0 check (streak_days >= 0),
  distinct_active_days integer not null default 0 check (distinct_active_days >= 0),
  -- XP earned on daily_xp_date. The app caps a calendar day at 300 XP; so does the database.
  daily_xp_earned integer not null default 0 check (daily_xp_earned between 0 and 300),
  daily_xp_date date,
  unlocked_trophies text[] not null default '{}'
    check (unlocked_trophies <@ array['iron-shield', 'recall-magnet', 'steel-control', 'field-beast']::text[]),
  last_session_at timestamptz,
  state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(state) = 'object' and pg_column_size(state) < 524288),
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- No calendar day can earn more than the cap, so total XP is bounded by the days actually trained.
  constraint dog_training_game_xp_within_daily_cap check (xp <= 300 * distinct_active_days),
  constraint dog_training_game_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index dog_training_game_user_idx on public.dog_training_game (user_id);

create trigger dog_training_game_set_updated_at
  before update on public.dog_training_game
  for each row execute function public.set_updated_at();

alter table public.dog_training_game enable row level security;

create policy "dog_training_game_select_own" on public.dog_training_game
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dog_training_game_insert_own" on public.dog_training_game
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dog_training_game_update_own" on public.dog_training_game
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "dog_training_game_delete_own" on public.dog_training_game
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.dog_training_game from anon;
grant select, insert, update, delete on table public.dog_training_game to authenticated;
