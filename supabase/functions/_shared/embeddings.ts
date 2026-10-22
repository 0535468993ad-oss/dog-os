// OpenAI text embeddings for the knowledge base. Plain TypeScript with only `fetch` (no Deno or Node
// APIs): the chat Edge Function embeds the owner's question with it, scripts/ingest-knowledge.ts embeds
// the knowledge chunks, and Jest tests it from supabase/tests/. One module, so both sides always embed
// with the same model and dimensions – vectors from different models are not comparable.

export const EMBEDDING_MODEL = 'text-embedding-3-small';
/** Must match vector(1536) in supabase/migrations/20261021120000_knowledge_chunks.sql. */
export const EMBEDDING_DIMENSIONS = 1536;
/** OpenAI accepts up to 2048 inputs per request; smaller batches keep each request well under its limits. */
export const EMBEDDING_BATCH_SIZE = 100;

const ENDPOINT = 'https://api.openai.com/v1/embeddings';

export type EmbeddingErrorCode = 'unauthorized' | 'rate_limited' | 'unavailable' | 'bad_response';

export class EmbeddingError extends Error {
  readonly code: EmbeddingErrorCode;

  constructor(code: EmbeddingErrorCode, message: string) {
    super(message);
    this.name = 'EmbeddingError';
    this.code = code;
  }
}

type FetchLike = (input: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export interface EmbedOptions {
  apiKey: string;
  fetchImpl?: FetchLike;
  /** Per request. The chat path keeps this short so a slow embedding never stalls the answer. */
  timeoutMs?: number;
}

function errorCodeFor(status: number): EmbeddingErrorCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  return status >= 500 ? 'unavailable' : 'bad_response';
}

/** Reads `data[].embedding` in input order, checking every vector's length and values. */
export function parseEmbeddingResponse(body: unknown, expected: number): number[][] {
  const data = (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(data) || data.length !== expected) throw new EmbeddingError('bad_response', 'Unexpected embeddings payload.');
  const vectors: (number[] | undefined)[] = Array.from({ length: expected }, () => undefined);
  for (const item of data as ({ index?: unknown; embedding?: unknown } | null)[]) {
    const { index, embedding } = item ?? {};
    const valid =
      typeof index === 'number' &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < expected &&
      Array.isArray(embedding) &&
      embedding.length === EMBEDDING_DIMENSIONS &&
      embedding.every((value) => typeof value === 'number' && Number.isFinite(value));
    if (!valid) throw new EmbeddingError('bad_response', 'Malformed embedding in payload.');
    vectors[index] = embedding as number[];
  }
  if (vectors.some((vector) => vector === undefined)) throw new EmbeddingError('bad_response', 'Missing embedding in payload.');
  return vectors as number[][];
}

/** Embeds up to EMBEDDING_BATCH_SIZE texts in one request; vectors come back in input order. */
export async function embedTexts(texts: readonly string[], options: EmbedOptions): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > EMBEDDING_BATCH_SIZE) throw new RangeError(`At most ${EMBEDDING_BATCH_SIZE} texts per request.`);
  const fetchImpl = options.fetchImpl ?? (fetch as unknown as FetchLike);
  let response: Awaited<ReturnType<FetchLike>>;
  try {
    response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts, dimensions: EMBEDDING_DIMENSIONS, encoding_format: 'float' }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
    });
  } catch (error) {
    throw new EmbeddingError('unavailable', error instanceof Error ? error.message : 'Embedding request failed.');
  }
  // Never include the response body in the error: it may echo request details.
  if (!response.ok) throw new EmbeddingError(errorCodeFor(response.status), `Embedding request failed with HTTP ${response.status}.`);
  return parseEmbeddingResponse(await response.json(), texts.length);
}

/** pgvector's text input format; PostgREST casts it to vector(1536). */
export function toVectorLiteral(vector: readonly number[]): string {
  return `[${vector.join(',')}]`;
}
