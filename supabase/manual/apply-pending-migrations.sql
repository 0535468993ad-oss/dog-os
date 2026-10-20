-- Dog OS: every migration after 20261018000000_init, in order, as ONE transaction.
-- Paste into Supabase Dashboard -> SQL Editor -> Run. If any statement fails, nothing is applied.
-- Generated 2026-10-19 from supabase/migrations/ (the CLI ignores this folder). Safe to delete after running.

begin;

-- ================================================================================================
-- 20261018120000_core_schema.sql
-- ================================================================================================
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

-- ================================================================================================
-- 20261018120100_seed_training_modules.sql
-- ================================================================================================
-- Training Academy catalog content (Hebrew). Idempotent: re-running leaves existing rows untouched.

insert into public.training_modules (id, title, summary, category, difficulty, estimated_minutes, tips, sort_order) values
('name-recognition', 'תגובה לשם', 'מלמדים את הכלב שהשם שלו אומר ״הסתכל עליי, משהו טוב עומד לקרות״ – הבסיס לכל אימון.', 'basics', 'beginner', 5,
  array['אל תשתמשו בשם כדי לנזוף – הוא צריך להישאר אות חיובי.', 'אמרו את השם פעם אחת בלבד; חזרה מלמדת את הכלב להתעלם.', 'אמנו בסביבה שקטה לפני שעוברים לחוץ.'], 10),
('sit', 'שב', 'הפקודה הראשונה והקלה ביותר – דרך מצוינת ללמד את הכלב שהתנהגות רגועה משתלמת.', 'basics', 'beginner', 10,
  array['אל תלחצו על האחוריים של הכלב – תנו לו להבין לבד.', 'אימונים קצרים של 3–5 דקות עדיפים על אימון ארוך אחד.', 'בקשו ״שב״ לפני דברים שהכלב רוצה: אוכל, יציאה, משחק.'], 20),
('down', 'ארצה', 'שכיבה על הבטן לפי בקשה – בסיס לרגיעה, להמתנה ולשליטה עצמית.', 'obedience', 'beginner', 10,
  array['משטח רך (שטיח, מזרן) מקל על כלבים שלא אוהבים לשכב על רצפה קרה.', 'אם הכלב קם – פשוט התחילו מחדש בלי תגובה שלילית.'], 30),
('stay', 'הישאר', 'הכלב נשאר במקום עד שמשחררים אותו. בונים בהדרגה לפי שלושת ה-D: משך, מרחק והסחות דעת.', 'obedience', 'intermediate', 15,
  array['העלו רק פרמטר אחד בכל פעם – משך, מרחק או הסחה.', 'תמיד שחררו במילת שחרור (״חופשי״) – אחרת הכלב מחליט לבד מתי לקום.', 'אם הכלב נכשל פעמיים ברצף – חזרו שלב אחורה.'], 40),
('recall', 'בוא', 'קריאה אמינה היא כלי הבטיחות החשוב ביותר. המטרה: הכלב בוחר לרוץ אליכם גם כשיש הסחות.', 'obedience', 'intermediate', 15,
  array['לעולם אל תקראו לכלב כדי לעשות משהו שהוא לא אוהב (רחצה, סוף טיול).', 'השתמשו בחטיף ״על״ שמופיע רק באימוני קריאה.', 'ברחו מהכלב במקום לרדוף אחריו – כלבים אוהבים לרדוף.'], 50),
('leave-it', 'עזוב', 'מלמדים את הכלב לוותר על משהו שהוא רוצה – בטיחות מול אוכל ברחוב, חפצים מסוכנים ובעלי חיים.', 'behavior', 'intermediate', 10,
  array['הפרס תמיד מגיע מהיד השנייה, לא מהחפץ ש״עזבנו״.', 'התחילו עם חפץ משעמם ועלו בהדרגה לפיתויים מעניינים יותר.'], 60),
('loose-leash', 'הליכה ברצועה רפויה', 'טיול נעים בלי משיכות. הכלב לומד שרצועה רפויה היא מה שמזיז אותו קדימה.', 'leash', 'intermediate', 15,
  array['רתמה עם טבעת קדמית מפחיתה משיכה בזמן שהכלב לומד – אך אינה מחליפה אימון.', 'תנו לכלב זמן לרחרח – זה חלק חשוב מהטיול עבורו.', 'אמנו כשהכלב כבר קצת עייף, לא ברגע שיוצאים מהבית אחרי יום שלם בפנים.'], 70),
('crate-training', 'הרגלה לכלוב', 'הופכים את הכלוב למקום מנוחה בטוח ונעים – עוזר בחינוך לצרכים, בנסיעות ובביקורים אצל הווטרינר.', 'puppy', 'beginner', 10,
  array['לעולם אל תשתמשו בכלוב כעונש.', 'גורים צריכים יציאה לצרכים בתדירות גבוהה – אל תשאירו אותם סגורים מעבר ליכולתם.', 'כלב שמייבב בכלוב – חזרו שלב אחורה, אל תכריחו.'], 80),
('house-training', 'חינוך לצרכים', 'שגרה, השגחה ופרס בזמן הנכון – כך הגור לומד איפה עושים צרכים.', 'puppy', 'beginner', 10,
  array['גורים צריכים לצאת אחרי שינה, אכילה, משחק – וכל 1–2 שעות בהתחלה.', 'ניקוי תאונות בחומר אנזימטי מונע מהגור לחזור לאותה נקודה.', 'אל תענישו על תאונה – זה מלמד את הגור להסתתר כשהוא עושה צרכים.'], 90),
('paw', 'תן כף', 'טריק כיפי שבונה קשר ומלמד את הכלב ״לחשוב״ ולהציע התנהגויות.', 'tricks', 'beginner', 5,
  array['תגמלו בהתחלה גם תזוזה קטנה של הכף.', 'טריקים הם דרך מצוינת לשבור שגרה ולהעשיר כלב משועמם.'], 100),
('settle', 'רגיעה על מזרן', 'מזרן שהוא ״מקום הרגיעה״ – הכלב לומד לשכב עליו ולהירגע, בבית, בבית קפה או אצל חברים.', 'behavior', 'intermediate', 10,
  array['תגמלו בשקט ובאיטיות – המטרה היא רוגע, לא התרגשות.', 'קחו את המזרן לכל מקום חדש – הוא הופך ל״עוגן״ מוכר.'], 110)
on conflict (id) do nothing;

insert into public.training_module_steps (module_id, position, title, instructions) values
('name-recognition', 1, 'הכנה', 'הכינו 10 חטיפים קטנים וטעימים. עמדו קרוב לכלב בחדר שקט.'),
('name-recognition', 2, 'שם = פרס', 'אמרו את שם הכלב בטון שמח ותנו חטיף מיד – גם אם הוא לא הסתכל. חזרו 10 פעמים.'),
('name-recognition', 3, 'מחכים למבט', 'כשהכלב מסתכל לצד אחר, אמרו את שמו פעם אחת. ברגע שהוא מסתכל עליכם – ״יס!״ וחטיף.'),
('name-recognition', 4, 'מוסיפים מרחק והסחות', 'נסו מחדר אחר, בזמן שהכלב מרחרח, ולבסוף בחצר או בטיול. הורידו בהדרגה את כמות החטיפים.'),

('sit', 1, 'פיתוי', 'החזיקו חטיף צמוד לאף הכלב והרימו אותו לאט מעל ראשו לכיוון הגב. כשהראש עולה – האחוריים יורדים.'),
('sit', 2, 'סימון ופרס', 'ברגע שהישבן נוגע ברצפה אמרו ״יס!״ (או לחצו קליקר) ותנו את החטיף. חזרו 5–10 פעמים.'),
('sit', 3, 'מעלימים את החטיף', 'עשו את אותה תנועת יד בלי חטיף ביד. תגמלו מהיד השנייה אחרי שהכלב יושב.'),
('sit', 4, 'מוסיפים מילה', 'אמרו ״שב״ פעם אחת לפני תנועת היד. עם הזמן הקטינו את התנועה עד שהמילה מספיקה.'),
('sit', 5, 'הכללה', 'תרגלו בחדרים שונים, בחוץ, ובזמן שיש הסחות קלות. כלבים לא מכלילים אוטומטית – כל מקום חדש הוא ״שיעור חדש״.'),

('down', 1, 'מתחילים מישיבה', 'בקשו מהכלב לשבת. החזיקו חטיף צמוד לאף.'),
('down', 2, 'פיתוי לרצפה', 'הורידו את החטיף לאט ישר למטה בין כפות הרגליים, ואז משכו מעט קדימה על הרצפה. ברגע שהמרפקים נוגעים – סמנו ותגמלו.'),
('down', 3, 'בלי חטיף ביד', 'חזרו על תנועת היד בלי חטיף ותגמלו מהיד השנייה.'),
('down', 4, 'מוסיפים מילה', 'אמרו ״ארצה״ לפני התנועה, ובהדרגה הקטינו את תנועת היד.'),

('stay', 1, 'שנייה אחת', 'כלב בישיבה או שכיבה. אמרו ״הישאר״, חכו שנייה, סמנו ותגמלו בעודו במקום. שחררו ב״חופשי״.'),
('stay', 2, 'משך', 'העלו את זמן ההמתנה בהדרגה: 2, 3, 5, 10 שניות. תגמלו לסירוגין גם באמצע ההמתנה.'),
('stay', 3, 'מרחק', 'חזרו לזמן קצר וקחו צעד אחד אחורה. חזרו לכלב, תגמלו, שחררו. הוסיפו צעדים בהדרגה.'),
('stay', 4, 'הסחות', 'חזרו למרחק וזמן קצרים, והוסיפו הסחה קלה: קפיצה במקום, כדור שמתגלגל, דפיקה בדלת.'),
('stay', 5, 'שילוב', 'שלבו בהדרגה משך, מרחק והסחות יחד. אם הכלב נכשל – זה סימן שהעליתם מהר מדי.'),

('recall', 1, 'בונים מילה טעונה', 'בבית, אמרו את מילת הקריאה (״בוא!״) ותנו מיד חטיף מעולה. חזרו 10 פעמים בכמה אימונים – עוד לפני שמבקשים מהכלב לזוז.'),
('recall', 2, 'משחק מרחקים קצרים', 'כשהכלב במרחק 1–2 מטרים, קראו פעם אחת וזוזו אחורה בהתלהבות. כשהוא מגיע – אחזו בעדינות בקולר, תגמלו בשפע ושחררו.'),
('recall', 3, 'בין שני אנשים', 'שני אנשים בחדר קוראים לכלב לסירוגין. כל הגעה = מסיבה.'),
('recall', 4, 'בחוץ עם רצועה ארוכה', 'השתמשו ברצועה ארוכה (5–10 מ׳) במקום פתוח. קראו כשהכלב לא מוסח מדי ותגמלו בגדול.'),
('recall', 5, 'מול הסחות', 'בהדרגה קראו גם כשיש הסחות – תחילה קלות, אחר כך קשות יותר. תגמלו לפעמים בשחרור חזרה להסחה עצמה (״לך לרחרח!״).'),

('leave-it', 1, 'יד סגורה', 'החזיקו חטיף ביד סגורה מול הכלב. הוא ילקק ויסה – חכו. ברגע שהוא מתרחק מהיד, סמנו ותגמלו מהיד השנייה.'),
('leave-it', 2, 'מוסיפים מילה', 'כשהכלב מתרחק מיד מהיד הסגורה, אמרו ״עזוב״ רגע לפני שמציגים אותה.'),
('leave-it', 3, 'יד פתוחה', 'עכשיו החזיקו את החטיף ביד פתוחה, מוכנים לסגור אם הכלב מתקרב. תגמלו על התרחקות.'),
('leave-it', 4, 'על הרצפה', 'הניחו חטיף על הרצפה וכסו אותו בכף הרגל לפי הצורך. תגמלו על מבט אליכם במקום אל החטיף.'),
('leave-it', 5, 'בטיול', 'פזרו מראש ״פיתויים״ בטוחים במסלול וצאו עם רצועה. אמרו ״עזוב״ לפני שהכלב מגיע אליהם ותגמלו על ויתור.'),

('loose-leash', 1, 'מקום הפרס', 'בחרו צד (למשל שמאל) ותגמלו את הכלב שוב ושוב כשהוא עומד לידכם בגובה הירך. זה ה״אזור המשתלם״.'),
('loose-leash', 2, 'צעד–פרס', 'צעדו צעד אחד; אם הרצועה רפויה – תגמלו בצד שבחרתם. העלו בהדרגה ל-2, 3, 5 צעדים בין פרסים.'),
('loose-leash', 3, 'רצועה מתוחה = עוצרים', 'ברגע שהרצועה נמתחת – עצרו במקום. כשהכלב חוזר אליכם או מרפה – סמנו, תגמלו והמשיכו ללכת.'),
('loose-leash', 4, 'שינויי כיוון', 'כשהכלב מקדים אתכם, הסתובבו בעליזות לכיוון ההפוך ותגמלו כשהוא מצטרף.'),
('loose-leash', 5, 'הסחות אמיתיות', 'תרגלו ברחובות שקטים, ואז בהדרגה במקומות עמוסים יותר. הרבו בפרסים בתחילת כל סביבה חדשה.'),

('crate-training', 1, 'הכלוב כמקום טוב', 'השאירו את הכלוב פתוח עם שמיכה נעימה. זרקו לתוכו חטיפים במהלך היום ותנו לכלב להיכנס ולצאת בחופשיות.'),
('crate-training', 2, 'ארוחות בכלוב', 'הגישו את הארוחות בתוך הכלוב, בהתחלה ליד הפתח ובהדרגה בעומק.'),
('crate-training', 3, 'סוגרים לרגע', 'בזמן שהכלב אוכל או לועס צעצוע לעיסה, סגרו את הדלת לכמה שניות ופתחו לפני שהוא מסיים.'),
('crate-training', 4, 'מאריכים בהדרגה', 'העלו את הזמן לדקות, ואז צאו מהחדר לזמן קצר. חזרו בשקט, בלי טקס.'),

('house-training', 1, 'שגרה קבועה', 'הוציאו את הגור לאותה נקודה אחרי שינה, אכילה ומשחק, ובכל 1–2 שעות. ארוחות בשעות קבועות.'),
('house-training', 2, 'פרס במקום', 'כשהגור מסיים לעשות צרכים במקום הנכון – שבחו בשקט ותנו חטיף מיד, שם, לא כשחוזרים הביתה.'),
('house-training', 3, 'השגחה', 'כשאתם לא יכולים להשגיח – השתמשו בכלוב או באזור קטן ובטוח. שימו לב לסימנים: רחרוח, הסתובבות במעגלים.'),
('house-training', 4, 'תאונות', 'אם תפסתם באמצע – הפסיקו בעדינות והוציאו מיד החוצה. נקו בחומר אנזימטי. בלי עונש.'),

('paw', 1, 'חטיף ביד סגורה', 'כלב בישיבה. החזיקו חטיף ביד סגורה בגובה החזה שלו. רוב הכלבים ינסו ״לחפור״ ביד עם הכף.'),
('paw', 2, 'מסמנים כל כף', 'ברגע שהכף נוגעת ביד – ״יס!״ ופתחו את היד. חזרו כמה פעמים.'),
('paw', 3, 'יד פתוחה', 'הושיטו יד פתוחה וריקה ותגמלו מהיד השנייה כשהכף נוחתת עליה.'),
('paw', 4, 'מוסיפים מילה', 'אמרו ״תן כף״ לפני שמושיטים את היד.'),

('settle', 1, 'כל מגע = פרס', 'הניחו מזרן על הרצפה. תגמלו כל פעם שהכלב מסתכל עליו, מתקרב אליו או דורך עליו.'),
('settle', 2, 'ארבע כפות', 'תגמלו רק כשכל הגוף על המזרן, אחר כך רק על ישיבה ולבסוף על שכיבה – הניחו את הפרס בין הכפות.'),
('settle', 3, 'סימני רגיעה', 'תגמלו בשקט על סימני הרפיה: ראש על הכפות, ישיבה על ירך אחת, אנחה.'),
('settle', 4, 'משך ומקומות חדשים', 'הגדילו בהדרגה את הזמן בין פרסים, ואז קחו את המזרן לבית קפה, לחברים או למשרד.')
on conflict (module_id, position) do nothing;

-- ================================================================================================
-- 20261018120200_training_knowledge_base.sql
-- ================================================================================================
-- Training Encyclopedia: a shared, read-only knowledge base of methodologies, behavioral issues, core skills,
-- puppy foundations and working-dog skills, plus per-user bookmarks. Content is Hebrew.

create type public.knowledge_category as enum (
  'methodology', 'behavioral_issue', 'core_command', 'puppy_foundation', 'working_skill'
);

create type public.training_method as enum (
  'classical_conditioning', 'operant_conditioning', 'positive_reinforcement', 'clicker_training',
  'lima', 'ethology', 'cognitive_science', 'desensitization'
);

