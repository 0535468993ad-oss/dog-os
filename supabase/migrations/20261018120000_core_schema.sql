-- Dog OS core schema: profiles, extended dogs, training academy, AI chat history and health records.
--
-- Security model:
--   * Every user-owned row has user_id (default auth.uid()) and RLS restricts it to (select auth.uid()) = user_id.
--   * Rows that belong to a dog use a composite FK (dog_id, user_id) -> dogs (id, user_id), so the database
--     itself guarantees a row can only point at a dog owned by the same user, independent of RLS.
--   * training_modules / training_module_steps are a shared catalog: read-only for signed-in users,
--     writable only by migrations / service role.
--   * chat_history is read/delete-only for clients; messages are written by the chat Edge Function.
--   * anon gets no table privileges at all.

-- ============================================================================
-- Helpers
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- dogs (extend the table from 20261018000000_init)
-- ============================================================================

alter type public.dog_size add value if not exists 'giant';

drop policy if exists "Owners manage their dogs" on public.dogs;
drop policy if exists "Owners manage their training sessions" on public.training_sessions;

alter table public.dogs rename column owner_id to user_id;
alter table public.dogs rename column photo_url to profile_photo_path; -- path inside the dog-photos bucket
alter index public.dogs_owner_id_idx rename to dogs_user_id_idx;

alter table public.dogs
  add column weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg < 150),
  add column updated_at timestamptz not null default now(),
  add constraint dogs_name_length check (char_length(name) between 1 and 50),
  add constraint dogs_breed_length check (char_length(breed) between 1 and 80),
  add constraint dogs_id_user_id_key unique (id, user_id);

create trigger dogs_set_updated_at
  before update on public.dogs
  for each row execute function public.set_updated_at();

create policy "dogs_select_own" on public.dogs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dogs_insert_own" on public.dogs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dogs_update_own" on public.dogs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "dogs_delete_own" on public.dogs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================================
-- training_sessions (free-form practice log; feeds the dashboard streak)
-- ============================================================================

alter table public.training_sessions rename column owner_id to user_id;

alter table public.training_sessions
  drop constraint training_sessions_dog_id_fkey,
  add constraint training_sessions_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade,
  add constraint training_sessions_skill_length check (char_length(skill) between 1 and 80),
  add constraint training_sessions_duration_max check (duration_minutes <= 600);

create index training_sessions_user_completed_idx
  on public.training_sessions (user_id, completed_at desc);

create policy "training_sessions_select_own" on public.training_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "training_sessions_insert_own" on public.training_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "training_sessions_update_own" on public.training_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "training_sessions_delete_own" on public.training_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================================
-- profiles (one row per auth user, created automatically)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  active_dog_id uuid,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The active dog must belong to this user; deleting it clears only active_dog_id.
  constraint profiles_active_dog_fkey
    foreign key (active_dog_id, id) references public.dogs (id, user_id) on delete set null (active_dog_id)
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(new.raw_user_meta_data ->> 'display_name', 60))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users who signed up before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

-- No insert/delete policies: rows are created by the trigger and removed with the auth user.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ============================================================================
-- Training academy catalog (shared, read-only)
-- ============================================================================

create type public.training_category as enum ('basics', 'obedience', 'behavior', 'leash', 'puppy', 'tricks');
create type public.training_difficulty as enum ('beginner', 'intermediate', 'advanced');

