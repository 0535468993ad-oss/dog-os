// Knowledge source files (supabase/knowledge/*.json) → validated chunks, and the plan for what the
// ingestion script must embed and write. Pure functions, no I/O: tested from supabase/tests/.

/** Mirrors the check constraint on knowledge_chunks.category (asserted against the app's list in tests). */
export const KNOWLEDGE_CATEGORIES = ['EMERGENCY_TOXICOLOGY', 'CLINICAL_NUTRITION', 'ETHOLOGY_BEHAVIOR', 'TRAINING_DRIVE', 'ISRAEL_REGULATION_BREEDS'] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** One chunk as written in a source file. */
export interface SourceChunk {
  slug: string;
  category: KnowledgeCategory;
  title_he: string;
  content_he: string;
  source_reference: string;
  /** Set to true only after a qualified person reviewed the text and its source. */
  verified: boolean;
}

/** What the database already holds for a slug (embedding in pgvector's text form, or null). */
export interface ExistingChunk {
  slug: string;
  title_he: string;
  content_he: string;
  embedding: string | null;
}

export interface IngestionPlan {
  /** New chunks, chunks whose text changed, and chunks never embedded. */
  toEmbed: SourceChunk[];
  /** Text unchanged and already embedded: only metadata (category, source, verified) is rewritten. */
  unchanged: { chunk: SourceChunk; embedding: string }[];
  /** In the database but in no source file. Deleted only with --prune. */
  orphans: string[];
}

const isText = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

/** Validates one parsed file; every problem is reported with its position, not just the first. */
export function parseKnowledgeFile(data: unknown, fileName: string): { chunks: SourceChunk[]; errors: string[] } {
  if (!Array.isArray(data)) return { chunks: [], errors: [`${fileName}: expected a JSON array of chunks`] };
  const chunks: SourceChunk[] = [];
  const errors: string[] = [];
  data.forEach((raw: unknown, i) => {
    const at = `${fileName}[${i}]`;
    if (!raw || typeof raw !== 'object') {
      errors.push(`${at}: expected an object`);
      return;
    }
    const v = raw as Record<string, unknown>;
    const problems = [
      typeof v.slug === 'string' && SLUG.test(v.slug) && v.slug.length <= 120 ? null : 'slug must be kebab-case (a-z, 0-9, -), up to 120 characters',
      typeof v.category === 'string' && (KNOWLEDGE_CATEGORIES as readonly string[]).includes(v.category) ? null : `category must be one of ${KNOWLEDGE_CATEGORIES.join(', ')}`,
      isText(v.title_he, 300) ? null : 'title_he must be 1–300 characters',
      isText(v.content_he, 20000) ? null : 'content_he must be 1–20000 characters',
      isText(v.source_reference, 500) ? null : 'source_reference must be 1–500 characters',
      typeof v.verified === 'boolean' ? null : 'verified must be true or false (set it deliberately)',
    ].filter((problem): problem is string => problem !== null);
    if (problems.length > 0) {
      errors.push(...problems.map((problem) => `${at} (${typeof v.slug === 'string' ? v.slug : '?'}): ${problem}`));
      return;
    }
    chunks.push({
      slug: v.slug as string,
      category: v.category as KnowledgeCategory,
      title_he: (v.title_he as string).trim(),
      content_he: (v.content_he as string).trim(),
      source_reference: (v.source_reference as string).trim(),
      verified: v.verified as boolean,
    });
  });
  return { chunks, errors };
}

/** Slugs that appear more than once across all files. */
export function duplicateSlugs(chunks: readonly SourceChunk[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const { slug } of chunks) (seen.has(slug) ? duplicates : seen).add(slug);
  return [...duplicates];
}

/** The text that is embedded: title and body together, so a short title still carries its topic. */
export function embeddingInput(chunk: Pick<SourceChunk, 'title_he' | 'content_he'>): string {
  return `${chunk.title_he}\n\n${chunk.content_he}`;
}

/** Decides per chunk whether it needs a (paid) embedding call or can keep its current vector. */
export function planIngestion(chunks: readonly SourceChunk[], existing: readonly ExistingChunk[]): IngestionPlan {
  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  const plan: IngestionPlan = { toEmbed: [], unchanged: [], orphans: [] };
  for (const chunk of chunks) {
    const row = bySlug.get(chunk.slug);
    const sameText = row !== undefined && embeddingInput(row) === embeddingInput(chunk);
    if (row?.embedding && sameText) plan.unchanged.push({ chunk, embedding: row.embedding });
    else plan.toEmbed.push(chunk);
  }
  const wanted = new Set(chunks.map((chunk) => chunk.slug));
  plan.orphans = existing.map((row) => row.slug).filter((slug) => !wanted.has(slug));
  return plan;
}
