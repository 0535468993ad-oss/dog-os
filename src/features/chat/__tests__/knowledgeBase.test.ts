import type { KnowledgeMatchRow } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { searchKnowledgeBase } from '../api/knowledgeBase';
import {
  buildKnowledgeQuery,
  DEFAULT_MATCH_COUNT,
  DEFAULT_MATCH_THRESHOLD,
  EMBEDDING_DIMENSIONS,
  KNOWLEDGE_BASE_CATEGORIES,
  toVectorLiteral,
} from '../api/knowledgeQuery';
import { KnowledgeBaseError } from '../utils/chatErrors';

const vector = (value = 0.01): number[] => Array.from({ length: EMBEDDING_DIMENSIONS }, () => value);

const match = (overrides: Partial<KnowledgeMatchRow> = {}): KnowledgeMatchRow => ({
  id: '6f1c2a3e-0000-4000-8000-000000000001',
  category: 'EMERGENCY_TOXICOLOGY',
  title_he: 'הרעלת שוקולד',
  content_he: 'תאוברומין רעיל לכלבים.',
  source_reference: 'Merck Veterinary Manual – Chocolate Toxicosis',
  similarity: 0.91,
  ...overrides,
});

/** The app's shape for match(): the RPC's snake_case columns mapped to camelCase. */
const item = (row = match()) => ({ id: row.id, category: row.category, title: row.title_he, content: row.content_he, sourceReference: row.source_reference, similarity: row.similarity });

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
  it('applies defaults: the 0.82 threshold of match_dog_knowledge', () => {
    expect(DEFAULT_MATCH_THRESHOLD).toBe(0.82);
    expect(buildKnowledgeQuery(vector())).toMatchObject({ threshold: 0.82, count: DEFAULT_MATCH_COUNT, category: null });
  });

  it('accepts exactly the five knowledge categories', () => {
    expect([...KNOWLEDGE_BASE_CATEGORIES].sort()).toEqual(['CLINICAL_NUTRITION', 'EMERGENCY_TOXICOLOGY', 'ETHOLOGY_BEHAVIOR', 'ISRAEL_REGULATION_BREEDS', 'TRAINING_DRIVE']);
    for (const category of KNOWLEDGE_BASE_CATEGORIES) expect(buildKnowledgeQuery(vector(), 0.9, 5, category)).toMatchObject({ category });
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
    ['a retired lowercase category', [vector(), 0.5, 5, 'nutrition']],
  ])('rejects %s', (_, args) => {
    expect(buildKnowledgeQuery(...args)).toBeNull();
  });

  it('formats vectors as pgvector literals', () => {
    expect(toVectorLiteral([0.5, -1, 2])).toBe('[0.5,-1,2]');
  });
});

describe('searchKnowledgeBase', () => {
  it('calls match_dog_knowledge with validated arguments and returns typed items', async () => {
    const spy = mockRpc({ data: [match()], error: null });
    const items = await searchKnowledgeBase(vector(0.5), 0.9, 3, 'EMERGENCY_TOXICOLOGY');

    expect(spy).toHaveBeenCalledWith('match_dog_knowledge', {
      query_embedding: toVectorLiteral(vector(0.5)),
      match_threshold: 0.9,
      match_count: 3,
      filter_category: 'EMERGENCY_TOXICOLOGY',
    });
    expect(items).toEqual([item()]);
  });

  it('sends the 0.82 default and a null category when omitted', async () => {
    const spy = mockRpc({ data: [], error: null });
    await expect(searchKnowledgeBase(vector())).resolves.toEqual([]);
    expect(spy).toHaveBeenCalledWith('match_dog_knowledge', expect.objectContaining({ match_threshold: 0.82, match_count: DEFAULT_MATCH_COUNT, filter_category: null }));
  });

  it('returns no items when nothing clears the threshold – the caller must then say it does not know', async () => {
    mockRpc({ data: [], error: null });
    await expect(searchKnowledgeBase(vector())).resolves.toEqual([]);
  });

  it('strips unexpected extra columns', async () => {
    mockRpc({ data: [{ ...match(), embedding: '[0.1]', is_verified: true }], error: null });
    const [first] = await searchKnowledgeBase(vector());
    expect(first).toEqual(item());
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
    ['a row without a source reference', [match({ source_reference: '  ' })]],
    ['a row in the retired shape', [{ id: 'x', category: 'EMERGENCY_TOXICOLOGY', title: 't', content: 'c', metadata: {}, similarity: 0.9 }]],
  ])('rejects %s as internal', async (_, data) => {
    mockRpc({ data, error: null });
    await expectCode(searchKnowledgeBase(vector()), 'internal');
  });
});
