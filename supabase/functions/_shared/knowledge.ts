// Retrieval for the chat advisor: embed the owner's question, find verified knowledge chunks through the
// match_dog_knowledge RPC, and hand them to the model as reference data. Plain TypeScript (no Deno APIs),
// unit-tested from supabase/tests/.
//
// Privacy: only the question text is sent to OpenAI for embedding – never the dog profile or history.

import { embedTexts, toVectorLiteral, type EmbedOptions } from './embeddings.ts';

/** Same default as match_dog_knowledge: below it a chunk is not close enough to ground an answer. */
export const MATCH_THRESHOLD = 0.82;
export const MATCH_COUNT = 4;
/** The question is embedded on the answer's critical path, so a slow embedding is skipped, not waited on. */
export const EMBED_TIMEOUT_MS = 8_000;

export interface KnowledgeMatch {
  title_he: string;
  content_he: string;
  source_reference: string;
  similarity: number;
}

/** The slice of a Supabase client this module needs, so tests can pass a stub. */
export interface RpcClient {
  rpc: (fn: 'match_dog_knowledge', args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
}

export type Retrieval = { status: 'matched'; matches: KnowledgeMatch[] } | { status: 'no_match' } | { status: 'unavailable'; reason: string };

function isMatch(value: unknown): value is KnowledgeMatch {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title_he === 'string' &&
    typeof v.content_he === 'string' &&
    typeof v.source_reference === 'string' &&
    typeof v.similarity === 'number' &&
    Number.isFinite(v.similarity)
  );
}

/**
 * Never throws: retrieval failing must not take the chat down with it. `unavailable` means the knowledge
 * base could not be consulted (no key, OpenAI or database error) – the model is then told so explicitly.
 */
export async function retrieveKnowledge(client: RpcClient, question: string, embed: EmbedOptions | null): Promise<Retrieval> {
  if (!embed) return { status: 'unavailable', reason: 'not_configured' };
  try {
    const [vector] = await embedTexts([question], { timeoutMs: EMBED_TIMEOUT_MS, ...embed });
    if (!vector) return { status: 'unavailable', reason: 'no_vector' };
    const { data, error } = await client.rpc('match_dog_knowledge', {
      query_embedding: toVectorLiteral(vector),
      match_threshold: MATCH_THRESHOLD,
      match_count: MATCH_COUNT,
    });
    if (error) return { status: 'unavailable', reason: 'rpc_error' };
    if (!Array.isArray(data) || !data.every(isMatch)) return { status: 'unavailable', reason: 'bad_rows' };
    return data.length > 0 ? { status: 'matched', matches: data } : { status: 'no_match' };
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'embed_error';
    return { status: 'unavailable', reason: code };
  }
}

const escapeTags = (text: string) => text.replace(/</g, '‹').replace(/>/g, '›');

/** The reference block placed before the owner's question in the final user turn. */
export function knowledgeBlock(retrieval: Retrieval): string {
  if (retrieval.status !== 'matched') {
    return '<verified_knowledge status="none">No verified source in the Dog OS library matches this question.</verified_knowledge>';
  }
  const chunks = retrieval.matches
    .map((match, i) => `<source id="${i + 1}" reference="${escapeTags(match.source_reference)}">\n<title>${escapeTags(match.title_he)}</title>\n${escapeTags(match.content_he)}\n</source>`)
    .join('\n');
  return `<verified_knowledge status="matched">\n${chunks}\n</verified_knowledge>`;
}

/**
 * The sources line appended to the stored answer. Written by the server from the matched rows, not by the
 * model, so a citation can never be invented. Empty when nothing matched.
 */
export function sourcesFooter(retrieval: Retrieval): string {
  if (retrieval.status !== 'matched') return '';
  const unique = [...new Set(retrieval.matches.map((match) => match.source_reference.trim()))];
  return `\n\nמקורות מהספרייה המאומתת של Dog OS:\n${unique.map((reference) => `- ${reference}`).join('\n')}`;
}
