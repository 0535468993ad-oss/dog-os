-- Knowledge chunks are unverified unless someone says otherwise (fix forward; 20261021120000 is applied).
-- That migration's own header promises "false until reviewed", but the column defaulted to true, so any
-- insert that omitted the flag was served to the advisor as reviewed content. The ingest script always sets
-- `verified` explicitly (scripts/lib/knowledgeSource.ts), so existing rows keep their value; only the
-- default changes. No rows are touched.

alter table public.knowledge_chunks alter column is_verified set default false;