create table public.training_knowledge_base (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  category public.knowledge_category not null,
  methods public.training_method[] not null default '{}',
  title text not null,
  summary text not null,
  historical_context text not null default '',
  principles text not null default '',
  -- [{ "title": string, "body": string }]
  steps jsonb not null default '[]' check (jsonb_typeof(steps) = 'array'),
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  practical_tips text[] not null default '{}',
  related_module_ids text[] not null default '{}',
  reading_minutes integer not null default 5 check (reading_minutes > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index training_knowledge_base_category_idx on public.training_knowledge_base (category, sort_order);

create table public.knowledge_bookmarks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  article_id text not null references public.training_knowledge_base (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.training_knowledge_base enable row level security;
alter table public.knowledge_bookmarks enable row level security;

create policy "training_knowledge_base_read" on public.training_knowledge_base
  for select to authenticated using (true);

create policy "knowledge_bookmarks_select_own" on public.knowledge_bookmarks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "knowledge_bookmarks_insert_own" on public.knowledge_bookmarks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "knowledge_bookmarks_delete_own" on public.knowledge_bookmarks
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.training_knowledge_base, public.knowledge_bookmarks from anon;
grant select on table public.training_knowledge_base to authenticated;
grant select, insert, delete on table public.knowledge_bookmarks to authenticated;

-- ============================================================================
-- Content
-- ============================================================================

insert into public.training_knowledge_base
  (id, category, methods, title, summary, historical_context, principles, steps, pros, cons, practical_tips, related_module_ids, reading_minutes, sort_order)
values

-- ---------------------------------------------------------------- Methodologies
('history-of-dog-training', 'methodology', '{operant_conditioning,positive_reinforcement}',
 'מכפייה למדע: תולדות אילוף הכלבים',
 'איך עבר אילוף הכלבים משיטות מבוססות כוח ועונש לאימון מבוסס מדע ולמידה, ולמה זה משנה לכלב שלכם.',
 'בתחילת המאה ה-20 התבסס האילוף בעיקר על צרכים צבאיים ומשטרתיים. ספרו של קונרד מוסט (1910) הציג שיטה שבה עונש פיזי ופרס שולבו יחד. באמצע המאה הפכה שיטת ויליאם קוהלר, שהתבססה על תיקוני רצועה חזקים, לסטנדרט בארה״ב. בשנות ה-70 וה-80 התפשטה תיאוריית ״הדומיננטיות״ וה״אלפא״, שנשענה על תצפיות בזאבים בשבי. דייוויד מק, שפרסם את מונח ה״אלפא״, הראה ב-1999 שבלהקות טבעיות מדובר בפשטות במשפחה – הורים וצאצאיהם – ותיקן את טעותו. במקביל, תלמידי סקינר קלר ומריאן ברלנד הוכיחו כבר משנות ה-40 שאפשר לאלף אלפי בעלי חיים בעזרת חיזוק בלבד, וקרן פרייור ואיאן דנבר הביאו את הגישה לבעלי הכלבים בשנות ה-80.',
 'האילוף המודרני מבוסס על מדע הלמידה: כלבים עושים מה שמשתלם להם, ופחד או כאב פוגעים ביכולת ללמוד וביחסים עם האדם. מחקרים השוואתיים (למשל Hiby ועמיתיו, 2004; Vieira de Castro ועמיתיה, 2020) מצאו ששיטות מבוססות עונש קשורות ליותר סימני לחץ ובעיות התנהגות, ולא לצייתנות טובה יותר.',
 '[{"title":"שאלו מה הכלב מקבל","body":"כל התנהגות שחוזרת על עצמה משתלמת לכלב בדרך כלשהי. לפני שמנסים לעצור התנהגות – הבינו מה היא נותנת לו."},
   {"title":"החליפו את ״לא״ ב״כן, תעשה את זה״","body":"במקום להעניש קפיצה, למדו ישיבה לברכה ותגמלו אותה. התנהגות חלופית שמשתלמת יותר תחליף את הישנה."},
   {"title":"נהלו את הסביבה","body":"מנעו מהכלב לתרגל את ההתנהגות הלא רצויה בזמן שאתם מלמדים חלופה – שער, רצועה, אחסון אוכל."},
   {"title":"בחרו מאמן בזהירות","body":"חפשו מאמנים שמתארים את השיטות שלהם בשקיפות ונמנעים מקולרי חנק, דוקרנים וחשמל."}]',
 array['שיטות מבוססות חיזוק יעילות לפחות כמו שיטות עונש ופוגעות פחות ברווחת הכלב.', 'הבנת ההיסטוריה עוזרת לזהות עצות מיושנות שעדיין מסתובבות ברשת.'],
 array['עצות מבוססות ״דומיננטיות״ עדיין נפוצות מאוד ועלולות לבלבל.', 'מעבר לשיטות חדשות דורש מהבעלים סבלנות ועקביות.'],
 array['כשמישהו מסביר בעיה ב״הכלב מנסה לשלוט בך״ – חפשו הסבר אחר.', 'נהמה היא תקשורת, לא חוצפה. עונש על נהמה עלול להוביל לנשיכה ללא אזהרה.'],
 '{}', 6, 10),

('classical-conditioning', 'methodology', '{classical_conditioning,desensitization}',
 'התניה קלאסית (פבלובית)',
 'למידה של קשר בין שני אירועים: הכלב לומד שגירוי מסוים מנבא משהו – ורגשותיו כלפי הגירוי משתנים בהתאם.',
 'איוון פבלוב, פיזיולוג רוסי שזכה בפרס נובל ב-1904 על מחקריו במערכת העיכול, הבחין שכלבי המעבדה שלו מתחילים להפריש רוק עוד לפני שהאוכל מגיע – למשל למשמע צעדי העוזר. בסדרת ניסויים הראה שגירוי ניטרלי (כמו צליל) שמופיע שוב ושוב רגע לפני אוכל הופך בעצמו לגורם להפרשת רוק. מכאן נולד המושג ״התניה קלאסית״, שהפך לאבן יסוד בפסיכולוגיה.',
 'התניה קלאסית עוסקת בתגובות לא רצוניות – רגשות ותגובות גופניות. הכלב לא ״מחליט״ לשמוח כשהוא שומע את הרצועה; הוא למד שהרצועה מנבאת טיול. אותו עיקרון פועל גם לרעה: אם וטרינר מנבא כאב, הכלב יפחד מהמרפאה. התניה נגדית (Counter-conditioning) משתמשת בעיקרון כדי לשנות רגש: מצמידים את הגירוי המפחיד, בעוצמה נמוכה, לדבר נפלא. הסדר חשוב: הגירוי קודם, הפרס אחריו.',
 '[{"title":"זהו את הגירוי","body":"מה מעורר את התגובה? כלב אחר, מכונת שיער, צלצול בדלת. רשמו גם את העוצמה שבה הכלב עדיין רגוע."},
   {"title":"עבדו מתחת לסף","body":"הציגו את הגירוי בעוצמה שבה הכלב שם לב אליו אבל עדיין מסוגל לאכול ולהגיב אליכם (מרחק גדול, עוצמה נמוכה)."},
   {"title":"גירוי ואז פרס","body":"ברגע שהכלב רואה או שומע את הגירוי – תנו חטיף מעולה. כשהגירוי נעלם – הפרסים נעצרים."},
   {"title":"חפשו את ״הסיבוב״","body":"הסימן להצלחה: הכלב רואה את הגירוי ומסתובב אליכם בציפייה. זה הרגע להתקרב מעט."},
   {"title":"התקדמו לאט","body":"העלו עוצמה רק כשהכלב רגוע לגמרי ברמה הנוכחית. נסיגה זמנית היא טבעית."}]',
 array['משנה את הרגש שמאחורי ההתנהגות, ולא רק את ההתנהגות עצמה.', 'לא דורש מהכלב לבצע שום פקודה – מתאים גם לכלבים מפוחדים מאוד.', 'הבסיס לטיפול בפחדים, תגובתיות וחרדות.'],
 array['דורש זמן ועקביות – לרוב שבועות עד חודשים.', 'חשיפה בעוצמה גבוהה מדי עלולה דווקא להגביר פחד.'],
 array['השתמשו בחטיף ששמור רק לאימונים האלה, כדי שיהיה בעל ערך גבוה במיוחד.', 'כלב שמסרב לאכול נמצא מעל הסף – הגדילו מרחק.', 'התניה קלאסית קורית כל הזמן, גם כשלא מתכוונים. שימו לב מה מנבאים לכלב.'],
 '{}', 6, 20),

('operant-conditioning', 'methodology', '{operant_conditioning}',
 'התניה אופרנטית: ארבעת הרביעים',
 'הכלב לומד מתוצאות מעשיו: התנהגות שמובילה לתוצאה טובה מתחזקת, והתנהגות שמובילה לתוצאה רעה נחלשת.',
 'אדוארד תורנדייק ניסח ב-1898 את ״חוק האפקט״ לאחר שצפה בחתולים שלמדו לצאת מ״קופסאות פאזל״ בניסוי וטעייה. ב.פ. סקינר הרחיב את הרעיון בשנות ה-30, תכנן את ״תיבת סקינר״ – תא מבוקר שבו בעל חיים לוחץ על דוושה ומקבל אוכל – ופרסם ב-1938 את ״התנהגות האורגניזמים״. סקינר תיאר בצורה שיטתית כיצד תזמון, תדירות וסוג התוצאה משפיעים על הלמידה.',
 'המונחים טכניים: ״חיזוק״ מגביר התנהגות ו״עונש״ מחליש אותה. ״חיובי״ פירושו מוסיפים משהו, ו״שלילי״ – מורידים משהו. כך נוצרים ארבעה רביעים: חיזוק חיובי (R+) – מוסיפים חטיף כשהכלב יושב; עונש שלילי (P-) – מפסיקים משחק כשהכלב נושך; חיזוק שלילי (R-) – מרפים לחץ ברצועה כשהכלב מתקרב; עונש חיובי (P+) – מוסיפים משהו לא נעים, כמו משיכה ברצועה. גישות מודרניות מתבססות בעיקר על R+ ו-P- ונמנעות מ-R- ו-P+ ככל האפשר, בגלל תופעות הלוואי הרגשיות.',
 '[{"title":"הגדירו התנהגות מדידה","body":"״להיות טוב״ איננה התנהגות. ״ארבע כפות על הרצפה כשמישהו נכנס״ – כן."},
   {"title":"תזמנו נכון","body":"התוצאה צריכה להגיע בתוך שנייה–שתיים. סמן (״יס!״ או קליקר) עוזר לגשר על הפער."},
   {"title":"חיזוק רציף ואז משתנה","body":"בהתחלה תגמלו כל הצלחה. כשההתנהגות יציבה עברו לחיזוק משתנה – הוא יוצר התנהגות עמידה יותר."},
   {"title":"הכירו את ״פרץ הכיבוי״","body":"כשמפסיקים לחזק התנהגות (למשל נביחה לתשומת לב) היא מתגברת לזמן קצר לפני שהיא דועכת. אל תוותרו באמצע."}]',
 array['מסגרת מדעית מוכחת שמסבירה כמעט כל התנהגות נלמדת.', 'מאפשרת ללמד התנהגויות מורכבות בצעדים קטנים (עיצוב – Shaping).'],
 array['קל לחזק בטעות התנהגויות לא רצויות (למשל לשים לב לכלב רק כשהוא נובח).', 'שימוש בעונש חיובי עלול לגרום לפחד, תוקפנות ופגיעה בקשר.'],
 array['שאלו את עצמכם בכל אינטראקציה: מה הכלב מקבל כרגע?', '״שלילי״ לא אומר ״רע״, ו״חיובי״ לא אומר ״טוב״ – אלה מונחים מתמטיים.'],
 '{sit,down}', 7, 30),

('positive-reinforcement', 'methodology', '{positive_reinforcement,operant_conditioning}',
 'חיזוק חיובי (R+)',
 'מוסיפים משהו שהכלב אוהב מיד אחרי התנהגות רצויה, כדי שהיא תחזור. זו הגישה המומלצת היום על ידי ארגוני הרפואה הווטרינרית ההתנהגותית.',
 'קלר ומריאן ברלנד, תלמידיו של סקינר, הקימו ב-1947 את Animal Behavior Enterprises ואילפו לאורך השנים אלפי בעלי חיים מעשרות מינים בעזרת חיזוק. בוב ביילי הצטרף אליהם ותרם לפיתוח השיטה. בשנות ה-80 פרסמה קרן פרייור, מאלפת דולפינים, את הספר ״Don''t Shoot the Dog״, ואיאן דנבר, וטרינר והתנהגותן, הקים שיעורי גורים מבוססי חטיפים. מאז הפכה הגישה לזרם המרכזי.',
 'חיזוק מוגדר לפי השפעתו: אם ההתנהגות לא מתחזקת – מה שנתתם לא היה חיזוק עבור הכלב הזה ברגע הזה. מחזקים יכולים להיות אוכל, משחק, ליטוף, שבח, גישה לרחרוח או שחרור לחצר (עיקרון פרמק: התנהגות שהכלב רוצה לעשות יכולה לחזק התנהגות פחות מועדפת). קנו התנהגויות רצויות לפני שהבעיה מופיעה, וחשבו על ״מה כן״ במקום ״מה לא״.',
 '[{"title":"בנו רשימת מחזקים","body":"דרגו 10 דברים שהכלב אוהב, מ״נחמד״ ועד ״מושלם״. השתמשו בחזקים ביותר למשימות הקשות."},
   {"title":"קטן, רך ומהיר","body":"חטיפים בגודל אפונה שנבלעים מהר שומרים על קצב ומונעים עודף קלוריות. נכו מהמנה היומית."},
   {"title":"תפסו את הרגע","body":"״ללכוד״ התנהגות: תגמלו כל פעם שהכלב שוכב בשקט, גם כשלא ביקשתם."},
   {"title":"העבירו לחיים האמיתיים","body":"בהדרגה שלבו מחזקים יומיומיים – דלת שנפתחת, כדור, רחרוח – במקום חטיפים."}]',
 array['בונה כלב שמציע התנהגויות בשמחה ובביטחון.', 'משפר את הקשר בין הכלב לבעלים.', 'נתמך במחקר כיעיל ובטוח יותר משיטות מבוססות עונש.'],
 array['דורש תכנון: מה מתגמלים, מתי ואיך.', 'בתחילה יש צורך בהרבה חטיפים, עד שההתנהגות מתבססת.'],
 array['אם הכלב ״עובד רק כשיש אוכל״ – כנראה שהפרסים הוצגו לפני ההתנהגות כשוחד. החזיקו אותם מחוץ לטווח הראייה.', 'סיימו כל אימון בהצלחה ובעוד הכלב רוצה עוד.'],
 '{sit,paw}', 6, 40),

('clicker-training', 'methodology', '{clicker_training,positive_reinforcement,operant_conditioning}',
 'אימון קליקר וסמנים',
 'צליל קצר וחד (קליקר או מילה כמו ״יס!״) מסמן לכלב בדיוק איזו התנהגות הרוויחה פרס.',
 'מאלפי יונקים ימיים בשנות ה-60 וה-70 השתמשו בשריקה כ״גשר״ – הדולפין שמע שהוא צדק גם כשהיה רחוק מהמאלף. קרן פרייור וגארי וילקס הביאו את הקליקר, צעצוע מתכת פשוט, לעולם הכלבים בתחילת שנות ה-90, והוא הפך לסמל של אימון מבוסס חיזוק.',
 'הסמן הוא ״צילום רגע״: הוא מסמן את ההתנהגות בדיוק כשהיא קורית, והפרס יכול להגיע שנייה אחרי. כך אפשר ללמד התנהגויות שקשה לתגמל בזמן (למשל קפיצה או מבט). הקליקר עובד כי הוא הופך לגירוי מותנה – התניה קלאסית – שמנבא פרס. סמן מילולי נוח יותר כשהידיים עסוקות, וקליקר עקבי יותר בצליל.',
 '[{"title":"״טעינת״ הסמן","body":"קליק – חטיף, 10–15 פעמים, בלי לבקש דבר. הכלב לומד שהצליל מנבא אוכל."},
   {"title":"קליק אחד = פרס אחד","body":"תמיד תנו פרס אחרי קליק, גם אם לחצתם בטעות. אחרת הסמן מאבד ערך."},
   {"title":"עיצוב (Shaping)","body":"סמנו צעדים קטנים לקראת המטרה: מבט למזרן, צעד אליו, כף עליו – עד שכיבה מלאה."},
   {"title":"קליק מסיים את ההתנהגות","body":"אחרי הקליק הכלב משוחרר לקבל את הפרס. להתנהגויות ממושכות סמנו בסוף או השתמשו בפרס תוך כדי."}]',
 array['תזמון מדויק מאוד – למידה מהירה יותר.', 'מאפשר לעצב התנהגויות מורכבות בלי מגע פיזי.', 'מעודד כלבים ״לחשוב״ ולהציע התנהגויות.'],
 array['דורש קואורדינציה של ידיים בהתחלה.', 'הצליל עלול להבהיל כלבים רגישים לרעש – אפשר לעמעם או להשתמש במילה.'],
 array['התאמנו על התזמון בלי הכלב: לחצו כשכדור טניס נוגע ברצפה.', 'הקליקר הוא כלי לימוד; כשההתנהגות נלמדה – אין צורך בו יותר.'],
 '{paw,settle}', 5, 50),

('lima-force-free', 'methodology', '{lima,positive_reinforcement}',
 'LIMA וגישת Force-Free',
 'LIMA – Least Intrusive, Minimally Aversive: לבחור תמיד בהתערבות הכי פחות פולשנית והכי פחות מרתיעה שעדיין יעילה.',
 'ד״ר סוזן פרידמן, פסיכולוגית התנהגות, ניסחה את ״ההיררכיה ההומנית״ – סדר עדיפויות להתערבויות בשינוי התנהגות. ארגונים מקצועיים כמו IAABC ו-CCPDT אימצו את עקרונות LIMA כחלק מקוד האתיקה שלהם, ואגודת הווטרינרים לרפואה התנהגותית של ארה״ב (AVSAB) ממליצה על שיטות מבוססות חיזוק ונגד שימוש בעונש פיזי ובציוד מרתיע.',
 'ההיררכיה ההומנית, מלמטה למעלה: (1) בריאות, תזונה וסביבה פיזית – האם יש כאב או בעיה רפואית? (2) סידורי סביבה ומניעה – לשנות את מה שקורה לפני ההתנהגות. (3) חיזוק חיובי. (4) חיזוק דיפרנציאלי של התנהגות חלופית. (5) רק אם אלה לא עובדים: עונש שלילי, חיזוק שלילי או כיבוי. (6) עונש חיובי – רק כמוצא אחרון, אם בכלל. Force-Free מתאר מאמנים שמוותרים לחלוטין על כוח, כאב ופחד.',
 '[{"title":"התחילו בבדיקה רפואית","body":"שינוי התנהגות פתאומי, נהמה במגע או תאונות בבית הם לעתים סימן לכאב או מחלה."},
   {"title":"שנו את הסביבה","body":"וילון על החלון מפחית נביחות; שער מונע שוטטות; צעצוע לעיסה מפנה אנרגיה."},
   {"title":"למדו חלופה","body":"החליטו מה הכלב צריך לעשות במקום, ותגמלו את זה בשפע."},
   {"title":"בדקו שוב","body":"אם אין התקדמות – חזרו למטה בהיררכיה לפני שמטפסים למעלה. לרוב חסר ניהול או שהקריטריון גבוה מדי."}]',
 array['שומר על רווחת הכלב ועל האמון בבעלים.', 'מכריח את המאמן לחשוב על הסיבה להתנהגות.', 'מתאים לכל כלב, כולל כלבים מפוחדים ותגובתיים.'],
 array['דורש ידע וזמן יותר מ״תיקון״ מהיר.', 'לא כל מי שמשתמש במונח באמת עומד בעקרונות – בררו מה הוא עושה בפועל.'],
 array['שאלו מאמן: ״מה תעשה אם הכלב שלי יעשה את הדבר הלא נכון?״ התשובה מלמדת הרבה.', 'ניהול איננו כישלון – הוא חלק לגיטימי מהתוכנית.'],
 '{}', 6, 60),

