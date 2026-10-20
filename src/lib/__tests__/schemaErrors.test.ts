import { queryClient } from '../queryClient';
import { isSchemaMissingError } from '../supabaseErrors';

describe('isSchemaMissingError', () => {
  it.each([
    [{ code: 'PGRST205', message: 'Could not find the table' }, true],
    [{ code: '42P01', message: 'relation does not exist' }, true],
    [{ code: '42501', message: 'permission denied' }, false],
    [{ code: 'PGRST116' }, false],
    [new TypeError('Network request failed'), false],
    [null, false],
    ['PGRST205', false],
  ])('%p -> %p', (error, expected) => {
    expect(isSchemaMissingError(error)).toBe(expected);
  });
});

describe('query retry policy', () => {
  const retry = queryClient.getDefaultOptions().queries?.retry;
  const shouldRetry = (failureCount: number, error: unknown) => {
    if (typeof retry !== 'function') throw new Error('expected a retry function');
    return retry(failureCount, error as Error);
  };

  it('does not retry a missing table', () => {
    expect(shouldRetry(0, { code: 'PGRST205' })).toBe(false);
  });

  it('does not retry client errors', () => {
    expect(shouldRetry(0, { status: 403 })).toBe(false);
  });

  it('retries transient failures twice', () => {
    const network = new TypeError('Network request failed');
    expect(shouldRetry(0, network)).toBe(true);
    expect(shouldRetry(1, network)).toBe(true);
    expect(shouldRetry(2, network)).toBe(false);
  });
});
