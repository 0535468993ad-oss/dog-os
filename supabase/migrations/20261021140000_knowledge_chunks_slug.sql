-- A stable, human-readable key per knowledge chunk, so the ingestion script (scripts/ingest-knowledge.ts)
-- can upsert: re-running it updates a chunk in place instead of duplicating it, and only re-embeds chunks
-- whose text changed. The table is still empty, so the column can be NOT NULL from the start; if rows were
-- added meanwhile, this migration fails as a whole and nothing changes.

alter table public.knowledge_chunks
  add column slug text not null
    constraint knowledge_chunks_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120);

alter table public.knowledge_chunks
  add constraint knowledge_chunks_slug_key unique (slug);