('ethology-breed-drives', 'methodology', '{ethology}',
 'אתולוגיה ודחפים אינסטינקטיביים לפי גזע',
 'כל כלב נושא מורשת גנטית של עבודה – רעייה, ציד, שמירה או חברות. הבנת הדחפים האלה מאפשרת לתת להם מוצא בריא במקום להילחם בהם.',
 'האתולוגים קונרד לורנץ וניקו טינברגן (פרס נובל 1973 עם קרל פון פריש) חקרו התנהגות בעלי חיים בסביבתם הטבעית. טינברגן ניסח ארבע שאלות להבנת כל התנהגות: מה מפעיל אותה, איך היא מתפתחת, מה ערכה ההישרדותי ואיך התפתחה אבולוציונית. ריימונד ולורנה קופינגר תיארו את ״רצף הטריפה״ של הכלב – כיוון, נעיצת מבט, התגנבות, מרדף, תפיסה, נשיכת המתה, ביתור ואכילה – והראו שגזעים שונים נבחרו להדגיש או לדכא חלקים שונים ממנו. מחקר גנומי רחב (Morrill ועמיתיה, 2022) מצא שהגזע מסביר רק כ-9% מהשונות בהתנהגות בין כלבים בודדים – כלומר הגזע מנבא נטייה, לא גורל.',
 'כלבי רועים (בורדר קולי, רועה אוסטרלי) מדגישים נעיצת מבט, התגנבות ומרדף – ולכן ״רועים״ ילדים או רודפים אחרי אופניים. טרייריים נבחרו לתפיסה ונשיכה. רטריברים נבחרו לתפיסה ב״פה רך״ והבאה. כלבי שמירה על עדרים נבחרו לרצף טריפה מוחלש מאוד ולחשדנות כלפי זרים. כלבי ריח (ביגל, בלאדהאונד) חיים דרך האף. דחף שלא מקבל מוצא נוטה לצוץ בדרכים לא רצויות.',
 '[{"title":"זהו את המורשת","body":"קראו על המטרה המקורית של הגזע (או הגזעים, בכלב מעורב) ושימו לב מה הכלב שלכם מחפש לעשות כשהוא חופשי."},
   {"title":"מצאו מוצא בטוח","body":"רועים – טרייבבול ומשחקי שליטה; טרייריים – חפירה בארגז חול ומשחקי משיכה; כלבי ריח – חיפוש חטיפים ועבודת אף."},
   {"title":"השתמשו בדחף כפרס","body":"לכלב רועה, הזדמנות לרדוף אחרי צעצוע היא מחזק עוצמתי יותר מחטיף. שלבו אותה באימון."},
   {"title":"נהלו טריגרים","body":"כלב עם דחף מרדף חזק לא ישוחרר ליד כביש או חתולים עד שהקריאה אמינה מאוד."}]',
 array['מסביר התנהגויות ״בעייתיות״ כצרכים טבעיים.', 'מאפשר להתאים פעילות והעשרה לכלב הספציפי.', 'מגביר שביעות רצון ומפחית תסכול.'],
 array['אין לייחס יותר מדי לגזע – כל כלב הוא אינדיבידואל.', 'בכלבים מעורבים קשה לחזות אילו נטיות יבלטו.'],
 array['כלב שמשתעמם הוא לרוב כלב שהדחף שלו לא מקבל מענה, לא כלב ״רע״.', 'עשר דקות של עבודה מותאמת דחף מעייפות יותר משעה של הליכה.'],
 '{}', 7, 70),

('canine-cognition', 'methodology', '{cognitive_science}',
 'מדע הקוגניציה והמוח של הכלב',
 'מה מחקרי מוח והתנהגות מהשנים האחרונות מלמדים אותנו על האופן שבו כלבים חושבים, מבינים אותנו ומרגישים.',
 'בשנות ה-90 החלו מעבדות ייעודיות לחקור כלבי בית: פרויקט ״הכלב המשפחתי״ באוניברסיטת אטווש לוראנד בבודפשט (אדם מיקלושי) ומאוחר יותר מרכז הקוגניציה הכלבית באוניברסיטת דיוק (בריאן הייר). הייר ועמיתיו הראו ב-2002 שכלבים מבינים הצבעה אנושית טוב יותר משימפנזים. גרגורי ברנס פיתח ב-2012 שיטה לסרוק כלבים ערים ב-MRI לאחר שאומנו לשכב בשקט מרצונם, ומצא תגובה במערכת התגמול לאות שמנבא אוכל. ב-2016 הראו אנדיקס ועמיתיו שמוח הכלב מעבד בנפרד את משמעות המילה ואת האינטונציה. כלבה בשם צ׳ייסר למדה את שמותיהם של יותר מ-1,000 צעצועים (פילי וריד, 2011).',
 'הממצאים מצביעים על כמה מסקנות מעשיות: כלבים קוראים את שפת הגוף שלנו טוב מאוד – לעתים טוב יותר מאשר את המילים. טון הדיבור משפיע, אבל מילה עקבית היא שמעבירה את המשמעות. קשר עין הדדי בין כלב לבעליו קשור לעלייה באוקסיטוצין אצל שניהם (Nagasawa ועמיתיו, 2015). מחקרי ״הטיה קוגניטיבית״ מראים שכלבים שאומנו בשיטות מרתיעות מפרשים מצבים עמומים בצורה פסימית יותר.',
 '[{"title":"דברו עם הגוף","body":"תמכו בכל אות מילולי באות גוף עקבי בשלבי הלמידה, ואז העבירו בהדרגה למילה בלבד."},
   {"title":"מילה אחת, משמעות אחת","body":"אל תשתמשו ב״ארצה״ גם ל״רד מהספה״ וגם ל״שכב״. עקביות מקלה על המוח של הכלב."},
   {"title":"העשרה קוגניטיבית","body":"צעצועי חשיבה, למידת שמות צעצועים ומשחקי חיפוש מעייפים את הכלב ומשפרים רווחה."},
   {"title":"מנוחה אחרי למידה","body":"מחקרים מראים ששינה אחרי אימון משפרת זיכרון אצל כלבים. אימון קצר ואז מנוחה."}]',
 array['מבוסס על המחקר העדכני ביותר.', 'מחזק את ההבנה שהכלב הוא שותף חושב ומרגיש.'],
 array['חלק מהממצאים חדשים ועדיין נבדקים במחקרי המשך.', 'יש שונות גדולה בין כלבים בודדים.'],
 array['אם הכלב ״לא מקשיב״ – בדקו אם הגוף שלכם אומר משהו אחר מהמילים.', 'נסו ללמד את הכלב שמות של שני צעצועים ולבקש ״תביא את...״ – זה מאתגר ומהנה.'],
 '{}', 7, 80),

-- ---------------------------------------------------------------- Behavioral issues
('leash-reactivity', 'behavioral_issue', '{desensitization,classical_conditioning,positive_reinforcement}',
 'תגובתיות ברצועה',
 'נביחות, זינוקים ונהמות כלפי כלבים, אנשים או רכבים בזמן טיול. לרוב מקורם בפחד או בתסכול, ולא ב״תוקפנות״.',
 'לסלי מקדוויט הציגה בספרה Control Unleashed (2007) את משחק ״תסתכל על זה״ (LAT), שבו הכלב מקבל פרס על כך שהוא מסתכל על הטריגר ברוגע. גרישה סטיוארט פיתחה את BAT (Behavior Adjustment Training), שמאפשרת לכלב לחקור את הטריגר ממרחק בטוח ולבחור להתרחק. שתי השיטות נשענות על דה-סנסיטיזציה והתניה נגדית.',
 'הרצועה מגבילה את אפשרות הבריחה, ולכן כלב מפוחד בוחר ב״התקפה הטובה ביותר היא הגנה״. כלבים אחרים מתוסכלים מכך שאינם יכולים לגשת. ״הצטברות טריגרים״ (Trigger stacking) גורמת לכלב להגיב חזק יותר ככל שהיום עמוס יותר. העבודה מתבצעת מתחת לסף – במרחק שבו הכלב רואה את הטריגר ועדיין מסוגל לאכול ולהקשיב.',
 '[{"title":"בדיקה וטרינרית","body":"כאב (גב, מפרקים, אוזניים) מוריד את סף הסבלנות. שללו בעיה רפואית."},
   {"title":"ניהול מיידי","body":"טיילו בשעות ובמסלולים שקטים, שמרו מרחק, השתמשו במכוניות חונות כמחסה. כל תגובה היא ״תרגול״ של ההתנהגות."},
   {"title":"מצאו את הסף","body":"זהו את המרחק שבו הכלב מבחין בטריגר אך עדיין רגוע. זה מקום העבודה."},
   {"title":"תסתכל על זה (LAT)","body":"ברגע שהכלב מסתכל על הטריגר – סמנו ותנו פרס. בהדרגה הוא יתחיל להסתכל ולהסתובב אליכם בעצמו."},
   {"title":"צמצמו מרחק בהדרגה","body":"רק כשהכלב רגוע ומסתובב אליכם באופן קבוע, התקרבו מעט. ימי מנוחה חשובים כדי ש״הכוס תתרוקן״."}]',
 array['שיפור ניכר באיכות החיים של הכלב והבעלים.', 'מטפל בסיבה הרגשית ולא רק בסימפטום.'],
 array['תהליך ארוך שדורש עקביות.', 'קשה לשלוט בסביבה העירונית – לכן הניהול קריטי.'],
 array['פנייה בפרסה (U-turn) עליזה היא כלי חירום מצוין – תרגלו אותה בבית.', 'אל תענישו נביחה – זה עלול לדכא את האזהרה ולהגביר את הפחד.', 'כלב תגובתי עם היסטוריה של נשיכה – פנו לאנשי מקצוע מוסמכים.'],
 '{loose-leash,name-recognition}', 8, 110),

('separation-anxiety', 'behavioral_issue', '{desensitization,classical_conditioning}',
 'חרדת נטישה ובעיות הקשורות להיפרדות',
 'מצוקה כשהכלב נשאר לבד: יללות, הרס ליד דלתות, צרכים בבית, ריור. זו תגובת פאניקה – לא נקמה ולא ״חוצפה״.',
 'הטיפול המודרני בחרדת נטישה מבוסס על חשיפה הדרגתית לפרידות קצרות מאוד, מתחת לסף המצוקה. מלנה דמרטיני ומאמנים נוספים פיתחו פרוטוקולים מובנים של ״היעדרויות מדורגות״ המלווים במעקב וידאו. במקרים רבים משולב טיפול תרופתי שרושם וטרינר.',
 'כלב בחרדת נטישה אינו מסוגל ללמוד כשהוא בפאניקה, ולכן כל היעדרות ארוכה מהסף ״מאפסת״ את ההתקדמות. המטרה היא שהכלב לא יחווה פאניקה בכלל בתקופת הטיפול – מה שמחייב פתרונות כמו דוגי-סיטר, גן כלבים או חבר. הכלוב בדרך כלל אינו פתרון ועלול להגביר פאניקה ולגרום לפציעות.',
 '[{"title":"צלמו","body":"הפעילו מצלמה ובדקו מתי מתחילים סימני המצוקה: אחרי 10 שניות? 5 דקות? זה הסף שלכם."},
   {"title":"היעדרויות קצרות מהסף","body":"צאו מהדלת לזמן קצר מהסף וחזרו לפני שהכלב נלחץ. חזרו על כך בשגרה יומית קצרה."},
   {"title":"נטרלו רמזי יציאה","body":"הרימו מפתחות, נעלו נעליים – ואל תצאו. כך הרמזים מאבדים את משמעותם המלחיצה."},
   {"title":"הגדילו בהדרגה","body":"הוסיפו שניות ואז דקות, בלי קפיצות. ימים קלים וימים קשים – זה טבעי."},
   {"title":"התייעצו עם וטרינר","body":"טיפול תרופתי יכול להוריד את רמת החרדה ולאפשר למידה. זה לא ״כישלון״ אלא כלי רפואי."}]',
 array['שיפור משמעותי באיכות החיים של הכלב.', 'שיטה עדינה שאינה מעמידה את הכלב במצוקה.'],
 array['דורשת שינוי בשגרה – לעתים קרובות חודשים.', 'קשה מאוד להימנע לגמרי מהשארת הכלב לבד בתקופת הטיפול.'],
 array['ענישה כשחוזרים הביתה מזיקה – הכלב לא מקשר אותה להרס שקרה שעות קודם.', 'כלב נוסף בבית בדרך כלל אינו פותר חרדת נטישה מבני אדם.'],
 '{crate-training}', 8, 120),

('resource-guarding', 'behavioral_issue', '{classical_conditioning,positive_reinforcement}',
 'שמירה על משאבים',
 'נוקשות, נהמה או נשיכה כשמתקרבים לאוכל, צעצוע, מקום מנוחה או חפץ שהכלב מצא. התנהגות טבעית שאפשר לשנות.',
 'ג׳ין דונלדסון פרסמה ב-2002 את הספר Mine!, שהפך למדריך מרכזי לשינוי שמירה על משאבים באמצעות דה-סנסיטיזציה והתניה נגדית. הרעיון המרכזי: ללמד את הכלב שגישה של אדם למשאב מנבאת משהו טוב, ולא אובדן.',
 'בטבע, שמירה על משאב היא הישרדותית. העצה הישנה ״לקחת את הקערה כדי להראות מי הבוס״ דווקא מאשרת את חששו של הכלב שבני אדם לוקחים. הגישה הנכונה: להוסיף ולא לקחת, ולהחליף ולא לחטוף.',
 '[{"title":"בטיחות קודם","body":"אל תנסו לקחת דבר מכלב שומר. בבית עם ילדים – הפרידו בזמן ארוחות ולעיסות."},
   {"title":"עוברים ומוסיפים","body":"בזמן שהכלב אוכל, עברו ממרחק שבו הוא נינוח וזרקו לקערה חטיף טוב יותר. המשיכו ללכת."},
   {"title":"מצמצמים מרחק","body":"בהדרגה התקרבו, תוך שאתם עוקבים אחר שפת הגוף: האם הוא ממשיך לאכול ברוגע?"},
   {"title":"החלפות","body":"למדו ״תן״: מציעים משהו שווה יותר, הכלב משחרר, מקבל את הפרס – ולעתים קרובות מקבל גם את החפץ בחזרה."}]',
 array['מפחית סיכון לנשיכה במשפחה.', 'בונה אמון: ידיים ליד הקערה = דברים טובים.'],
 array['דורש קריאה טובה של שפת גוף הכלב.', 'מקרים חמורים דורשים ליווי מקצועי.'],
 array['לעולם אל תענישו נהמה. היא האזהרה שמאפשרת לכם להתרחק.', 'שמירה פתאומית על מקום מנוחה יכולה להעיד על כאב – בדקו אצל וטרינר.'],
 '{leave-it}', 6, 130),

('aggression-safety', 'behavioral_issue', '{desensitization,lima}',
 'תוקפנות: הבנה, בטיחות ודרך פעולה',
 'נהמה, הצגת שיניים, הסתערות או נשיכה. התוקפנות היא תקשורת שנועדה להגדיל מרחק, ובדרך כלל נובעת מפחד, כאב או הגנה.',
 'קנדל שפרד תיארה את ״סולם התוקפנות״ – רצף סימנים שמתחיל בפיהוק, הסטת מבט וליקוק שפתיים, ממשיך בהתקשחות, נעיצת מבט ונהמה, ורק בסוף מגיע לנשיכה. כלבים שנענשו על סימני האזהרה עלולים ״לדלג״ ישירות לנשיכה.',
 'הגישה המקצועית מתחילה בבדיקה רפואית מלאה, ממשיכה בניהול סיכונים קפדני, ורק אז בתוכנית שינוי התנהגות. במקרים של נשיכה – יש לפנות לווטרינר המתמחה בהתנהגות או ליועץ התנהגות מוסמך. אילוף זמם (מחסום פה) באופן חיובי הוא כלי בטיחות חשוב.',
 '[{"title":"בדיקה רפואית","body":"כאב, בעיות עור, אוזניים, שיניים ובעיות הורמונליות יכולים לגרום לתוקפנות."},
   {"title":"ניהול","body":"זהו את המצבים המסוכנים ומנעו אותם: שערים, רצועה, הפרדה בזמן ביקורים."},
   {"title":"אילוף זמם","body":"הפכו את הזמם למשהו חיובי: חטיפים בתוכו, הכנסת אף לשנייה, ובהדרגה זמן ארוך יותר."},
   {"title":"איש מקצוע","body":"פנו לווטרינר התנהגותי או ליועץ התנהגות מוסמך לבניית תוכנית מותאמת."}]',
 array['גישה בטוחה שמגנה על אנשים ועל הכלב.', 'מטפלת בשורש הבעיה ולא רק בסימפטום.'],
 array['לא ניתן ״לרפא״ תוקפנות באופן מלא בכל המקרים – הניהול עשוי להיות לכל החיים.', 'דורש מעורבות מקצועית ועלויות.'],
 array['למדו לזהות את הסימנים המוקדמים: התקשחות, ״עין לווייתן״ (לובן העין נראה), ליקוק שפתיים.', 'ילדים וכלבים – תמיד בהשגחה צמודה, גם עם כלב ״שמעולם לא נשך״.'],
 '{}', 7, 140),

-- ---------------------------------------------------------------- Core commands
('reliable-recall-science', 'core_command', '{operant_conditioning,classical_conditioning,positive_reinforcement}',
 'המדע של קריאה אמינה',
 'למה כלבים מתעלמים מ״בוא״, ואיך בונים קריאה שעובדת גם מול חתול או כלב אחר.',
 'עיקרון פרמק, שנוסח בידי דייוויד פרמק ב-1959, קובע שהתנהגות בעלת סבירות גבוהה (למשל לרחרח) יכולה לשמש כחיזוק להתנהגות בעלת סבירות נמוכה (להגיע לבעלים). מאמנים מודרניים משלבים אותו עם התניה קלאסית של מילת הקריאה.',
 'מילת הקריאה צריכה להיות ״טעונה״ – מנבאת תמיד משהו נפלא. כל פעם שקוראים לכלב ומשהו לא נעים קורה (רחצה, סוף משחק), המילה נשחקת. לכן כדאי לשמור מילת חירום נפרדת שאינה נשחקת לעולם.',
 '[{"title":"מילה טעונה","body":"אמרו את המילה ותנו חטיף מעולה, בלי לבקש דבר. עשרות פעמים לאורך שבוע."},
   {"title":"משחקי קריאה","body":"שחקו ״מחבואים״ בבית ו״פינג-פונג״ בין שני אנשים."},
   {"title":"רצועה ארוכה","body":"בחוץ, רצועה של 5–10 מטרים מונעת מהכלב ללמוד שאפשר להתעלם."},
   {"title":"שחרור כפרס","body":"קראו, תגמלו – ושחררו חזרה לשחק. הכלב לומד שהגעה אליכם לא מסיימת את הכיף."}]',
 array['כלי הבטיחות החשוב ביותר.', 'מאפשר לכלב יותר חופש בבטחה.'],
 array['דורש תרגול לאורך כל חיי הכלב.', 'דחף מרדף חזק עלול לגבור גם על קריאה טובה.'],
 array['קראו פעם אחת. אם הכלב לא מגיע – גשו אליו ובפעם הבאה הקלו את המשימה.', 'אל תרדפו אחרי כלב שבורח – זה הופך למשחק.'],
 '{recall}', 5, 210),

