import type { KnowledgeMatchRow } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { KnowledgeBaseError, searchKnowledgeBase } from '../api';
import { buildKnowledgeQuery, DEFAULT_MATCH_COUNT, DEFAULT_MATCH_THRESHOLD, EMBEDDING_DIMENSIONS, toVectorLiteral } from '../logic/knowledgeQuery';

const vector = (value = 0.01): number[] => Array.from({ length: EMBEDDING_DIMENSIONS }, () => value);

const match = (overrides: Partial<KnowledgeMatchRow> = {}): KnowledgeMatchRow => ({
  id: '6f1c2a3e-0000-4000-8000-000000000001',
  category: 'nutrition',
  title: 'Chocolate toxicity',
  content: 'Theobromine is toxic to dogs.',
  metadata: { tags: ['toxins'], urgency: 'emergency' },
  similarity: 0.91,
  ...overrides,
});

/** Stubs the next supabase.rpc call with a resolved `{ data, error }` result (or a rejection). */
function mockRpc(result: { data: unknown; error: unknown } | Error) {
  const spy = jest.spyOn(supabase, 'rpc');
  const response = result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  spy.mockReturnValueOnce(response as unknown as ReturnType<typeof supabase.rpc>);
  return spy;
}

async function expectCode(promise: Promise<unknown>, code: KnowledgeBaseError['code']) {
  await expect(promise).rejects.toBeInstanceOf(KnowledgeBaseError);
  await expect(promise).rejects.toMatchObject({ code });
}

afterEach(() => jest.restoreAllMocks());

describe('buildKnowledgeQuery', () => {
  it('applies defaults', () => {
    expect(buildKnowledgeQuery(vector())).toMatchObject({ threshold: DEFAULT_MATCH_THRESHOLD, count: DEFAULT_MATCH_COUNT, category: null });
  });

  it.each<[string, Parameters<typeof buildKnowledgeQuery>]>([
    ['wrong dimensions', [[0.1, 0.2]]],
    ['non-finite values', [[...vector().slice(1), Number.NaN]]],
    ['threshold above 1', [vector(), 1.5]],
    ['threshold below -1', [vector(), -2]],
    ['zero count', [vector(), 0.5, 0]],
    ['fractional count', [vector(), 0.5, 2.5]],
    ['count above the cap', [vector(), 0.5, 41]],
    ['unknown category', [vector(), 0.5, 5, 'astrology']],
  ])('rejects %s', (_, args) => {
    expect(buildKnowledgeQuery(...args)).toBeNull();
  });

  it('formats vectors as pgvector literals', () => {
    expect(toVectorLiteral([0.5, -1, 2])).toBe('[0.5,-1,2]');
  });
});

describe('searchKnowledgeBase', () => {
  it('calls the RPC with validated arguments and returns typed items', async () => {
    const spy = mockRpc({ data: [match()], error: null });
    const items = await searchKnowledgeBase(vector(0.5), 0.8, 3, 'nutrition');

    expect(spy).toHaveBeenCalledWith('match_knowledge_base', {
      query_embedding: toVectorLiteral(vector(0.5)),
      match_threshold: 0.8,
      match_count: 3,
      filter_category: 'nutrition',
    });
    expect(items).toEqual([match()]);
  });

  it('sends defaults and a null category when omitted', async () => {
    const spy = mockRpc({ data: [], error: null });
    await expect(searchKnowledgeBase(vector())).resolves.toEqual([]);
    expect(spy).toHaveBeenCalledWith('match_knowledge_base', expect.objectContaining({ match_threshold: DEFAULT_MATCH_THRESHOLD, match_count: DEFAULT_MATCH_COUNT, filter_category: null }));
  });

  it('strips unexpected extra columns', async () => {
    mockRpc({ data: [{ ...match(), embedding: '[0.1]' }], error: null });
    const [item] = await searchKnowledgeBase(vector());
    expect(item).not.toHaveProperty('embedding');
  });

  it('rejects invalid input without a network call', async () => {
    const spy = jest.spyOn(supabase, 'rpc');
    await expectCode(searchKnowledgeBase([1, 2, 3]), 'invalid_query');
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps a missing RPC (migration not applied) to schema_missing', async () => {
    mockRpc({ data: null, error: { code: 'PGRST202', message: 'Could not find the function', details: '', hint: '' } });
    await expectCode(searchKnowledgeBase(vector()), 'schema_missing');
  });

  it('maps a fetch failure reported by PostgREST to network', async () => {
    mockRpc({ data: null, error: { code: '', message: 'TypeError: Failed to fetch', details: '', hint: '' } });
    await expectCode(searchKnowledgeBase(vector()), 'network');
  });

  it('maps a thrown TypeError to network', async () => {
    mockRpc(new TypeError('Network request failed'));
    await expectCode(searchKnowledgeBase(vector()), 'network');
  });

  it('maps other database errors to internal and keeps the cause', async () => {
    const dbError = { code: '22000', message: 'different vector dimensions', details: '', hint: '' };
    mockRpc({ data: null, error: dbError });
    await expect(searchKnowledgeBase(vector())).rejects.toMatchObject({ code: 'internal', cause: dbError });
  });

  it.each<[string, unknown]>([
    ['a non-array payload', { rows: [] }],
    ['a row with an unknown category', [match({ category: 'astrology' as KnowledgeMatchRow['category'] })]],
    ['a row with a non-numeric similarity', [{ ...match(), similarity: 'high' }]],
    ['a row with array metadata', [match({ metadata: ['x'] })]],
  ])('rejects %s as internal', async (_, data) => {
    mockRpc({ data, error: null });
    await expectCode(searchKnowledgeBase(vector()), 'internal');
  });
});