create table public.training_modules (
  id text primary key check (id ~ '^[a-z0-9-]+$'), -- stable slug, e.g. 'sit'
  title text not null,
  summary text not null,
  category public.training_category not null,
  difficulty public.training_difficulty not null,
  estimated_minutes integer not null check (estimated_minutes > 0),
  tips text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.training_module_steps (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references public.training_modules (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  instructions text not null,
  unique (module_id, position)
);

alter table public.training_modules enable row level security;
alter table public.training_module_steps enable row level security;

create policy "training_modules_read" on public.training_modules
  for select to authenticated using (true);
create policy "training_module_steps_read" on public.training_module_steps
  for select to authenticated using (true);

-- ============================================================================
-- user_training_progress (completed steps per dog)
-- ============================================================================

create table public.user_training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid not null,
  step_id uuid not null references public.training_module_steps (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (dog_id, step_id),
  constraint user_training_progress_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index user_training_progress_user_completed_idx
  on public.user_training_progress (user_id, completed_at desc);

alter table public.user_training_progress enable row level security;

-- Progress is either recorded or removed; there is nothing to update.
create policy "user_training_progress_select_own" on public.user_training_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_training_progress_insert_own" on public.user_training_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_training_progress_delete_own" on public.user_training_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================================
-- chat_history (AI consultant)
-- ============================================================================

create type public.chat_role as enum ('user', 'assistant');

create table public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid, -- null = general conversation not tied to a dog
  role public.chat_role not null,
  message text not null check (char_length(message) between 1 and 8000),
  created_at timestamptz not null default now(),
  constraint chat_history_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index chat_history_conversation_idx on public.chat_history (user_id, dog_id, created_at);

alter table public.chat_history enable row level security;

-- Clients can read and clear their history. Inserts come only from the chat Edge Function
-- (service role), so a client can never forge an 'assistant' message.
create policy "chat_history_select_own" on public.chat_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "chat_history_delete_own" on public.chat_history
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================================
-- Health & nutrition
-- ============================================================================

create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  last_given date,
  due_date date,
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vaccinations_has_date check (last_given is not null or due_date is not null),
  constraint vaccinations_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index vaccinations_dog_due_idx on public.vaccinations (dog_id, due_date);
create index vaccinations_user_due_idx on public.vaccinations (user_id, due_date);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid not null,
  weight_kg numeric(5, 2) not null check (weight_kg > 0 and weight_kg < 150),
  measured_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (dog_id, measured_on),
  constraint weight_logs_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index weight_logs_user_idx on public.weight_logs (user_id);

create table public.food_portions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid not null,
  food_name text not null check (char_length(food_name) between 1 and 80),
  kcal_per_100g numeric(6, 1) check (kcal_per_100g > 0 and kcal_per_100g <= 1000),
  grams_per_meal numeric(6, 1) not null check (grams_per_meal > 0 and grams_per_meal <= 5000),
  meals_per_day smallint not null check (meals_per_day between 1 and 6),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_portions_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index food_portions_dog_idx on public.food_portions (dog_id);
create index food_portions_user_idx on public.food_portions (user_id);

create table public.medical_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 5000),
  noted_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medical_notes_dog_fkey
    foreign key (dog_id, user_id) references public.dogs (id, user_id) on delete cascade
);

create index medical_notes_dog_idx on public.medical_notes (dog_id, noted_on desc);
create index medical_notes_user_idx on public.medical_notes (user_id);

create trigger vaccinations_set_updated_at
  before update on public.vaccinations
  for each row execute function public.set_updated_at();
create trigger food_portions_set_updated_at
  before update on public.food_portions
  for each row execute function public.set_updated_at();
create trigger medical_notes_set_updated_at
  before update on public.medical_notes
  for each row execute function public.set_updated_at();

alter table public.vaccinations enable row level security;
alter table public.weight_logs enable row level security;
alter table public.food_portions enable row level security;
alter table public.medical_notes enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['vaccinations', 'weight_logs', 'food_portions', 'medical_notes'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end;
$$;

-- ============================================================================
-- Privileges (defense in depth on top of RLS)
-- ============================================================================

revoke all on table
  public.dogs, public.training_sessions, public.profiles, public.training_modules,
  public.training_module_steps, public.user_training_progress, public.chat_history,
  public.vaccinations, public.weight_logs, public.food_portions, public.medical_notes
from anon;

grant select, insert, update, delete on table
  public.dogs, public.training_sessions, public.vaccinations, public.weight_logs,
  public.food_portions, public.medical_notes
to authenticated;
grant select, update on table public.profiles to authenticated;
grant select on table public.training_modules, public.training_module_steps to authenticated;
grant select, insert, delete on table public.user_training_progress to authenticated;
grant select, delete on table public.chat_history to authenticated;

-- ============================================================================
-- Storage: private dog photos at dog-photos/<user_id>/<file>
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dog-photos', 'dog-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "dog_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dog_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dog_photos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dog_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