('impulse-control', 'core_command', '{operant_conditioning,positive_reinforcement}',
 'שליטה עצמית ודחיית סיפוקים',
 'כלב שמסוגל לחכות – בדלת, מול קערה או מול כדור – הוא כלב בטוח ורגוע יותר.',
 'סוזן גארט פיתחה את המשחק ״It''s Yer Choice״, שבו הכלב לומד שהדרך לקבל חטיף היא לא לנסות לקחת אותו. משחקים כאלה הם חלק מגל של ״חינוך לבחירה״, שבו הכלב לומד לקבל החלטות טובות בעצמו.',
 'שליטה עצמית היא מיומנות נלמדת שמשתפרת עם תרגול – ממש כמו שריר. העיקרון הבסיסי: הדרך המהירה לקבל את מה שאתה רוצה היא להירגע. כך הכלב מקבל אחריות על הבחירה, במקום שנכפה עליו.',
 '[{"title":"יד פתוחה ונסגרת","body":"חטיפים ביד פתוחה; אם הכלב מתקרב – היד נסגרת. כשהוא מתרחק – הוא מקבל חטיף מהיד."},
   {"title":"קערה","body":"הורידו את הקערה לאט. אם הכלב קם – היא עולה. אם הוא נשאר – היא יורדת, ושחרור ״חופשי״."},
   {"title":"דלת","body":"פתחו מעט את הדלת; אם הכלב מתפרץ – היא נסגרת. רק כשהוא מחכה – שחרור לצאת."},
   {"title":"צעצוע","body":"הרימו כדור; הכלב יושב ומחכה; זריקה היא הפרס על ההמתנה."}]',
 array['משפר בטיחות בדלתות ובכבישים.', 'מוריד תסכול והתפרצויות.'],
 array['גורים צעירים זקוקים לאימונים קצרים מאוד.', 'דורש עקביות של כל בני הבית.'],
 array['אל תעמידו את הכלב בפני פיתוי שאינו מסוגל לו – בנו בהדרגה.', 'מילת שחרור (״חופשי״) היא חלק הכרחי מהתרגול.'],
 '{stay,leave-it}', 5, 220),

('loose-leash-principles', 'core_command', '{operant_conditioning,positive_reinforcement}',
 'למה כלבים מושכים – ואיך משנים את זה',
 'משיכה משתלמת לכלב: היא מקדמת אותו לעבר מה שהוא רוצה. משנים את המשוואה כך שרצועה רפויה היא זו שמשתלמת.',
 'בעבר נהוג היה ״לתקן״ משיכה בטלטול רצועה או בקולר חנק. מחקרים הצביעו על נזקים אפשריים לצוואר ולקנה הנשימה מלחץ חוזר, והגישה השתנתה לאימון מבוסס חיזוק ולשימוש ברתמות.',
 'כלבים הולכים מהר יותר מאיתנו ורוצים לרחרח. ״רפלקס ההתנגדות״ גורם לכלב להישען נגד לחץ – ולכן משיכה חזרה מגבירה משיכה קדימה. הדרך: לחזק בשפע את המקום ליד הרגל, ולעצור כשהרצועה נמתחת.',
 '[{"title":"ציוד נכון","body":"רתמה עם טבעת קדמית מקטינה משיכה. הימנעו מציוד שגורם כאב."},
   {"title":"״אזור הזהב״","body":"תגמלו את הכלב שוב ושוב כשהוא בצד שלכם, בגובה הרגל."},
   {"title":"עצירה","body":"רצועה נמתחת = עוצרים. רצועה רפויה = ממשיכים."},
   {"title":"רחרוח כפרס","body":"אחרי כמה צעדים יפים – ״לך לרחרח!״. זה פרס שהכלב באמת רוצה."}]',
 array['טיולים נעימים יותר לשני הצדדים.', 'מגן על צוואר הכלב ועל הכתף שלכם.'],
 array['דורש עקביות מוחלטת – כל משיכה שמצליחה מחזקת את ההרגל.', 'התקדמות איטית בסביבות עמוסות.'],
 array['קבעו ״טיולי אימון״ קצרים ו״טיולי רחרוח״ עם רצועה ארוכה – שניהם חשובים.', 'שימו לב לרגעים שבהם הכלב בוחר להתקרב אליכם – תגמלו אותם.'],
 '{loose-leash}', 5, 230),

('cues-markers-release', 'core_command', '{clicker_training,operant_conditioning}',
 'אותות, סמנים ומילת שחרור',
 'מערכת התקשורת הבסיסית בין כלב לאדם: מה אומרים, מתי, ואיך הכלב יודע שסיים.',
 'מערכות סמנים פותחו באילוף יונקים ימיים והתפשטו בעולם הכלבים בשנות ה-90. כיום מאמנים רבים משתמשים בכמה סמנים שונים – לכל אחד משמעות מוגדרת.',
 'אות (Cue) – מבקש התנהגות: ״שב״. סמן (Marker) – מסמן שההתנהגות נכונה ופרס בדרך: ״יס!״. מילת שחרור – ״אתה חופשי לזוז״. ללא מילת שחרור הכלב מחליט בעצמו מתי ״שב״ נגמר. אפשר להוסיף סמן ״המשך״ (״טוב״) שמעודד בלי לסיים.',
 '[{"title":"בחרו מילים","body":"מילים קצרות וייחודיות שלא נשמעות ביום-יום. כל בני הבית משתמשים באותן מילים."},
   {"title":"אות פעם אחת","body":"חזרה על האות מלמדת שהפעם הראשונה לא חשובה."},
   {"title":"הוסיפו את האות אחרון","body":"קודם מלמדים את ההתנהגות, ורק כשהיא אמינה מצמידים לה מילה."},
   {"title":"שחרור עקבי","body":"סיימו כל התנהגות ממושכת במילת השחרור."}]',
 array['מבהיר לכלב מה בדיוק נדרש.', 'מונע בלבול ומאיץ למידה.'],
 array['דורש תיאום בין כל בני המשפחה.'],
 array['כתבו את המילים על הקיר במטבח – כולם יזכרו.', 'אם אמרתם אות והכלב לא ביצע – הקלו את המצב, אל תחזרו שוב ושוב.'],
 '{sit,stay}', 4, 240),

-- ---------------------------------------------------------------- Puppy foundation
('puppy-socialization', 'puppy_foundation', '{classical_conditioning,ethology}',
 'חלון הסוציאליזציה של הגור',
 'בגיל 3 עד כ-14 שבועות המוח של הגור לומד במהירות מה ״נורמלי ובטוח״. החוויות בתקופה זו משפיעות על כל חייו.',
 'ג׳ון פול סקוט וג׳ון פולר פרסמו ב-1965 את Genetics and the Social Behavior of the Dog, מחקר בן כ-20 שנה שזיהה את ״התקופה הרגישה״ לסוציאליזציה. גורים שלא נחשפו לבני אדם עד גיל 14 שבועות נטו לפחד מהם כל חייהם. ב-2008 פרסמה AVSAB עמדה שלפיה הסיכון מבעיות התנהגות בשל חוסר סוציאליזציה גבוה מהסיכון לזיהומים, וממליצה להתחיל בסוציאליזציה זהירה עוד לפני השלמת החיסונים.',
 'סוציאליזציה איננה ״להציף את הגור בכל דבר״, אלא ליצור חוויות חיוביות ומבוקרות. הגור צריך להיות בעל שליטה – אפשרות להתקרב או להתרחק. חוויה מפחידה אחת עלולה להשאיר חותם.',
 '[{"title":"רשימת חשיפות","body":"אנשים בגילים ובמראה שונים, משטחים, רעשים, רכבים, כלבים חברותיים וחסונים, מגע בכפות ובאוזניים."},
   {"title":"בטוח לפני חיסונים","body":"החזיקו את הגור בידיים או בעגלה במקומות ציבוריים, והפגישו עם כלבים מחוסנים ובריאים בלבד."},
   {"title":"חוויה + פרס","body":"כל דבר חדש = חטיף או משחק. הגור קובע את הקצב."},
   {"title":"שיעורי גורים","body":"מחפשים שיעור מבוסס חיזוק עם משחק מבוקר וקבוצות לפי גודל."}]',
 array['מונע פחדים ותגובתיות בבגרות.', 'יוצר כלב בטוח וגמיש.'],
 array['חלון זמן קצר – דורש השקעה מיידית אחרי האימוץ.', 'צריך לאזן בין סוציאליזציה לבריאות.'],
 array['כמות לא מחליפה איכות: עדיף מעט חוויות טובות מהרבה חוויות מלחיצות.', 'גם אחרי החלון – המשיכו לחשוף בהדרגה עד גיל שנה ויותר.'],
 '{name-recognition,house-training}', 7, 310),

('bite-inhibition', 'puppy_foundation', '{operant_conditioning,positive_reinforcement}',
 'עכבת נשיכה וגורים נושכים',
 'נשיכות גורים הן שלב התפתחותי נורמלי. המטרה הראשונה היא ללמד את הגור לשלוט בעוצמת הנשיכה, ורק אחר כך להפסיק לנשוך בני אדם.',
 'איאן דנבר הדגיש בשנות ה-80 את חשיבות ״עכבת הנשיכה״: גור שלמד שעור אדם עדין ירסן את הפה גם במצב לחץ בבגרות. כך נשיכה, אם תקרה אי פעם, תגרום לנזק קטן בהרבה.',
 'גורים חוקרים את העולם בפה, וגם החלפת השיניים (בערך בגיל 3–6 חודשים) מגבירה את הצורך ללעוס. גורים לומדים עכבה ממשחק עם אחים ועם בני אדם: נשיכה חזקה מסיימת את המשחק.',
 '[{"title":"משחק עוצר","body":"נשיכה חזקה – אמרו ״אאוץ׳״ בשקט והפסיקו לשחק לכמה שניות. חזרו כשהגור נרגע."},
   {"title":"הפנו ללעיסה","body":"הציעו צעצוע לעיסה מתאים בכל פעם שהגור מחפש משהו לנשוך."},
   {"title":"מנוחה","body":"גורים עייפים נושכים יותר. גור צריך 16–20 שעות שינה ביממה."},
   {"title":"אל תעודדו משחקי ידיים","body":"שחקו עם צעצוע ארוך, לא עם הידיים."}]',
 array['מפחית מאוד את הסיכון לפגיעה חמורה בבגרות.', 'מלמד את הגור שליטה עצמית.'],
 array['מתיש בשבועות הראשונים.', 'דורש עקביות מכל המשפחה, כולל ילדים.'],
 array['גור ״מטורף״ בערב (Zoomies ונשיכות) צריך לעתים קרובות פשוט שינה.', 'אל תחזיקו את הלסת או תכו – זה מלמד פחד מידיים.'],
 '{crate-training}', 5, 320),

('cooperative-care', 'puppy_foundation', '{positive_reinforcement,classical_conditioning}',
 'טיפול שיתופי ושגרת מגע',
 'ללמד כלב לשתף פעולה עם גזיזת ציפורניים, צחצוח, בדיקות וטרינר וטיפות עיניים – מתוך בחירה ולא בכוח.',
 'מאמני גני חיות פיתחו ״אימון לטיפולים״ כדי לבדוק בעלי חיים גדולים בלי הרדמה. דבורה ג׳ונס פרסמה ב-2018 את Cooperative Care, שהתאים את הגישה לכלבי בית. במקביל צבר תאוצה תחום ״Fear Free״ במרפאות וטרינריות.',
 'הרעיון המרכזי הוא ״התנהגות הסכמה״ – למשל הנחת סנטר על כרית. כל עוד הסנטר על הכרית, הטיפול ממשיך; כשהכלב מרים את הראש, עוצרים. מתן שליטה לכלב מוריד פחד דרמטית.',
 '[{"title":"מנוחת סנטר","body":"למדו את הכלב להניח סנטר על כרית או על היד ולהשאיר אותו שם."},
   {"title":"נגיעה קצרה = פרס","body":"געו בכף לשנייה ותגמלו. בהדרגה החזיקו, ואז הראו את הגוזז."},
   {"title":"צעד אחר צעד","body":"ציפורן אחת ביום מספיקה בהתחלה."},
   {"title":"ביקורי וטרינר שמחים","body":"היכנסו למרפאה רק כדי לקבל חטיף ולצאת."}]',
 array['מפחית מאוד מתח בטיפולים ובמרפאה.', 'משפר בטיחות לצוות ולבעלים.'],
 array['דורש סבלנות ותרגול שוטף.'],
 array['התחילו מגיל גור – לפני שיש פחד.', 'עבדו בזמן שהכלב רגוע, לא אחרי פעילות מסעירה.'],
 '{settle}', 5, 330),

('puppy-alone-time', 'puppy_foundation', '{classical_conditioning,desensitization}',
 'ללמד גור להישאר לבד',
 'מניעת חרדת נטישה מתחילה בשבוע הראשון: מלמדים את הגור שזמן לבד הוא בטוח ושגרתי.',
 'מחקרים בתחום ההתנהגות מצביעים על כך שחלק ניכר מהכלבים חווים מצוקה כלשהי כשהם נשארים לבד. אימון מוקדם והדרגתי נחשב לכלי המניעה העיקרי.',
 'גורים מגיעים מסביבה שבה אינם לבד לעולם. המעבר צריך להיות הדרגתי: שניות, דקות, ואז שעות – כשהגור רגוע.',
 '[{"title":"פרידות קטנות בבית","body":"צאו מהחדר לכמה שניות כשהגור עסוק בצעצוע לעיסה וחזרו בשקט."},
   {"title":"שגרה צפויה","body":"השאירו את הגור לבד אחרי טיול וארוחה, כשהוא עייף."},
   {"title":"הגדלה הדרגתית","body":"הוסיפו זמן לאט. אם יש בכי ממושך – חזרו שלב אחורה."},
   {"title":"יציאות ושיבות משעממות","body":"בלי פרידות דרמטיות ובלי חגיגות מוגזמות כשחוזרים."}]',
 array['מונע את אחת הבעיות הנפוצות והקשות.'],
 array['קשה לאמץ כשעובדים מהבית ולא יוצאים כמעט.'],
 array['גם אם אתם בבית כל היום – תרגלו פרידות יומיות.', 'מצלמה פשוטה עוזרת לראות מה באמת קורה.'],
 '{crate-training,settle}', 4, 340),

-- ---------------------------------------------------------------- Working-dog skills
('scent-work', 'working_skill', '{positive_reinforcement,ethology}',
 'עבודת ריח (Nose Work)',
 'הכלב לומד לחפש ולאתר ריח מסוים – ספורט שמתאים לכל כלב, כולל כלבים מבוגרים, מפוחדים ותגובתיים.',
 'ספורט ה-K9 Nose Work נוסד ב-2006 על ידי מאמני כלבי גילוי שרצו להנגיש את עבודת הריח לכלבי בית. בתחרויות משתמשים בשמנים של ליבנה, אניס וציפורן. מערכת הריח של הכלב רגישה פי כמה מונים משלנו, וחלק גדול מהמוח שלו מוקדש לעיבוד ריחות.',
 'רחרוח הוא פעילות מרגיעה ומעייפת. בעבודת ריח הכלב מוביל והאדם עוקב – היפוך תפקידים שבונה ביטחון. מתחילים בחיפוש אחרי אוכל ועוברים בהמשך לריח מטרה.',
 '[{"title":"קופסאות","body":"פזרו 5 קופסאות קרטון; באחת – חטיף. תנו לכלב למצוא ותגמלו ליד הקופסה."},
   {"title":"מעלים קושי","body":"יותר קופסאות, קופסאות סגורות חלקית, חדרים שונים."},
   {"title":"ריח מטרה","body":"הצמידו ריח (ספוגית עם שמן) לחטיף, ובהדרגה תגמלו על מציאת הריח לבד."},
   {"title":"התראה","body":"למדו את הכלב ״לסמן״ (ישיבה או אף צמוד) כשהוא מוצא."}]',
 array['מתאים לכל גיל וגודל.', 'מוריד לחץ ומעייף מנטלית.', 'אפשר לתרגל בבית.'],
 array['דורש סבלנות מהבעלים – לא להתערב.'],
 array['10 דקות חיפוש מעייפות כמו טיול ארוך.', 'מצוין לימי גשם ולכלבים בהחלמה (באישור וטרינר).'],
 '{}', 5, 410),

('herding-outlets', 'working_skill', '{ethology,positive_reinforcement}',
 'מוצא לדחף הרעייה',
 'כלבי רועים זקוקים לעבודה. טרייבבול ומשחקי שליטה נותנים מענה לדחף בלי לרעות ילדים או מכוניות.',
 'טרייבבול (״כדור-דחיפה״) פותח בגרמניה בתחילת שנות ה-2000 כספורט שמדמה רעייה: הכלב דוחף כדורי פיזיו גדולים לשער לפי הנחיות מרחוק. הוא מנצל את שלבי רצף הטריפה – נעיצת מבט, התגנבות ומרדף – שהודגשו בגזעי הרועים.',
 'רועים עובדים עם נעיצת מבט ותנועה מבוקרת. משחקי זריקה בלתי פוסקים עלולים להפוך לאובססיביים; עדיף לשלב שליטה, עצירות וכיווני תנועה.',
 '[{"title":"הכרות עם הכדור","body":"תגמלו כל נגיעה באף בכדור גדול."},
   {"title":"דחיפה","body":"עצבו דחיפה קדימה עם האף או הכתף."},
   {"title":"כיוונים","body":"למדו ״ימינה״ ו״שמאלה״ סביב הכדור."},
   {"title":"שער","body":"בהדרגה הכלב דוחף את הכדור לעבר שער."}]',
 array['נותן מענה לצורך גנטי אמיתי.', 'מפחית התנהגויות רעייה לא רצויות.'],
 array['דורש מקום פתוח וציוד.'],
 array['כלב רועה שמתחיל ״לרעות״ ילדים – הפרידו ותנו לו עבודה חלופית מיד.', 'הימנעו מזריקות כדור חוזרות ללא הפסקה.'],
 '{}', 4, 420),

