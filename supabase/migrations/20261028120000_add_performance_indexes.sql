-- Performance indexes from the query audit (2026-10-28).
--
-- Every filter and sort the app issues is already served by an index:
--   journal_entries (dog_id, entry_date desc, created_at desc), chat_history (user_id, dog_id, created_at),
--   vaccinations (dog_id, due_date), medical_notes (dog_id, noted_on desc), food_portions (dog_id),
--   weight_logs unique (dog_id, measured_on), user_training_progress unique (dog_id, step_id), and every RLS
--   user_id column (dogs via dogs_owner_id_idx, which follows the owner_id -> user_id rename).
--
-- What is missing are indexes on two foreign keys declared `on delete cascade` whose referencing column does not
-- lead any existing index, so deleting a referenced row scans the whole child table:
--   knowledge_bookmarks.article_id   (primary key is (user_id, article_id))
--   user_training_progress.step_id   (unique key is (dog_id, step_id))
-- Both tables are small today, so a plain (non-concurrent) build is fine and runs inside the SQL Editor's transaction.

create index if not exists knowledge_bookmarks_article_idx on public.knowledge_bookmarks (article_id);
create index if not exists user_training_progress_step_idx on public.user_training_progress (step_id);
