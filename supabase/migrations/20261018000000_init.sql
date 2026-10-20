-- Initial schema: dogs and their training sessions, each owned by an auth user.

create type public.dog_size as enum ('small', 'medium', 'large');

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  breed text not null,
  birth_date date not null,
  size public.dog_size not null,
  photo_url text,
  created_at timestamptz not null default now()
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  skill text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  completed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index dogs_owner_id_idx on public.dogs (owner_id);
create index training_sessions_dog_id_idx on public.training_sessions (dog_id, completed_at desc);

alter table public.dogs enable row level security;
alter table public.training_sessions enable row level security;

create policy "Owners manage their dogs" on public.dogs
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners manage their training sessions" on public.training_sessions
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.dogs d
      where d.id = dog_id and d.owner_id = (select auth.uid())
    )
  );