('prey-drive-outlets', 'working_skill', '{ethology,operant_conditioning}',
 'דחף ציד ומרדף: ניהול ותיעול',
 'כלבים עם דחף טריפה חזק רודפים אחרי חתולים, ציפורים ואופניים. לא ניתן ״למחוק״ את הדחף – אבל אפשר לתעל אותו.',
 'סימונה מולר פיתחה את Predation Substitute Training, שמלמד את הכלב להחליף את רצף הטריפה במשחקים מובנים. השיטה נשענת על העבודה של קופינגר על ״רצף הטריפה״.',
 'הדחף מורכב משלבים (כיוון, מבט, התגנבות, מרדף, תפיסה). אפשר לתת לכלב לבצע חלק מהשלבים בצורה מבוקרת – למשל מרדף אחרי פיתיון על חבל – ובכך להוריד את הלחץ.',
 '[{"title":"מוט פיתוי (Flirt pole)","body":"מקל עם חבל ופיתיון. הכלב רודף, מקבל לתפוס – ומשחרר בבקשה."},
   {"title":"שליטה בתוך המשחק","body":"שלבו ״שב״ ו״עזוב״ באמצע המרדף – המשך המשחק הוא הפרס."},
   {"title":"כיבוי אוטומטי","body":"למדו את הכלב להסתכל עליכם כשהוא מבחין בחיה (״תסתכל על זה״)."},
   {"title":"ניהול","body":"רצועה ארוכה במקומות עם חיות, עד שהקריאה אמינה לחלוטין."}]',
 array['מפחית תסכול ומרדפים מסוכנים.', 'מספק פעילות גופנית אינטנסיבית בזמן קצר.'],
 array['משחקי מרדף עלולים להגביר עוררות אם אין שליטה.'],
 array['שמרו על אימונים קצרים – 5 דקות מספיקות.', 'שימו לב לבריאות המפרקים – מתאים למבוגרים בריאים, לא לגורים צעירים.'],
 '{leave-it,recall}', 5, 430),

('guardian-breeds', 'working_skill', '{ethology,lima}',
 'גזעי שמירה: תיעול האינסטינקט המגונן',
 'כלבי שמירה נבחרו להיות חשדניים כלפי זרים ולהגן על הטריטוריה. הם זקוקים לסוציאליזציה, הדרכה וניהול קפדניים.',
 'כלבי שמירה על עדרים (כמו הכלב הכנעני, האנטולי וההרים הפירנאיים) גודלו מגיל צעיר עם הצאן והגנו עליו מטורפים. גזעי הגנה כמו רוטווילר ודוברמן פותחו לשמירה על אנשים ורכוש.',
 'מאחורי התנהגות שמירה עומדים לרוב ערנות וחשדנות. אילוף ״תקיפה״ אינו מתאים לכלבי בית. המטרה היא כלב בטוח בעצמו, שמתריע – ואז נרגע כשהבעלים מאשרים שהכל בסדר.',
 '[{"title":"סוציאליזציה מוגברת","body":"חשיפה מוקדמת ונרחבת לאנשים ולמצבים, תוך שמירה על חוויות חיוביות."},
   {"title":"״תודה, זה בסדר״","body":"למדו את הכלב שאחרי נביחת התרעה אחת – הבעלים לוקחים פיקוד. תגמלו חזרה אליכם."},
   {"title":"ניהול טריטוריה","body":"הגבילו גישה לגדר ולחלונות כדי לא לתרגל נביחות ממושכות."},
   {"title":"מבקרים","body":"כלב בחדר נפרד או על מזרן בזמן כניסת אורחים, עם חטיפים מהאורח רק אם הכלב רגוע."}]',
 array['כלב מגונן אך מאוזן ובטוח.'],
 array['חשדנות טבעית דורשת מאמץ סוציאליזציה גדול במיוחד.', 'גודלם וכוחם של רבים מהגזעים מחייבים שליטה טובה.'],
 array['עודדו התרעה קצרה – לא ״תקיפה״.', 'הכלב הכנעני הוא גזע ישראלי עתיק ושומר טבעי – הוא זקוק להרבה עבודת אמון.'],
 '{settle,name-recognition}', 5, 440)
on conflict (id) do nothing;

-- ================================================================================================
-- 20261018120300_veterinary_knowledge_base.sql
-- ================================================================================================
-- Veterinary Encyclopedia & Symptom Checker: a shared, read-only medical knowledge base (Hebrew),
-- a symptom catalog with urgency levels, and a symptom -> article mapping used for triage suggestions.
-- Content is educational and never replaces a veterinarian; the app shows that disclaimer on every screen.

create type public.vet_category as enum ('emergency', 'condition', 'breed_health', 'preventive', 'medication');

create type public.organ_system as enum (
  'cardiovascular', 'respiratory', 'gastrointestinal', 'dermatological', 'neurological',
  'musculoskeletal', 'urinary', 'endocrine', 'ocular', 'otic', 'dental', 'multisystem'
);

-- Ordered from most to least urgent; the app compares by this order.
create type public.care_urgency as enum ('emergency', 'vet_visit', 'home_care');

create table public.veterinary_knowledge_base (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  category public.vet_category not null,
  organ_system public.organ_system,
  urgency public.care_urgency,
  title text not null,
  summary text not null,
  overview text not null default '',
  signs text[] not null default '{}',
  causes text not null default '',
  -- [{ "title": string, "body": string }] – what the owner should do
  actions jsonb not null default '[]' check (jsonb_typeof(actions) = 'array'),
  when_to_call_vet text not null default '',
  prevention text not null default '',
  breeds text[] not null default '{}', -- breed slugs, see src/features/dogs/breeds.ts
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index veterinary_knowledge_base_category_idx on public.veterinary_knowledge_base (category, sort_order);
create index veterinary_knowledge_base_breeds_idx on public.veterinary_knowledge_base using gin (breeds);

create table public.vet_symptoms (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null default '',
  base_urgency public.care_urgency not null,
  red_flags text[] not null default '{}', -- any of these escalates to an emergency
  sort_order integer not null default 0
);

create table public.vet_symptom_conditions (
  symptom_id text not null references public.vet_symptoms (id) on delete cascade,
  article_id text not null references public.veterinary_knowledge_base (id) on delete cascade,
  primary key (symptom_id, article_id)
);

create index vet_symptom_conditions_article_idx on public.vet_symptom_conditions (article_id);

alter table public.veterinary_knowledge_base enable row level security;
alter table public.vet_symptoms enable row level security;
alter table public.vet_symptom_conditions enable row level security;

create policy "veterinary_knowledge_base_read" on public.veterinary_knowledge_base
  for select to authenticated using (true);
create policy "vet_symptoms_read" on public.vet_symptoms
  for select to authenticated using (true);
create policy "vet_symptom_conditions_read" on public.vet_symptom_conditions
  for select to authenticated using (true);

revoke all on table public.veterinary_knowledge_base, public.vet_symptoms, public.vet_symptom_conditions from anon;
grant select on table public.veterinary_knowledge_base, public.vet_symptoms, public.vet_symptom_conditions to authenticated;

-- ============================================================================
-- Articles
-- ============================================================================

insert into public.veterinary_knowledge_base
  (id, category, organ_system, urgency, title, summary, overview, signs, causes, actions, when_to_call_vet, prevention, breeds, tags, sort_order)
values

-- ---------------------------------------------------------------- Emergency first aid
('gdv-bloat', 'emergency', 'gastrointestinal', 'emergency',
 'הרחבה ותסביב קיבה (GDV)',
 'הקיבה מתמלאת בגז ומסתובבת סביב צירה. מצב קטלני שמתפתח תוך שעות – דורש ניתוח חירום.',
 'בתסביב קיבה האספקה הדמית לקיבה ולטחול נחסמת והחזרה הוורידית ללב נפגעת. ללא טיפול המצב עלול להיות קטלני תוך שעות ספורות. הסיכון הגבוה ביותר הוא בכלבים גדולים בעלי חזה עמוק.',
 array['ניסיונות הקאה ללא תוצאה (״הקאה יבשה״)', 'בטן נפוחה וקשה', 'אי-שקט, הליכה הלוך ושוב, חוסר יכולת לשכב', 'ריור מוגבר', 'חניכיים חיוורות, נשימה מהירה', 'חולשה וקריסה'],
 'גורמי סיכון: גזע גדול עם חזה עמוק, גיל מבוגר, קרוב משפחה שחווה GDV, ארוחה אחת גדולה ביום, אכילה מהירה ומזג חרד.',
 '[{"title":"נסעו מיד למרפאת חירום","body":"אל תחכו לראות אם זה עובר. התקשרו בדרך כדי שהצוות יתכונן."},
   {"title":"אל תתנו אוכל, מים או תרופות","body":"אל תנסו לגרום להקאה."},
   {"title":"הובלה עדינה","body":"הכלב יכול להיות בכאב חזק – הרימו בזהירות ותמכו בבטן."}]',
 'תמיד. כל חשד ל-GDV הוא מקרה חירום.',
 'חלוקת המזון ל-2–3 ארוחות ביום, קערת האכלה איטית לכלבים שאוכלים מהר, והימנעות מפעילות נמרצת סמוך לארוחה. בגזעים בסיכון גבוה כדאי לשקול עם הווטרינר קיבוע קיבה מונע (Gastropexy), לעתים במקביל לעיקור.',
 array['great-dane', 'german-shepherd', 'doberman', 'standard-poodle', 'rottweiler', 'weimaraner'],
 array['בטן נפוחה', 'הקאה', 'גזע גדול'], 10),

('heatstroke', 'emergency', 'multisystem', 'emergency',
 'מכת חום',
 'עלייה מסוכנת בחום הגוף שגורמת לנזק לאיברים. בישראל זו אחת מסיבות החירום השכיחות בקיץ.',
 'כלבים מתקררים בעיקר באמצעות התנשפות, שפחות יעילה מהזעה. ברכב סגור, בפעילות בחום או בלחות גבוהה החום עולה מהר. גזעים ברכיצפליים, כלבים בעודף משקל, מבוגרים וכלבים עם מחלות לב ונשימה בסיכון גבוה במיוחד.',
 array['התנשפות כבדה ולא פוסקת', 'ריור סמיך', 'חניכיים ולשון אדומות כהות או כחלחלות', 'חולשה, נפילות, בלבול', 'הקאות ושלשולים (לעתים עם דם)', 'פרכוסים או איבוד הכרה'],
 'רכב סגור (גם עם חלון פתוח), פעילות גופנית בשעות חמות, חוסר צל ומים, אספלט חם.',
 '[{"title":"קודם לקרר","body":"העבירו לצל ושפכו מים בטמפרטורת ברז על כל הגוף, במיוחד הבטן, בית השחי והמפשעה. השתמשו במאוורר או ברוח."},
   {"title":"לא קרח ולא מגבת רטובה","body":"מים קפואים מכווצים כלי דם ומאטים את הקירור; מגבת רטובה שמכסה את הכלב לוכדת חום."},
   {"title":"המשיכו לקרר בדרך","body":"נסעו לווטרינר עם מזגן פועל ומים בהישג יד. גם כלב שנראה שהשתפר צריך בדיקה – נזק לאיברים יכול להופיע מאוחר יותר."},
   {"title":"מים לשתייה","body":"הציעו מעט מים אם הכלב בהכרה מלאה. אל תשפכו מים לפה."}]',
 'בכל חשד למכת חום – גם אם הכלב נראה שמשתפר.',
 'טיולים רק בשעות הבוקר המוקדמות והערב בקיץ, בדיקת חום האספלט עם גב היד (אם חם ליד – חם לכפות), מים וצל תמיד, ולעולם לא להשאיר כלב ברכב.',
 array['french-bulldog', 'english-bulldog', 'pug', 'boxer', 'shih-tzu'],
 array['חום', 'קיץ', 'התנשפות'], 20),

('poisoning', 'emergency', 'multisystem', 'emergency',
 'הרעלות: מזונות וחומרים מסוכנים',
 'מה לעשות כשכלב בלע משהו רעיל, ואילו מזונות, צמחים וחומרים ביתיים מסוכנים לכלבים.',
 'רעלים שכיחים: שוקולד (במיוחד מריר ואבקת קקאו), קסיליטול (ממתיק במסטיקים וממתקים ״ללא סוכר״ – גורם לירידת סוכר חדה ולפגיעה בכבד), ענבים וצימוקים (עלולים לגרום לאי-ספיקת כליות), בצל ושום (פוגעים בכדוריות הדם האדומות), אגוזי מקדמיה, אלכוהול, תרופות של בני אדם, רעל עכברים, חומרי הדברה, נוזל נגד קיפאון, ופטריות בר.',
 array['הקאות או שלשולים פתאומיים', 'ריור', 'רעד, פרכוסים', 'אי-שקט או ישנוניות קיצונית', 'דימום מהאף, מהחניכיים או בשתן (רעל עכברים)', 'חולשה וחניכיים חיוורות'],
 'בליעה מקרית מהשולחן, מהפח, מתיק או בטיול.',
 '[{"title":"התקשרו לווטרינר מיד","body":"גם אם אין עדיין סימנים. בהרעלות רבות הסימנים מופיעים שעות אחרי – וטיפול מוקדם יעיל הרבה יותר."},
   {"title":"אל תגרמו להקאה בעצמכם","body":"רק לפי הנחיית וטרינר. חומרים צורבים ודלקים מזיקים יותר בדרך חזרה, ושיטות ביתיות (מלח, חומצה) מסוכנות."},
   {"title":"קחו את האריזה","body":"שם המוצר, החומר הפעיל והכמות המשוערת עוזרים להחליט על הטיפול."},
   {"title":"הרחיקו את המקור","body":"ודאו שאין גישה לשאריות ושאין כלבים נוספים שנחשפו."}]',
 'בכל חשד לבליעת חומר רעיל.',
 'אחסנו תרופות, חומרי ניקוי ורעלים בארונות סגורים, שימו לב למסטיקים בתיקים, הפכו את הפח לבלתי נגיש ולמדו את הכלב ״עזוב״.',
 '{}', array['רעל', 'שוקולד', 'קסיליטול', 'ענבים'], 30),

('processionary-caterpillar', 'emergency', 'dermatological', 'emergency',
 'זחל תהלוכן האורן',
 'מגע עם הזחלים השעירים, שנעים בשיירות מתחת לעצי אורן בחורף ובאביב, גורם לתגובה חריפה בלשון ובפה ועלול לגרום לנמק.',
 'השערות של זחל תהלוכן האורן מכילות חלבון מגרה. כלב שמרחרח או מלקק את הזחלים מפתח תוך דקות נפיחות חמורה של הלשון והשפתיים. ללא טיפול מהיר חלקים מהלשון עלולים לעבור נמק.',
 array['ריור פתאומי וחזק', 'נפיחות של הלשון, השפתיים או הפנים', 'שפשוף הפה בכפות', 'לשון בצבע כהה או סגלגל', 'הקאות'],
 'מגע עם הזחלים או עם הקן (שקיות לבנות דמויות צמר גפן על ענפי אורן). העונה העיקרית בישראל: חורף ותחילת אביב.',
 '[{"title":"שטפו בעדינות","body":"שטפו את הפה במים רבים בלי לשפשף – שפשוף משחרר עוד שערות. הגנו על הידיים בכפפות."},
   {"title":"נסעו מיד לווטרינר","body":"טיפול מוקדם (נוגדי דלקת ותרופות נוספות) מפחית את הסיכון לנמק."}]',
 'מיד, בכל חשד למגע.',
 'הימנעו מטיולים מתחת לעצי אורן בעונה, הרחיקו את הכלב משיירות זחלים, ודווחו לרשות המקומית על קינים.',
 '{}', array['זחלים', 'אורן', 'לשון נפוחה', 'ישראל'], 40),

('snake-bite', 'emergency', 'multisystem', 'emergency',
 'הכשת נחש (צפע ארצישראלי)',
 'הצפע הארצישראלי הוא הנחש הארסי הנפוץ בישראל. הכשה גורמת לנפיחות מהירה, כאב ופגיעה בקרישת הדם.',
 'הכשות קורות בעיקר באביב ובקיץ, בשטחים פתוחים, בחצרות ובמחסנים. כלבים ננשכים בדרך כלל בפנים או ברגליים הקדמיות כשהם מרחרחים את הנחש.',
 array['נפיחות מהירה בפנים, בצוואר או בגפה', 'כאב, צליעה', 'סימני נקב קטנים, דימום', 'חולשה, הקאות', 'קושי בנשימה (נפיחות בצוואר)'],
 'מגע עם נחש בטבע או בחצר.',
 '[{"title":"שמרו על רוגע והגבילו תנועה","body":"תנועה מגבירה את פיזור הארס. אם אפשר – שאו את הכלב."},
   {"title":"נסעו מיד לווטרינר","body":"מרפאות רבות מחזיקות נסיוב נגד ארס. התקשרו מראש כדי לוודא."},
   {"title":"מה לא לעשות","body":"לא לחתוך, לא למצוץ, לא לקשור חוסם עורקים ולא לשים קרח."}]',
 'מיד, בכל חשד להכשה.',
 'רצועה בשטחים פתוחים בעונה החמה, ניקוי ערימות וגרוטאות בחצר, והימנעות מרחרוח בין סלעים ובשיחים.',
 '{}', array['נחש', 'צפע', 'נפיחות', 'ישראל'], 50),

('trauma-bleeding', 'emergency', 'multisystem', 'emergency',
 'טראומה, תאונה ודימום',
 'עזרה ראשונה לכלב שנפגע מרכב, נפל מגובה או נפצע – והוראות בטיחות לאדם המטפל.',
 'גם כלב שנראה בסדר אחרי פגיעה עלול לסבול מדימום פנימי, מפגיעה בריאות או משברים. כלב בכאב עלול לנשוך גם את בעליו.',
 array['דימום חיצוני', 'צליעה או חוסר יכולת לעמוד', 'קושי בנשימה', 'חניכיים חיוורות', 'חולשה או בלבול'],
 'תאונות דרכים, נפילות, קרבות בין כלבים, חפצים חדים.',
 '[{"title":"בטיחות","body":"גשו בזהירות. אם הכלב נושם בחופשיות ואינו מקיא – אפשר לקשור פה ברצועה או בבד כדי למנוע נשיכה."},
   {"title":"עצירת דימום","body":"לחצו ישירות על הפצע עם בד נקי. אם הבד נספג – הוסיפו שכבה מעל, אל תסירו."},
   {"title":"הובלה","body":"השתמשו בקרש, בשמיכה מתוחה או בקופסה כדי לייצב את הגב והצוואר."},
   {"title":"נסעו לווטרינר","body":"גם אם הכלב נראה בסדר – בדיקה תוך שעות היא חובה."}]',
 'אחרי כל טראומה משמעותית.',
 'רצועה ליד כבישים, שערים סגורים, וקריאה אמינה.',
 '{}', array['תאונה', 'דימום', 'פציעה'], 60),

