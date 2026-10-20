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
