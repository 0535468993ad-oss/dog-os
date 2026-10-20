// The insights call falls back to rule-based insights silently for expected outages, and reports only
// anomalies (so the dev console stays clean while the Edge Function isn't deployed or AI is off).
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { reportError } from '@/utils/errors';

import { fetchAiInsights } from '../api';
import { isExpectedInsightsFailure } from '../logic/insightsFailure';

jest.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: jest.fn() } } }));
jest.mock('@/utils/errors', () => ({ ...jest.requireActual('@/utils/errors'), reportError: jest.fn() }));

const invoke = supabase.functions.invoke as jest.Mock;
const DOG_ID = '6f1c2a3e-1111-4222-8333-944455556666';

/** A FunctionsHttpError as supabase-js builds it: the raw response is the error's context. */
function httpError(status: number, body: unknown): FunctionsHttpError {
  return new FunctionsHttpError({ status, json: async () => body });
}

beforeEach(() => {
  invoke.mockReset();
  (reportError as jest.Mock).mockReset();
});

describe('isExpectedInsightsFailure', () => {
  it.each([
    [404, 'internal', 'gateway NOT_FOUND: function not deployed'],
    [404, 'not_found', 'dog not found'],
    [429, 'rate_limited', 'daily cap / provider rate limit'],
    [503, 'ai_unavailable', 'AI not configured or down'],
    [403, 'ai_opted_out', 'AI data sharing turned off'],
  ])('%i %s (%s) is expected', (status, code) => {
    expect(isExpectedInsightsFailure({ status, code })).toBe(true);
  });

  it.each([
    [403, 'internal'],
    [401, 'unauthorized'],
    [500, 'internal'],
    [422, 'ai_refused'],
    [0, 'network'],
  ])('%i %s is an anomaly', (status, code) => {
    expect(isExpectedInsightsFailure({ status, code })).toBe(false);
  });
});

describe('fetchAiInsights', () => {
  it('returns valid insights from the function', async () => {
    const insight = { kind: 'health', priority: 'normal', title: 'כותרת', body: 'גוף' };
    invoke.mockResolvedValue({ data: { insights: [insight, { kind: 'bogus' }] }, error: null });

    await expect(fetchAiInsights(DOG_ID)).resolves.toEqual([insight]);
    expect(invoke).toHaveBeenCalledWith('insights', { body: { dogId: DOG_ID } });
  });

  it.each([
    [404, { code: 'NOT_FOUND', message: 'Requested function was not found' }],
    [503, { error: { code: 'ai_unavailable' } }],
    [429, { error: { code: 'rate_limited' } }],
    [403, { error: { code: 'ai_opted_out' } }],
  ])('falls back silently on %i', async (status, body) => {
    invoke.mockResolvedValue({ data: null, error: httpError(status, body) });

    await expect(fetchAiInsights(DOG_ID)).resolves.toBeNull();
    expect(reportError).not.toHaveBeenCalled();
  });

  it('falls back but reports an unexpected server error', async () => {
    const error = httpError(500, { error: { code: 'internal' } });
    invoke.mockResolvedValue({ data: null, error });

    await expect(fetchAiInsights(DOG_ID)).resolves.toBeNull();
    expect(reportError).toHaveBeenCalledWith(error, 'insights:fallback-to-rules');
  });

  it('falls back but reports a network failure', async () => {
    const error = new FunctionsFetchError(new TypeError('Network request failed'));
    invoke.mockResolvedValue({ data: null, error });

    await expect(fetchAiInsights(DOG_ID)).resolves.toBeNull();
    expect(reportError).toHaveBeenCalledWith(error, 'insights:fallback-to-rules');
  });

  it('still reports when the error body is unreadable', async () => {
    const error = new FunctionsHttpError({ status: 500, json: async () => Promise.reject(new SyntaxError('bad json')) });
    invoke.mockResolvedValue({ data: null, error });

    await expect(fetchAiInsights(DOG_ID)).resolves.toBeNull();
    expect(reportError).toHaveBeenCalledTimes(1);
  });
});