('seizures', 'emergency', 'neurological', 'emergency',
 'פרכוסים',
 'התקף פרכוסים נראה מפחיד מאוד. רוב ההתקפים חולפים תוך דקות, אבל התקף ארוך או התקפים חוזרים הם מצב חירום.',
 'פרכוסים נגרמים מפעילות חשמלית לא תקינה במוח. הסיבות כוללות אפילפסיה, הרעלות, ירידת סוכר, מחלות כבד, גידולים או מכת חום.',
 array['נפילה על הצד ותנועות ריצה', 'נוקשות שרירים', 'ריור, לעיסה', 'איבוד הכרה', 'הטלת שתן או צואה', 'בלבול לאחר ההתקף'],
 'אפילפסיה, הרעלה, ירידת סוכר, מחלות מערכתיות.',
 '[{"title":"הרחיקו סכנות","body":"פנו חפצים, הרחיקו ממדרגות ומים. אל תכניסו יד לפה – כלבים לא בולעים את הלשון."},
   {"title":"מדדו זמן","body":"רשמו מתי התחיל ומתי נגמר. אם אפשר – צלמו וידאו לווטרינר."},
   {"title":"שקט וחושך","body":"הנמיכו אורות ורעש, וחכו שהכלב יתאושש."},
   {"title":"מתי לנסוע מיד","body":"התקף שנמשך מעל 5 דקות, כמה התקפים ברצף, או כלב שלא חוזר להכרה בין התקפים – נסעו מיד לחירום."}]',
 'אחרי כל התקף ראשון; מיד אם התקף נמשך מעל 5 דקות או חוזר.',
 'בכלבים אפילפטיים – מתן תרופות קבוע ומעקב.',
 array['border-collie', 'australian-shepherd', 'beagle', 'labrador', 'golden-retriever'],
 array['פרכוס', 'אפילפסיה'], 70),

('breathing-difficulty', 'emergency', 'respiratory', 'emergency',
 'קשיי נשימה וחנק',
 'כלב שמתקשה לנשום, משמיע קולות חריקה או מתנשף עם צוואר מתוח – זקוק לעזרה מיידית.',
 'קושי בנשימה יכול לנבוע מחפץ זר בגרון, מתגובה אלרגית, ממחלת לב, מנוזל בריאות, מטראומה או ממכת חום. בכלבים ברכיצפליים גם התרגשות או חום עלולים לגרום למצוקה.',
 array['נשימה מהירה במנוחה', 'מאמץ נשימתי – בטן ״עובדת״, מרפקים פתוחים, צוואר מתוח', 'חניכיים כחלחלות או אפורות', 'השתעלות חוזרת, קולות חנק', 'חוסר רצון לשכב'],
 'חפץ זר, אלרגיה, מחלת לב, טראומה, חום.',
 '[{"title":"חפץ נראה לעין","body":"אם רואים חפץ בפה ואפשר להוציאו בבטחה – עשו זאת בזהירות, בלי לדחוף עמוק."},
   {"title":"שמרו על קור ושקט","body":"מתח ותנועה מגבירים את הצורך בחמצן."},
   {"title":"נסעו מיד","body":"קשיי נשימה הם תמיד מקרה חירום."}]',
 'מיד.',
 'הרחקת חפצים קטנים וצעצועים שבירים, טיפול במחלות לב, הגנה מחום לכלבים ברכיצפליים.',
 array['french-bulldog', 'english-bulldog', 'pug', 'cavalier'],
 array['נשימה', 'חנק', 'חניכיים כחולות'], 80),

-- ---------------------------------------------------------------- Conditions
('gastroenteritis', 'condition', 'gastrointestinal', 'vet_visit',
 'הקאות ושלשולים (דלקת קיבה ומעיים)',
 'הפרעה שכיחה שלעתים קרובות חולפת תוך יום–יומיים, אבל יכולה להיות סימן למשהו חמור.',
 'רוב המקרים נגרמים מ״חוסר זהירות תזונתית״ – אכילה מהפח, שינוי מזון פתאומי. סיבות נוספות: טפילים, זיהומים, דלקת לבלב, גופים זרים ורעלים.',
 array['הקאות', 'שלשול', 'ירידה בתיאבון', 'כאבי בטן', 'עייפות'],
 'שינויי תזונה, אכילת פסולת, טפילים, וירוסים, דלקת לבלב, גוף זר.',
 '[{"title":"מנוחה למערכת העיכול","body":"בכלב בוגר ופעיל – מים זמינים בכמויות קטנות ותכופות, ואז מזון קל וקל לעיכול במנות קטנות, לפי הנחיית וטרינר."},
   {"title":"מעקב","body":"רשמו תדירות, מראה, דם, תיאבון ורמת אנרגיה."},
   {"title":"גורים ומבוגרים","body":"גורים, כלבים מבוגרים וכלבים עם מחלות רקע מתייבשים מהר – פנו לווטרינר מוקדם."}]',
 'מיד: הקאות חוזרות, דם בהקאה או בצואה, בטן נפוחה, חולשה, גור לא מחוסן, חשד לבליעת חפץ או רעל. תוך 24 שעות: שלשול שלא משתפר.',
 'מעבר הדרגתי בין מזונות, תילוע קבוע, מניעת גישה לפח.',
 '{}', array['הקאה', 'שלשול', 'בטן'], 110),

('parvovirus', 'condition', 'gastrointestinal', 'emergency',
 'פרבו-וירוס',
 'מחלה ויראלית קשה ומדבקת מאוד שפוגעת בעיקר בגורים לא מחוסנים. מניעה באמצעות חיסון יעילה מאוד.',
 'הנגיף עמיד מאוד בסביבה ונישא בצואה. הוא פוגע ברירית המעי ובמערכת החיסון, וגורם לשלשולים דמיים, התייבשות וזיהום.',
 array['שלשול דמי עם ריח חזק', 'הקאות', 'חוסר תיאבון', 'חולשה ואדישות', 'חום'],
 'מגע עם צואה נגועה או סביבה מזוהמת.',
 '[{"title":"פנו מיד לווטרינר","body":"טיפול תומך מוקדם ואינטנסיבי משפר מאוד את סיכויי ההחלמה."},
   {"title":"בידוד","body":"הרחיקו מכלבים אחרים. חטאו משטחים בחומר יעיל נגד פרבו לפי הנחיית הווטרינר."}]',
 'מיד, במיוחד בגור לא מחוסן או מחוסן חלקית.',
 'השלמת סדרת החיסונים הגורית (DHPP) וחיסוני דחף. עד השלמת הסדרה – לא להוריד גורים לאדמה במקומות שכלבים רבים עוברים בהם.',
 '{}', array['גורים', 'שלשול דמי', 'חיסון'], 120),

('otitis', 'condition', 'otic', 'vet_visit',
 'דלקת אוזניים',
 'בעיה שכיחה מאוד, במיוחד בכלבים עם אוזניים שמוטות או אלרגיות. כואבת ודורשת אבחון.',
 'דלקת בתעלת האוזן נגרמת לרוב משמרים או חיידקים, כשהבסיס הוא אלרגיה, לחות, צורת אוזן או גוף זר (כמו זרעי עשבים).',
 array['ניעור ראש', 'גירוד באוזן', 'ריח רע', 'הפרשה חומה או צהובה', 'אדמומיות', 'רגישות למגע', 'הטיית ראש'],
 'אלרגיות, לחות אחרי רחצה, זרעי עשבים, קרדית אוזניים.',
 '[{"title":"אל תכניסו מקלוני אוזניים","body":"הם דוחפים לכלוך פנימה ועלולים לפגוע בעור התוף."},
   {"title":"פנו לווטרינר","body":"צריך לבדוק את התעלה ולקחת דגימה כדי לבחור טיפול מתאים."}]',
 'תוך יום–יומיים, ומיד אם יש הטיית ראש, איבוד שיווי משקל או כאב חזק.',
 'ייבוש האוזניים אחרי רחצה, ניקוי לפי הנחיית וטרינר, וטיפול באלרגיה הבסיסית.',
 array['cocker-spaniel', 'labrador', 'golden-retriever', 'cavalier', 'poodle'],
 array['אוזן', 'גירוד', 'ריח'], 130),

('atopic-dermatitis', 'condition', 'dermatological', 'vet_visit',
 'אלרגיות עור וגירוד',
 'גירוד כרוני, ליקוק כפות ודלקות עור חוזרות הם לרוב סימן לאלרגיה – סביבתית, תזונתית או לפרעושים.',
 'דרמטיטיס אטופית היא נטייה גנטית לתגובה אלרגית לאבקנים, קרדית אבק ועובשים. אלרגיה לרוק פרעושים שכיחה מאוד, ואלרגיה למזון שכיחה פחות. האבחון נעשה בשלילה ובניסוי.',
 array['גירוד, ליקוק ולעיסה', 'אדמומיות בכפות, בבטן ובבתי השחי', 'נשירת שיער', 'דלקות אוזניים חוזרות', 'עור מעובה וכהה'],
 'נטייה גנטית, פרעושים, מזון, גורמים סביבתיים.',
 '[{"title":"טיפול בפרעושים","body":"ודאו שכל בעלי החיים בבית מטופלים באופן קבוע – גם אם לא רואים פרעושים."},
   {"title":"פנו לווטרינר","body":"יש כיום תרופות יעילות נגד גירוד, וניתן לבצע ניסוי מזון מובנה."}]',
 'כשגירוד פוגע בשינה או באיכות החיים, או כשיש פצעים והפרשות.',
 'טיפול מונע קבוע בפרעושים, תזונה איכותית, ושמירה על עור בריא.',
 array['french-bulldog', 'labrador', 'golden-retriever', 'shih-tzu', 'boxer'],
 array['גירוד', 'עור', 'אלרגיה'], 140),

('tick-borne-diseases', 'condition', 'multisystem', 'vet_visit',
 'מחלות המועברות בקרציות (ארליכיה, בבזיה)',
 'בישראל קרציות מעבירות מחלות דם שכיחות ומסוכנות. המחלה יכולה להופיע שבועות אחרי העקיצה.',
 'ארליכיוזיס (קדחת קרציות) נגרמת מחיידק שפוגע בתאי דם לבנים ובטסיות. בבזיוזיס נגרמת מטפיל שפוגע בכדוריות הדם האדומות. שתיהן מועברות בעיקר על ידי קרציית הכלבים החומה.',
 array['חום', 'עייפות וחולשה', 'חוסר תיאבון', 'חניכיים חיוורות', 'דימומים מהאף או נקודות דימום על העור', 'שתן כהה (בבזיה)'],
 'עקיצת קרציה נגועה.',
 '[{"title":"פנו לווטרינר","body":"בדיקות דם מאפשרות לאבחן ולטפל. טיפול מוקדם יעיל הרבה יותר."},
   {"title":"הסרת קרציות","body":"הסירו קרציות עם פינצטה צמוד לעור במשיכה ישרה ואיטית. אל תמרחו שמן או אלכוהול."}]',
 'בכל חום, חולשה, חיוורון או דימום – במיוחד אחרי חשיפה לקרציות.',
 'טיפול מונע נגד קרציות לאורך כל השנה (טבליות, קולרים או טיפות), סריקת הגוף אחרי טיולים, וטיפול בחצר.',
 '{}', array['קרציות', 'ארליכיה', 'ישראל', 'חום'], 150),

('leishmaniasis', 'condition', 'multisystem', 'vet_visit',
 'לישמניה',
 'מחלה טפילית המועברת על ידי זבובי חול, אנדמית בישראל ובאגן הים התיכון. כרונית, אך ניתנת לניהול.',
 'הטפיל לישמניה מועבר בעקיצת זבוב חול. המחלה מתפתחת לאט ופוגעת בעור, בכליות, בעיניים ובמפרקים. יש לה גם חשיבות לבריאות הציבור.',
 array['ירידה במשקל', 'נשירת שיער סביב העיניים והאף', 'קשקשים ופצעים בעור', 'ציפורניים ארוכות במיוחד', 'דימומים מהאף', 'צליעה'],
 'עקיצת זבוב חול נגוע, בעיקר בשעות הערב והלילה בעונה החמה.',
 '[{"title":"אבחון","body":"בדיקות דם ספציפיות. בכלבים מאזורים אנדמיים כדאי לבצע בדיקת סקר."},
   {"title":"טיפול וניהול","body":"טיפול תרופתי ממושך ומעקב קבוע אחר תפקודי כליות."}]',
 'בכל אחד מהסימנים – במיוחד בכלבים שחיים באזורים אנדמיים.',
 'קולרים או תכשירים דוחי זבובי חול, הכנסת הכלב הביתה בשעות הערב בעונה, ורשתות.',
 '{}', array['לישמניה', 'זבוב חול', 'ישראל', 'עור'], 160),

('spirocercosis', 'condition', 'gastrointestinal', 'vet_visit',
 'ספירוצרקה (תולעת הוושט)',
 'תולעת שכיחה בישראל שיוצרת גושים בוושט ועלולה לגרום לסיבוכים קשים. ניתנת למניעה.',
 'כלבים נדבקים מאכילת חיפושיות זבל או בעלי חיים קטנים הנושאים את הטפיל. התולעת נודדת לוושט, יוצרת גושים, ועלולה לגרום להתרחבות אבי העורקים ולעתים לגידולים.',
 array['הקאות או פליטת מזון', 'קושי בבליעה', 'ירידה במשקל', 'ריור', 'שיעול'],
 'אכילת חיפושיות או בעלי חיים קטנים בטבע.',
 '[{"title":"אבחון","body":"בדיקת צואה ולעתים אנדוסקופיה או הדמיה."},
   {"title":"טיפול","body":"טיפול תרופתי לפי הנחיית וטרינר."}]',
 'בכל הקאה חוזרת, קושי בבליעה או ירידה במשקל.',
 'תכשירי מניעה מתאימים לפי המלצת הווטרינר (חלק מהתכשירים המשולבים מגנים גם מתולעת הלב), ומניעת אכילה בטיולים.',
 '{}', array['תולעים', 'וושט', 'ישראל'], 170),

('osteoarthritis', 'condition', 'musculoskeletal', 'vet_visit',
 'שחיקת מפרקים (אוסטאוארתריטיס)',
 'מחלה מתקדמת של המפרקים שגורמת לכאב כרוני. שכיחה מאוד בכלבים מבוגרים, ולעתים קרובות לא מאובחנת.',
 'הסחוס במפרק נשחק והגוף מגיב בדלקת ובשינויים בעצם. דיספלזיה, פציעות קודמות ועודף משקל מאיצים את התהליך.',
 array['נוקשות בקימה', 'היסוס בקפיצה למכונית או לספה', 'הליכה איטית יותר', 'ליקוק מפרקים', 'שינויים במצב הרוח'],
 'גיל, דיספלזיה, עודף משקל, פציעות.',
 '[{"title":"שמירה על משקל","body":"הפחתת משקל היא הטיפול היעיל ביותר שבידי הבעלים."},
   {"title":"פעילות מתונה וקבועה","body":"הליכות קצרות ותכופות עדיפות על ריצה אחת ארוכה. הידרותרפיה מצוינת."},
   {"title":"נוחות בבית","body":"שטיחים נגד החלקה, מיטה אורתופדית ורמפות."},
   {"title":"טיפול בכאב","body":"רק לפי הנחיית וטרינר – לעולם לא משככי כאבים של בני אדם."}]',
 'בכל סימן לכאב או נוקשות.',
 'שמירה על משקל תקין מגיל גור ופעילות מאוזנת.',
 array['labrador', 'golden-retriever', 'german-shepherd', 'rottweiler'],
 array['מפרקים', 'צליעה', 'גיל מבוגר'], 180),

('ccl-rupture', 'condition', 'musculoskeletal', 'vet_visit',
 'קרע ברצועה הצולבת',
 'הפציעה האורתופדית השכיחה ביותר בכלבים – המקבילה לקרע ACL באדם. גורמת לצליעה פתאומית ברגל אחורית.',
 'בכלבים, הרצועה נשחקת לרוב בהדרגה ואז נקרעת, לעתים בתנועה פשוטה. חלק ניכר מהכלבים שנפגעו ברגל אחת יפתחו עם הזמן בעיה גם ברגל השנייה.',
 array['צליעה פתאומית ברגל אחורית', 'ישיבה עם רגל מוטה הצידה', 'נפיחות בברך', 'קושי בקימה'],
 'שחיקה של הרצועה, עודף משקל, מבנה גוף.',
 '[{"title":"מנוחה","body":"הגבילו פעילות עד לבדיקה."},
   {"title":"בדיקה","body":"וטרינר יבדוק את יציבות הברך ויבצע צילום."},
   {"title":"טיפול","body":"בכלבים בינוניים וגדולים לרוב מומלץ ניתוח; בכלבים קטנים לעתים טיפול שמרני."}]',
 'תוך יום–יומיים בצליעה שלא חולפת.',
 'משקל תקין, חיזוק שרירים וחימום לפני פעילות אינטנסיבית.',
 array['labrador', 'rottweiler', 'boxer', 'golden-retriever'],
 array['צליעה', 'ברך'], 190),

('dental-disease', 'condition', 'dental', 'home_care',
 'מחלות שיניים וחניכיים',
 'מחלת חניכיים היא מהבעיות השכיחות ביותר בכלבים בוגרים. היא כואבת ועלולה להשפיע על בריאות כללית.',
 'רובד חיידקי הופך לאבנית, גורם לדלקת חניכיים ובהמשך לאובדן רקמה סביב השן. כלבים קטנים ובראכיצפליים בסיכון גבוה.',
 array['ריח רע מהפה', 'אבנית צהובה-חומה', 'חניכיים אדומות או מדממות', 'לעיסה בצד אחד', 'נפילת אוכל מהפה'],
 'הצטברות רובד, צפיפות שיניים, גנטיקה.',
 '[{"title":"צחצוח","body":"צחצוח יומי עם משחת שיניים לכלבים הוא אמצעי המניעה הטוב ביותר."},
   {"title":"ניקוי מקצועי","body":"ניקוי אבנית בהרדמה כללית כולל בדיקה מתחת לקו החניכיים."}]',
 'בכל כאב, נפיחות בפנים, שן שבורה או ריח חזק במיוחד.',
 'צחצוח יומי, מוצרי לעיסה מאושרים ובדיקות שגרתיות.',
 array['chihuahua', 'yorkshire-terrier', 'maltese', 'pomeranian', 'shih-tzu', 'poodle'],
 array['שיניים', 'ריח פה'], 200),

('diabetes', 'condition', 'endocrine', 'vet_visit',
 'סוכרת',
 'מחסור באינסולין שגורם לרמות סוכר גבוהות. ניתנת לניהול טוב עם זריקות אינסולין ותזונה מותאמת.',
 'בכלבים סוכרת דומה בדרך כלל לסוכרת מסוג 1 – הלבלב לא מייצר מספיק אינסולין. שכיחה יותר בכלבים בגיל העמידה ומעלה ובכלבות שאינן מעוקרות.',
 array['שתייה מוגברת', 'הטלת שתן מוגברת', 'תיאבון מוגבר עם ירידה במשקל', 'עיניים עכורות (קטרקט)', 'עייפות'],
 'גנטיקה, דלקות לבלב, השמנה, גורמים הורמונליים.',
 '[{"title":"אבחון","body":"בדיקות דם ושתן."},
   {"title":"ניהול","body":"זריקות אינסולין קבועות, ארוחות בשעות קבועות ומעקב רמות סוכר."}]',
 'מיד אם הכלב מקיא, חלש או לא אוכל – ייתכן מצב חמור (קטואצידוזיס).',
 'שמירה על משקל תקין ועיקור כלבות.',
 array['poodle', 'beagle', 'yorkshire-terrier'],
 array['שתייה', 'סוכר'], 210),

