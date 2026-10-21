-- Dog OS: the migrations not yet confirmed on project jzzvwwvznqzuiwcifaad, in order, as ONE transaction.
-- Paste into Supabase Dashboard -> SQL Editor -> Run. If any statement fails, nothing is applied.
-- Regenerated 2026-10-21 from supabase/migrations/ (the CLI ignores this folder). 20261018120000–120700
-- are live already. 20261019000000 is included because it can't be verified from outside and is safe to
-- re-run (a revoke and a grant). Safe to delete after running.

begin;

-- ================================================================================================
-- 20261019000000_harden_profile_updates.sql
-- ================================================================================================
-- Least privilege on profiles: the table-wide UPDATE grant let a client rewrite bookkeeping columns
-- (created_at, updated_at). RLS already limits updates to the caller's own row; column grants now limit
-- them to the fields the app edits. id is covered by RLS's WITH CHECK, timestamps by the trigger.

revoke update on table public.profiles from authenticated;
grant update (display_name, active_dog_id, onboarding_completed) on table public.profiles to authenticated;

-- ================================================================================================
-- 20261021120000_knowledge_chunks.sql
-- ================================================================================================
-- AI advisor knowledge base: verified, sourced Hebrew knowledge chunks with embeddings, searched
-- semantically (pgvector, cosine) so the advisor answers from reviewed content instead of model recall.
--
-- Security model:
--   * Shared, non-personal reference content: readable by anon and authenticated users – but only rows
--     marked is_verified, enforced by RLS, so unreviewed content is invisible to every client query.
--   * Writable only by the service role (ingestion pipeline / migrations): clients get SELECT and nothing
--     else, and the only write policy names service_role.
--   * match_dog_knowledge runs as SECURITY INVOKER, so the table's RLS applies to every search.

-- pgvector lives in `extensions`, never in public (Supabase's recommended layout).
create extension if not exists vector with schema extensions;
set search_path to public, extensions;

-- ---------------------------------------------------------------------------------------------------
-- knowledge_chunks
-- ---------------------------------------------------------------------------------------------------
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  -- Keep in sync with KnowledgeChunkCategory in src/lib/database.types.ts.
  category text not null check (category in (
    'EMERGENCY_TOXICOLOGY',
    'CLINICAL_NUTRITION',
    'ETHOLOGY_BEHAVIOR',
    'TRAINING_DRIVE',
    'ISRAEL_REGULATION_BREEDS'
  )),
  title_he text not null check (char_length(title_he) between 1 and 300),
  content_he text not null check (char_length(content_he) between 1 and 20000),
  -- Where the content comes from (e.g. "Merck Veterinary Manual – Chocolate Toxicosis"). Required: a chunk
  -- the advisor cannot attribute is a chunk it cannot ground an answer in.
  source_reference text not null check (char_length(btrim(source_reference)) between 1 and 500),
  -- Default per the product spec. The ingestion job must set it deliberately: false until reviewed.
  is_verified boolean not null default true,
  -- 1536 dimensions = OpenAI text-embedding-3-small. Null until the ingestion job embeds the row; such
  -- rows are never returned by search.
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HNSW over cosine distance: good recall/latency, and unlike IVFFlat it needs no training data, so it can
-- be built on an empty table and stays accurate as rows are added.
create index knowledge_chunks_embedding_idx on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);
create index knowledge_chunks_category_idx on public.knowledge_chunks (category);

create trigger knowledge_chunks_set_updated_at
  before update on public.knowledge_chunks
  for each row execute function public.set_updated_at();

alter table public.knowledge_chunks enable row level security;

create policy "knowledge_chunks_read_verified" on public.knowledge_chunks
  for select to anon, authenticated using (is_verified);

-- service_role already bypasses RLS; the explicit policy documents the rule and survives a role change.
create policy "knowledge_chunks_service_write" on public.knowledge_chunks
  for all to service_role using (true) with check (true);

revoke all on table public.knowledge_chunks from anon, authenticated;
grant select on table public.knowledge_chunks to anon, authenticated;
grant select, insert, update, delete on table public.knowledge_chunks to service_role;

-- ---------------------------------------------------------------------------------------------------
-- match_dog_knowledge – semantic search over verified chunks
-- ---------------------------------------------------------------------------------------------------
-- similarity = 1 - cosine distance (1 = identical direction). The 0.82 default keeps only close matches:
-- below it the advisor says it does not know rather than stretching a loosely related chunk. Ordering by
-- the raw distance expression lets the planner use the HNSW index. match_count is clamped to 1..40: HNSW
-- returns at most hnsw.ef_search (default 40) candidates per scan, so larger requests would truncate.
create or replace function public.match_dog_knowledge(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.82,
  match_count int default 5,
  filter_category text default null
)
returns table (
  id uuid,
  category text,
  title_he text,
  content_he text,
  source_reference text,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  select
    kc.id,
    kc.category,
    kc.title_he,
    kc.content_he,
    kc.source_reference,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.is_verified
    and kc.embedding is not null
    and (filter_category is null or kc.category = filter_category)
    and 1 - (kc.embedding <=> query_embedding) >= coalesce(match_threshold, 0.82)
  order by kc.embedding <=> query_embedding
  limit least(greatest(coalesce(match_count, 5), 1), 40);
$$;

revoke all on function public.match_dog_knowledge(extensions.vector, float, int, text) from public;
grant execute on function public.match_dog_knowledge(extensions.vector, float, int, text) to anon, authenticated, service_role;

-- ================================================================================================
-- Migration history, in the Supabase CLI's format, so a later `supabase link` + `db push` skips these.
-- ================================================================================================
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
insert into supabase_migrations.schema_migrations (version, name) values
  ('20261019000000', 'harden_profile_updates'),
  ('20261021120000', 'knowledge_chunks')
on conflict (version) do nothing;

commit;