('urinary-issues', 'condition', 'urinary', 'vet_visit',
 'בעיות בדרכי השתן',
 'דלקות, אבנים וחסימות. חסימה – כלב שמתאמץ ואינו מצליח להטיל שתן – היא מקרה חירום.',
 'דלקות שתן שכיחות יותר בכלבות. אבנים בשלפוחית עלולות לגרום לדם בשתן ולחסימה, במיוחד בזכרים.',
 array['תכיפות במתן שתן', 'מאמץ', 'דם בשתן', 'ליקוק אזור איברי המין', 'תאונות בבית'],
 'זיהומים, אבנים, גידולים, מחלות מערכתיות.',
 '[{"title":"בדיקה","body":"בדיקת שתן ולפעמים הדמיה."},
   {"title":"חסימה","body":"כלב שמתאמץ ולא יוצא שתן – נסעו מיד לחירום."}]',
 'תוך 24 שעות בסימני דלקת; מיד בחסימה.',
 'גישה חופשית למים ויציאות תכופות.',
 array['dalmatian', 'shih-tzu', 'yorkshire-terrier'],
 array['שתן', 'דם בשתן'], 220),

('kennel-cough', 'condition', 'respiratory', 'home_care',
 'שעלת המלונות',
 'זיהום מדבק בדרכי הנשימה העליונות שגורם לשיעול חזק ״דמוי אווז״. לרוב חולף לבד.',
 'נגרם משילוב של וירוסים וחיידקים, בעיקר ממגע עם כלבים אחרים בפנסיונים, בגינות כלבים ובתערוכות.',
 array['שיעול צורם וחזק', 'עיטושים', 'נזלת קלה', 'פליטה בסוף השיעול'],
 'מגע עם כלבים נגועים.',
 '[{"title":"מנוחה","body":"הגבילו פעילות והשתמשו ברתמה במקום קולר."},
   {"title":"בידוד","body":"הרחיקו מכלבים אחרים למשך כשבועיים."}]',
 'אם יש חום, חוסר תיאבון, קושי בנשימה, או בגורים ובמבוגרים.',
 'חיסון לשעלת המלונות לפני פנסיון או מגע רב עם כלבים.',
 '{}', array['שיעול', 'מדבק'], 230),

('obesity', 'condition', 'endocrine', 'home_care',
 'עודף משקל',
 'אחת הבעיות הבריאותיות השכיחות ביותר בכלבים, שמקצרת חיים ומחמירה בעיות מפרקים, נשימה וסוכרת.',
 'מחקר ארוך טווח בלברדורים מצא שכלבים שהוזנו בכמות מבוקרת חיו בממוצע כשנתיים יותר מאחיהם שהוזנו בחופשיות.',
 array['לא מרגישים את הצלעות בקלות', 'אין ״מותניים״ במבט מלמעלה', 'התנשפות מהירה במאמץ', 'חוסר רצון לזוז'],
 'עודף מזון וחטיפים, מעט פעילות, עיקור (מוריד צורך אנרגטי), גנטיקה.',
 '[{"title":"מדדו","body":"שקלו מנות במשקל מטבח במקום ״כוס״."},
   {"title":"נכו חטיפים","body":"חטיפים לא יעלו על כ-10% מהקלוריות היומיות."},
   {"title":"פעילות","body":"הוסיפו טיולים ומשחקי חשיבה."},
   {"title":"מעקב","body":"שקילה כל שבועיים–ארבעה ותיעוד ב-Dog OS."}]',
 'לתוכנית הרזיה מבוקרת ולשלילת בעיות הורמונליות.',
 'מעקב משקל קבוע וחישוב מנות.',
 array['labrador', 'golden-retriever', 'beagle', 'dachshund', 'pug'],
 array['משקל', 'תזונה'], 240),

-- ---------------------------------------------------------------- Breed health guides
('breed-german-shepherd', 'breed_health', 'musculoskeletal', null,
 'רועה גרמני: בריאות ונטיות גנטיות',
 'רועה גרמני נוטה לבעיות מפרקים, למחלה ניוונית של חוט השדרה ולבעיות עיכול.',
 'הנטיות העיקריות: דיספלזיה של מפרקי הירכיים והמרפקים; מיאלופתיה ניוונית (DM) – מחלה מתקדמת של חוט השדרה שגורמת לחולשה ברגליים האחוריות בגיל מבוגר; אי-ספיקה של הלבלב החיצוני (EPI); תסביב קיבה; ודלקת עור ופי הטבעת.',
 array['קושי בקימה וצליעה', 'גרירת רגליים אחוריות בגיל מבוגר', 'צואה רכה ושמנונית עם ירידה במשקל', 'בטן נפוחה'],
 'נטייה גנטית שמושפעת גם מגדילה מהירה ומשקל.',
 '[{"title":"בדיקות לגורים","body":"בקשו מהמגדל תוצאות בדיקות ירכיים ומרפקים של ההורים."},
   {"title":"גדילה מבוקרת","body":"מזון לגורים מגזע גדול והימנעות מעומס יתר על המפרקים בשנה הראשונה."},
   {"title":"מעקב משקל","body":"משקל תקין מפחית מאוד את תסמיני הדיספלזיה."}]',
 'בכל צליעה, חולשה ברגליים אחוריות או שינוי בצואה.',
 'בדיקות גנטיות, גדילה מבוקרת, ושקילת קיבוע קיבה מונע.',
 array['german-shepherd'], array['רועה גרמני', 'דיספלזיה'], 310),

('breed-brachycephalic', 'breed_health', 'respiratory', null,
 'גזעים ברכיצפליים (בולדוג, פאג): תסמונת דרכי הנשימה',
 'הפנים השטוחות גורמות להיצרות דרכי האוויר. התסמונת (BOAS) משפיעה על נשימה, שינה, סבילות לחום ועיכול.',
 'BOAS כוללת נחיריים צרים, חך רך ארוך, קנה נשימה צר ולעתים קריסת גרון. בנוסף נפוצים קפלי עור מודלקים, בעיות עיניים (קרנית חשופה), אלרגיות עור ובעיות עמוד שדרה.',
 array['נחירות חזקות גם בערות', 'קושי בנשימה במאמץ או בחום', 'שינה בישיבה או עם צעצוע בפה', 'פליטות והקאות', 'עילפון'],
 'מבנה גולגולת שנבחר בגידול.',
 '[{"title":"הגנה מחום","body":"גזעים אלה רגישים מאוד למכת חום – פעילות רק בשעות קרירות."},
   {"title":"רתמה במקום קולר","body":"לחץ על הצוואר מחמיר את הקושי בנשימה."},
   {"title":"משקל תקין","body":"גם מעט עודף משקל מחמיר מאוד את הנשימה."},
   {"title":"הערכה כירורגית","body":"ניתוח להרחבת נחיריים וקיצור חך רך משפר מאוד את איכות החיים בכלבים רבים."}]',
 'בכל קושי נשימה, כחלון חניכיים או עילפון – מיד.',
 'בחירת כלבים עם נחיריים פתוחים יותר ובדיקות נשימה להורים.',
 array['french-bulldog', 'english-bulldog', 'pug', 'shih-tzu', 'boxer'], array['ברכיצפלי', 'נשימה', 'BOAS'], 320),

('breed-doberman', 'breed_health', 'cardiovascular', null,
 'דוברמן: קרדיומיופתיה מורחבת (DCM)',
 'שיעור גבוה מאוד מהדוברמנים מפתחים מחלת שריר לב שעלולה להתבטא במוות פתאומי. סקר שנתי מאפשר זיהוי מוקדם.',
 'ב-DCM שריר הלב נחלש ומתרחב. בדוברמנים המחלה נמשכת שנים בשלב ״שקט״ שבו יש הפרעות קצב בלבד. הולטר (רישום א.ק.ג. של 24 שעות) ואקו-לב מזהים אותה לפני שמופיעים סימנים. גם מחלת פון וילברנד (הפרעת קרישה) שכיחה בגזע.',
 array['עייפות מהירה', 'שיעול', 'נשימה מהירה במנוחה', 'עילפונים', 'בטן נפוחה'],
 'נטייה גנטית.',
 '[{"title":"סקר שנתי","body":"מגיל 2–3: הולטר ואקו-לב לפי המלצת קרדיולוג."},
   {"title":"בדיקת קרישה","body":"לפני ניתוח – לבדוק פון וילברנד."}]',
 'מיד בכל עילפון או קושי נשימה.',
 'בדיקות גנטיות להורים וסקר לב שגרתי.',
 array['doberman'], array['לב', 'דוברמן'], 330),

('breed-dachshund', 'breed_health', 'neurological', null,
 'תחש ובעלי גב ארוך: פריצת דיסק (IVDD)',
 'מבנה הגוף של התחש חושף אותו לפריצות דיסק שעלולות לגרום לכאב עז ואף לשיתוק.',
 'בגזעים כונדרודיסטרופיים הדיסקים מתנוונים מוקדם ועלולים לפרוץ לתעלת חוט השדרה. מחקרים מעריכים שכרבע מהתחשים יחוו בעיית דיסק במהלך חייהם.',
 array['כאב גב, גב מקומר', 'חוסר רצון לזוז או לעלות מדרגות', 'רעד', 'הליכה מתנדנדת', 'חולשה או שיתוק ברגליים'],
 'נטייה גנטית, קפיצות, עודף משקל.',
 '[{"title":"הגבלה מיידית","body":"בחשד לפריצת דיסק – מנוחה מלאה והובלה עם גב ישר."},
   {"title":"וטרינר מיד בשיתוק","body":"איבוד תנועה או תחושה ברגליים הוא מקרה חירום; הזמן קריטי."}]',
 'מיד בכל חולשה או שיתוק; תוך יום בכאב גב.',
 'שמירה על משקל, רמפות במקום קפיצות, והרמה עם תמיכה בגב.',
 array['dachshund', 'french-bulldog', 'shih-tzu', 'beagle'], array['גב', 'דיסק', 'שיתוק'], 340),

('breed-cavalier', 'breed_health', 'cardiovascular', null,
 'קבליר קינג צ׳ארלס ספניאל: מחלת המסתם המיטרלי',
 'רוב הקבלירים יפתחו מחלת מסתם בלב, לעתים כבר בגיל צעיר. מעקב והתחלת טיפול בזמן משפרים מאוד את התחזית.',
 'מחלת המסתם המיטרלי (MMVD) גורמת לדליפה במסתם ובהמשך לאי-ספיקת לב. בגזע שכיחה גם סירינגומיאליה – חללים בחוט השדרה שגורמים לכאב וגירוד באזור הצוואר.',
 array['אוושה בלב בבדיקה', 'שיעול', 'נשימה מהירה בשינה', 'עייפות', 'גירוד ״באוויר״ באזור הצוואר'],
 'נטייה גנטית.',
 '[{"title":"ספירת נשימות בשינה","body":"מעל 30 נשימות לדקה בשינה – פנו לווטרינר. זה מדד ביתי פשוט ויעיל."},
   {"title":"בדיקות לב","body":"האזנה שנתית ואקו-לב לפי המלצה."}]',
 'בכל עלייה בקצב הנשימה במנוחה או שיעול.',
 'בדיקות לב להורים ומעקב.',
 array['cavalier'], array['לב', 'קבליר'], 350),

('breed-giant', 'breed_health', 'musculoskeletal', null,
 'גזעים ענקיים (דני ענק ודומיו)',
 'גדילה מהירה, משקל גבוה ותוחלת חיים קצרה יחסית מביאים לנטיות ייחודיות.',
 'גזעים ענקיים בסיכון גבוה לתסביב קיבה, לקרדיומיופתיה מורחבת, לגידולי עצם (אוסטאוסרקומה) ולבעיות גדילה של שלד.',
 array['צליעה מתמשכת או נפיחות בעצם', 'בטן נפוחה והקאה יבשה', 'עייפות או שיעול'],
 'גנטיקה וגדילה מהירה.',
 '[{"title":"תזונת גורים מותאמת","body":"מזון לגורים מגזע ענק עם סידן מבוקר."},
   {"title":"קיבוע קיבה","body":"שקלו עם הווטרינר קיבוע מונע."}]',
 'בכל צליעה מתמשכת או סימני GDV.',
 'גדילה מבוקרת וסקר לב.',
 array['great-dane'], array['גזע ענק', 'GDV'], 360),

('breed-retrievers', 'breed_health', 'musculoskeletal', null,
 'לברדור וגולדן רטריבר',
 'כלבים בריאים יחסית, אך נוטים להשמנה, לדיספלזיה ולמחלות עור ואוזניים. בגולדן שכיחות גבוהה של סרטן.',
 'לברדורים נושאים לעתים וריאנט גנטי שמגביר תיאבון. שכיחות גבוהה של דיספלזיה במרפקים ובירכיים, דלקות אוזניים, אלרגיות, ובגולדן – המנגיוסרקומה ולימפומה.',
 array['השמנה', 'צליעה', 'גירוד ודלקות אוזניים', 'גושים חדשים', 'חולשה פתאומית וחיוורון (דימום פנימי)'],
 'גנטיקה ותזונה.',
 '[{"title":"מנות מדודות","body":"שקילת מזון ונטרול ״פרצופי רעב״."},
   {"title":"בדיקת גושים","body":"כל גוש חדש – לבדיקה."},
   {"title":"בדיקות שנתיות","body":"מגיל 7 – פעמיים בשנה."}]',
 'בכל גוש חדש, צליעה או חולשה פתאומית.',
 'שמירה על משקל ומעקב שגרתי.',
 array['labrador', 'golden-retriever'], array['רטריבר', 'השמנה'], 370),

('breed-mdr1', 'breed_health', 'neurological', null,
 'רגישות תרופתית MDR1 בכלבי רועים',
 'מוטציה גנטית בכלבי רועים רבים גורמת לרגישות מסוכנת לתרופות מסוימות, כולל איברמקטין במינונים גבוהים.',
 'הגן MDR1 (ABCB1) אחראי למשאבה שמוציאה תרופות מהמוח. כלבים עם המוטציה עלולים לפתח הרעלה עצבית מתרופות שבטוחות לכלבים אחרים. המוטציה שכיחה בקולי, רועה אוסטרלי, שלטי ועוד.',
 array['רעד, חוסר קואורדינציה', 'ריור', 'עיוורון זמני', 'תרדמת – במקרים קשים'],
 'מוטציה גנטית.',
 '[{"title":"בדיקה גנטית","body":"בדיקת MDR1 פשוטה (מטוש לחי או דם)."},
   {"title":"עדכון הווטרינר","body":"ודאו שהתיק הרפואי מציין רגישות."}]',
 'מיד בכל סימן עצבי אחרי טיפול תרופתי.',
 'בדיקה גנטית לפני מתן תרופות בסיכון.',
 array['collie', 'australian-shepherd', 'border-collie', 'shetland-sheepdog'], array['תרופות', 'גנטיקה', 'רועים'], 380),

-- ---------------------------------------------------------------- Preventive care
('vaccination-schedule', 'preventive', 'multisystem', null,
 'לוח חיסונים לפי גיל',
 'סדרת החיסונים הגורית, חיסוני דחף, וחיסון הכלבת – שבישראל הוא חובה על פי חוק.',
 'גורים: חיסון משולב (דיסטמפר, הפטיטיס, פרבו, פראאינפלואנזה ולעתים לפטוספירה) בגיל 6–8 שבועות, וחיסוני המשך כל 3–4 שבועות עד גיל 16 שבועות לפחות. חיסון כלבת – מגיל 3 חודשים, ובישראל חובה לחסן מדי שנה ולסמן בשבב. דחף לגורים בגיל שנה. לאחר מכן – חיסונים לפי המלצת הווטרינר והרגולציה. חיסונים נוספים לפי סיכון: שעלת המלונות, לפטוספירה.',
 '{}', '',
 '[{"title":"תעדו","body":"הוסיפו כל חיסון ב-Dog OS עם תאריך הבא, כדי לקבל תזכורת בלוח הבקרה."},
   {"title":"אל תפספסו","body":"פער בסדרה הגורית משאיר את הגור חשוף. אם פספסתם – התייעצו עם הווטרינר."}]',
 'לתכנון לוח מותאם לכלב.',
 'שמירה על לוח חיסונים מלא היא אמצעי המניעה החשוב ביותר נגד מחלות מדבקות.',
 '{}', array['חיסונים', 'כלבת', 'גורים', 'ישראל'], 410),

('external-parasites', 'preventive', 'dermatological', null,
 'קרציות ופרעושים',
 'בישראל, האקלים מאפשר פעילות קרציות ופרעושים לאורך כל השנה. טיפול מונע רציף הוא הבסיס.',
 'קרציות מעבירות מחלות דם (ארליכיה, בבזיה), ופרעושים גורמים לאלרגיה ומעבירים תולעת סרט. קיימים תכשירים בטבליות, קולרים ותכשירי טפטוף – כל אחד עם יתרונות.',
 '{}', '',
 '[{"title":"טיפול רציף","body":"ללא הפסקות בחורף. קבעו תזכורת קבועה."},
   {"title":"סריקה","body":"אחרי טיולים בשטח – סרקו אוזניים, בין האצבעות, צוואר ובתי שחי."},
   {"title":"סביבה","body":"שאיבה, כביסה חמה למצעים, וטיפול בחצר במקרה של נגיעות."}]',
 'לבחירת תכשיר מתאים, במיוחד בגורים, כלבות בהריון וכלבי רועים (רגישות MDR1).',
 'טיפול מונע לכל בעלי החיים בבית.',
 '{}', array['קרציות', 'פרעושים'], 420),

('internal-parasites', 'preventive', 'gastrointestinal', null,
 'תולעים פנימיות ותולעת הלב',
 'תילוע קבוע מגן על הכלב ועל בני המשפחה. בישראל קיימות גם תולעת הלב וספירוצרקה.',
 'תולעים עגולות ותולעי סרט שכיחות בגורים ובכלבים שאוכלים בטבע. תולעת הלב מועברת ביתושים ופוגעת בלב ובריאות. ספירוצרקה פוגעת בוושט.',
 '{}', '',
 '[{"title":"גורים","body":"תילוע כל שבועיים עד גיל 12 שבועות, ואחר כך כל חודש עד חצי שנה – לפי הנחיית וטרינר."},
   {"title":"בוגרים","body":"תילוע לפחות 3–4 פעמים בשנה, ובמקרים מסוימים חודשי."},
   {"title":"מניעת תולעת לב","body":"תכשיר חודשי מתאים, בעיקר בעונת היתושים."}]',
 'לבחירת תוכנית מתאימה.',
 'תילוע קבוע, איסוף צואה ומניעת אכילה מהקרקע.',
 '{}', array['תולעים', 'תולעת הלב'], 430),

('life-stage-nutrition', 'preventive', 'gastrointestinal', null,
 'תזונה לפי שלבי חיים',
 'הצרכים התזונתיים משתנים מגור לבוגר ולמבוגר. ההתאמה הנכונה תומכת בגדילה, במשקל ובבריאות לטווח ארוך.',
 'גורים זקוקים ליותר אנרגיה וחלבון, ובגזעים גדולים – לסידן מבוקר. בוגרים – אנרגיה לפי פעילות, עיקור ומשקל. מבוגרים – לעתים פחות קלוריות ויותר תמיכה במפרקים ובכליות. מחשבון המנות ב-Dog OS משתמש בנוסחת RER (70 × משקל בק״ג בחזקת 0.75) ובמקדמים לפי גיל ופעילות.',
 '{}', '',
 '[{"title":"מזון שלם ומאוזן","body":"בחרו מזון שמסומן כמלא ומאוזן לשלב החיים המתאים."},
   {"title":"מעבר הדרגתי","body":"7–10 ימים של ערבוב בין המזון הישן לחדש."},
   {"title":"מדדו","body":"שקילת מנות ושקילת הכלב באופן קבוע."}]',
 'לפני דיאטה ביתית או טבעונית – רק בליווי וטרינר או תזונאי מוסמך.',
 'מנות מדודות ומעקב משקל.',
 '{}', array['תזונה', 'גורים', 'מבוגרים'], 440),

('senior-care', 'preventive', 'multisystem', null,
 'כלבים מבוגרים',
 'מגיל 7 בערך (מוקדם יותר בגזעים גדולים) מומלץ מעבר לבדיקות פעמיים בשנה וזיהוי מוקדם של מחלות.',
 'כלבים מבוגרים מסתירים כאב ומחלה היטב. בדיקות דם ושתן תקופתיות מזהות מחלות כליות, כבד והורמונים מוקדם. שינויים התנהגותיים עלולים להעיד על כאב או על תסמונת קוגניטיבית.',
 '{}', '',
 '[{"title":"בדיקות פעמיים בשנה","body":"כולל בדיקות דם ושתן."},
   {"title":"נוחות","body":"מיטה תומכת, משטחים נגד החלקה ורמפות."},
   {"title":"גירוי מנטלי","body":"משחקי חשיבה ועבודת ריח שומרים על חדות."}]',
 'בכל שינוי בשתייה, תיאבון, משקל, שינה או התנהגות.',
 'מעקב צמוד ושמירה על משקל ופעילות.',
 '{}', array['מבוגרים', 'בדיקות'], 450),

-- ---------------------------------------------------------------- Medications
('toxic-human-medications', 'medication', 'multisystem', 'emergency',
 'תרופות של בני אדם שמסוכנות לכלבים',
 'תרופות נפוצות בארון התרופות הביתי עלולות להיות קטלניות לכלבים – גם בכמויות קטנות.',
 'הרעלות תרופתיות הן מהשכיחות ביותר. כלבים מפרקים תרופות רבות אחרת מבני אדם.',
 array['הקאות', 'כאבי בטן', 'רעד או פרכוסים', 'חולשה', 'שינויים בהתנהגות'],
 'מסוכנות במיוחד: נוגדי דלקת לא סטרואידיים של בני אדם (איבופרופן, נפרוקסן) – כיבי קיבה ופגיעה בכליות; פרצטמול (אקמול) – פגיעה בכבד ובדם; פסאודואפדרין (בתרופות להצטננות); תרופות להפרעת קשב; תרופות נוגדות דיכאון; תרופות שינה; תרופות לב.',
 '[{"title":"מיד לווטרינר","body":"גם בכמות קטנה. קחו את האריזה."},
   {"title":"אל תטפלו בבית","body":"לעולם אל תתנו לכלב משכך כאבים של בני אדם ״כדי להקל״."}]',
 'מיד.',
 'שמרו תרופות סגורות והרחק מהישג יד. שימו לב לכדורים שנפלו לרצפה.',
 '{}', array['תרופות', 'הרעלה', 'אקמול', 'איבופרופן'], 510),

('medication-safety', 'medication', 'multisystem', null,
 'כללי בטיחות במתן תרופות',
 'איך לתת תרופות בבטחה, למה אסור לחשב מינונים בעצמכם, ומה לבדוק עם הווטרינר.',
 'המינון לכלב תלוי במשקל, באבחנה, בתפקודי כבד וכליות, בתרופות נוספות ובגזע (למשל רגישות MDR1). לכן Dog OS אינה מציעה מחשבון מינונים – מינון שגוי עלול להיות מסוכן.',
 '{}', '',
 '[{"title":"רק לפי מרשם","body":"תנו רק תרופות שנרשמו לכלב שלכם, במינון ובתדירות שנקבעו."},
   {"title":"השלימו את הטיפול","body":"אנטיביוטיקה – עד הסוף, גם אם הכלב נראה בריא."},
   {"title":"עקבו אחר תופעות לוואי","body":"בנוגדי דלקת: הקאות, צואה שחורה, ירידה בתיאבון – הפסיקו ופנו לווטרינר."},
   {"title":"מתן כדורים","body":"בתוך חטיף רך, עם ״חטיף-כדור-חטיף״ מהר. אל תמעכו כדורים בלי לשאול – חלקם מצופים מסיבה."}]',
 'בכל שאלה על מינון או שילוב תרופות.',
 'רשימת תרופות מעודכנת – אפשר לרשום ב״הערות רפואיות״ ב-Dog OS.',
 '{}', array['תרופות', 'מינון', 'בטיחות'], 520),

('giving-medication', 'medication', null, 'home_care',
 'איך לתת כדורים, טיפות ומשחות',
 'טכניקות מעשיות שהופכות את מתן התרופות לפחות מלחיץ לכלב ולכם.',
 'אימון מוקדם (טיפול שיתופי) עוזר מאוד. ככל שהחוויה חיובית יותר – קל יותר בפעמים הבאות.',
 '{}', '',
 '[{"title":"כדורים","body":"״שלישיית חטיפים״: חטיף ריק, חטיף עם כדור, חטיף ריק – ברצף מהיר."},
   {"title":"טיפות עיניים","body":"מהצד ומעל הראש, כשהיד נשענת על הראש. חטיף מיד אחרי."},
   {"title":"טיפות אוזניים","body":"לטפטף, לעסות את בסיס האוזן, ולתת לכלב לנער – רחוק מהספה."}]',
 'אם הכלב מסרב בתוקף או מקיא את התרופה.',
 'אימון מוקדם לטיפולים.',
 '{}', array['כדורים', 'טיפות'], 530)
on conflict (id) do nothing;

-- ============================================================================
-- Symptoms (for the triage checker)
-- ============================================================================

insert into public.vet_symptoms (id, name, description, base_urgency, red_flags, sort_order) values
('vomiting', 'הקאות', 'פליטת תוכן קיבה.', 'vet_visit',
  array['ניסיונות הקאה בלי שיוצא דבר', 'דם בהקאה', 'בטן נפוחה', 'הקאות חוזרות יותר מ-3 פעמים ביום', 'חשד לבליעת רעל או חפץ'], 10),
('diarrhea', 'שלשול', 'צואה רכה או נוזלית.', 'home_care',
  array['דם רב או צואה שחורה', 'גור לא מחוסן', 'חולשה או התייבשות', 'הקאות במקביל'], 20),
('not-eating', 'חוסר תיאבון', 'סירוב לאכול יותר מארוחה אחת.', 'vet_visit',
  array['יותר מ-24 שעות בלי אכילה', 'גור או כלב סוכרתי', 'חולשה'], 30),
('lethargy', 'עייפות וחולשה', 'פחות אנרגיה מהרגיל.', 'vet_visit',
  array['קריסה', 'חניכיים חיוורות', 'חוסר תגובה'], 40),
('coughing', 'שיעול', 'שיעול יבש או רטוב.', 'home_care',
  array['קושי בנשימה', 'חניכיים כחלחלות', 'שיעול דם'], 50),
('breathing-difficulty', 'קושי בנשימה', 'נשימה מאומצת או מהירה במנוחה.', 'emergency', '{}', 60),
('pale-gums', 'חניכיים חיוורות או כחולות', 'חניכיים לבנות, אפורות או כחלחלות.', 'emergency', '{}', 70),
('swollen-abdomen', 'בטן נפוחה', 'בטן מוגדלת וקשה, לעתים עם אי-שקט.', 'emergency', '{}', 80),
('limping', 'צליעה', 'הימנעות מדריכה על רגל.', 'vet_visit',
  array['רגל בזווית לא טבעית', 'חוסר יכולת לעמוד', 'שיתוק'], 90),
('back-pain', 'כאב גב או חולשה ברגליים', 'גב מקומר, רעד, היסוס במדרגות.', 'vet_visit',
  array['חולשה או גרירה של רגליים', 'אובדן שליטה בשתן'], 100),
('itching', 'גירוד', 'גירוד, ליקוק או לעיסה של העור.', 'home_care',
  array['פנים או לשון נפוחות', 'פצעים פתוחים'], 110),
('ear-scratching', 'ניעור ראש וגירוד באוזן', 'ניעור, שפשוף או הפרשה מהאוזן.', 'vet_visit',
  array['הטיית ראש', 'איבוד שיווי משקל'], 120),
('excessive-thirst', 'שתייה והטלת שתן מוגברות', 'שתייה מרובה מהרגיל.', 'vet_visit',
  array['הקאות', 'חולשה'], 130),
('straining-urination', 'מאמץ בהטלת שתן', 'מאמץ, טיפות או דם בשתן.', 'vet_visit',
  array['אין שתן בכלל למרות מאמץ'], 140),
('seizure', 'פרכוס', 'רעד בלתי נשלט, נפילה, איבוד הכרה.', 'emergency', '{}', 150),
('drooling-mouth-swelling', 'ריור ונפיחות בפה', 'ריור פתאומי, לשון או פנים נפוחות.', 'emergency', '{}', 160),
('heavy-panting-heat', 'התנשפות כבדה בחום', 'התנשפות שאינה נרגעת אחרי מאמץ או חשיפה לחום.', 'emergency', '{}', 170),
('bleeding', 'דימום', 'דימום מפצע, מהאף או מהחניכיים.', 'vet_visit',
  array['דימום שלא נעצר בלחץ', 'דימום ללא פציעה ידועה', 'חולשה'], 180),
('weight-loss', 'ירידה במשקל', 'ירידה במשקל ללא שינוי בתזונה.', 'vet_visit', '{}', 190),
('bad-breath', 'ריח רע מהפה', 'ריח חזק, אבנית.', 'home_care',
  array['נפיחות בפנים', 'סירוב לאכול'], 200)
on conflict (id) do nothing;

insert into public.vet_symptom_conditions (symptom_id, article_id) values
('vomiting', 'gastroenteritis'), ('vomiting', 'gdv-bloat'), ('vomiting', 'poisoning'), ('vomiting', 'parvovirus'),
('vomiting', 'spirocercosis'), ('vomiting', 'toxic-human-medications'), ('vomiting', 'heatstroke'),
('diarrhea', 'gastroenteritis'), ('diarrhea', 'parvovirus'), ('diarrhea', 'poisoning'), ('diarrhea', 'internal-parasites'),
('not-eating', 'gastroenteritis'), ('not-eating', 'tick-borne-diseases'), ('not-eating', 'dental-disease'), ('not-eating', 'parvovirus'),
('lethargy', 'tick-borne-diseases'), ('lethargy', 'heatstroke'), ('lethargy', 'parvovirus'), ('lethargy', 'diabetes'), ('lethargy', 'breed-doberman'),
('coughing', 'kennel-cough'), ('coughing', 'breed-cavalier'), ('coughing', 'breed-doberman'), ('coughing', 'internal-parasites'),
('breathing-difficulty', 'breathing-difficulty'), ('breathing-difficulty', 'breed-brachycephalic'), ('breathing-difficulty', 'heatstroke'), ('breathing-difficulty', 'breed-cavalier'),
('pale-gums', 'tick-borne-diseases'), ('pale-gums', 'trauma-bleeding'), ('pale-gums', 'gdv-bloat'), ('pale-gums', 'poisoning'),
('swollen-abdomen', 'gdv-bloat'), ('swollen-abdomen', 'breed-giant'),
('limping', 'ccl-rupture'), ('limping', 'osteoarthritis'), ('limping', 'trauma-bleeding'), ('limping', 'snake-bite'), ('limping', 'breed-german-shepherd'),
('back-pain', 'breed-dachshund'), ('back-pain', 'osteoarthritis'),
('itching', 'atopic-dermatitis'), ('itching', 'external-parasites'), ('itching', 'leishmaniasis'),
('ear-scratching', 'otitis'), ('ear-scratching', 'atopic-dermatitis'),
('excessive-thirst', 'diabetes'), ('excessive-thirst', 'urinary-issues'), ('excessive-thirst', 'leishmaniasis'),
('straining-urination', 'urinary-issues'),
('seizure', 'seizures'), ('seizure', 'poisoning'), ('seizure', 'heatstroke'), ('seizure', 'breed-mdr1'),
('drooling-mouth-swelling', 'processionary-caterpillar'), ('drooling-mouth-swelling', 'snake-bite'), ('drooling-mouth-swelling', 'poisoning'),
('heavy-panting-heat', 'heatstroke'), ('heavy-panting-heat', 'breed-brachycephalic'),
('bleeding', 'trauma-bleeding'), ('bleeding', 'tick-borne-diseases'), ('bleeding', 'poisoning'), ('bleeding', 'leishmaniasis'),
('weight-loss', 'leishmaniasis'), ('weight-loss', 'spirocercosis'), ('weight-loss', 'diabetes'), ('weight-loss', 'breed-german-shepherd'),
('bad-breath', 'dental-disease')
on conflict (symptom_id, article_id) do nothing;

-- ================================================================================================
-- 20261018120400_journal_and_insights.sql
-- ================================================================================================
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

-- ================================================================================================
-- 20261018120500_user_consents.sql
-- ================================================================================================
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

-- ================================================================================================
-- 20261018120600_support_requests.sql
-- ================================================================================================
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

-- ================================================================================================
-- 20261018120700_ai_opt_out_and_weight_sync.sql
-- ================================================================================================
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

-- ================================================================================================
-- 20261019000000_harden_profile_updates.sql
-- ================================================================================================
-- Least privilege on profiles: the table-wide UPDATE grant let a client rewrite bookkeeping columns
-- (created_at, updated_at). RLS already limits updates to the caller's own row; column grants now limit
-- them to the fields the app edits. id is covered by RLS's WITH CHECK, timestamps by the trigger.

revoke update on table public.profiles from authenticated;
grant update (display_name, active_dog_id, onboarding_completed) on table public.profiles to authenticated;

-- ================================================================================================
-- 20261019150000_canine_knowledge_base.sql
-- ================================================================================================
-- Canine Knowledge Base: verified canine knowledge chunks with embeddings, searched semantically
-- (pgvector, cosine) to ground the AI chat and insights in reviewed content instead of model recall.
--
-- Security model:
--   * Shared, non-personal reference content: readable by anon and authenticated users.
--   * Writable only by the service role (ingestion pipeline / migrations). No client write grants exist,
--     and service_role bypasses RLS, so no write policies are needed.
--   * match_knowledge_base runs as SECURITY INVOKER, so the table's RLS applies to every search.

-- Supabase installs extensions into the `extensions` schema. If vector is already enabled elsewhere this
-- is a no-op; everything below references the type unqualified and the function pins a search_path that
-- covers both locations.
create extension if not exists vector with schema extensions;

create table public.canine_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  -- Keep in sync with KnowledgeBaseCategory in src/lib/database.types.ts.
  category text not null check (category in ('nutrition', 'triage', 'breed_traits', 'behavior', 'vaccinations')),
  title text not null check (char_length(title) between 1 and 300),
  content text not null check (char_length(content) between 1 and 20000),
  -- { "tags": string[], "source": string, "urgency": string, ... } – free-form, but always an object.
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  -- 1536 dimensions = OpenAI text-embedding-3-small / ada-002. Null until the ingestion job embeds the row;
  -- such rows are never returned by search.
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HNSW over cosine distance: better recall/latency than IVFFlat and, unlike IVFFlat, needs no training
-- data, so it can be built on an empty table and stays accurate as rows are added.
create index canine_knowledge_base_embedding_idx on public.canine_knowledge_base
  using hnsw (embedding vector_cosine_ops);
create index canine_knowledge_base_category_idx on public.canine_knowledge_base (category);

create trigger canine_knowledge_base_set_updated_at
  before update on public.canine_knowledge_base
  for each row execute function public.set_updated_at();

alter table public.canine_knowledge_base enable row level security;

create policy "canine_knowledge_base_read" on public.canine_knowledge_base
  for select to anon, authenticated using (true);

revoke all on table public.canine_knowledge_base from anon, authenticated;
grant select on table public.canine_knowledge_base to anon, authenticated;

-- Semantic search. similarity = 1 - cosine distance (1 = identical direction). Ordering by the raw
-- distance expression lets the planner use the HNSW index. match_count is clamped to 1..40: HNSW returns
-- at most hnsw.ef_search (default 40) candidates per scan, so larger requests would silently truncate.
create or replace function public.match_knowledge_base(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_category text default null
)
returns table (
  id uuid,
  category text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  select
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.canine_knowledge_base kb
  where kb.embedding is not null
    and (filter_category is null or kb.category = filter_category)
    and 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by kb.embedding <=> query_embedding
  limit least(greatest(coalesce(match_count, 5), 1), 40);
$$;

revoke all on function public.match_knowledge_base(vector, float, int, text) from public;
grant execute on function public.match_knowledge_base(vector, float, int, text) to anon, authenticated, service_role;

-- ================================================================================================
-- Migration history, in the Supabase CLI's format, so a later `supabase link` + `db push` skips these.
-- ================================================================================================
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
insert into supabase_migrations.schema_migrations (version, name) values
  ('20261018000000', 'init'),
  ('20261018120000', 'core_schema'),
  ('20261018120100', 'seed_training_modules'),
  ('20261018120200', 'training_knowledge_base'),
  ('20261018120300', 'veterinary_knowledge_base'),
  ('20261018120400', 'journal_and_insights'),
  ('20261018120500', 'user_consents'),
  ('20261018120600', 'support_requests'),
  ('20261018120700', 'ai_opt_out_and_weight_sync'),
  ('20261019000000', 'harden_profile_updates'),
  ('20261019150000', 'canine_knowledge_base')
on conflict (version) do nothing;

commit;
