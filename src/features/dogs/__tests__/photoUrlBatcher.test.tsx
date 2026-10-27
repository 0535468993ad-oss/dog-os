// Batched signed URLs for dog photos: avatars that mount together share one storage call (the dog picker used to
// make one request per dog), duplicates share an entry, and a failure is scoped to the path or the batch it hit.
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useDogPhotoUrl } from '../hooks';
import { createPhotoUrlBatcher, type SignedUrlResult } from '../logic/photoUrlBatcher';

const mockCreateSignedUrls = jest.fn<Promise<{ data: SignedUrlResult[] | null; error: Error | null }>, [string[], number]>();

jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: () => ({ createSignedUrls: (paths: string[], expiresIn: number) => mockCreateSignedUrls(paths, expiresIn) }) } },
  unwrap: (result: { data: unknown; error: unknown }) => {
    if (result.error) throw result.error;
    return result.data;
  },
}));

const signed = (path: string): SignedUrlResult => ({ path, signedUrl: `https://cdn.test/${path}?token=1`, error: null });

/** A batcher whose flush the test triggers by hand. */
function manualBatcher(fetchMany: (paths: string[]) => Promise<readonly SignedUrlResult[]>) {
  const flushes: (() => void)[] = [];
  const get = createPhotoUrlBatcher(fetchMany, (flush) => flushes.push(flush));
  return { get, flush: () => flushes.shift()?.() };
}

describe('photo URL batcher', () => {
  it('signs every path asked for in one window with a single call', async () => {
    const fetchMany = jest.fn(async (paths: string[]) => paths.map(signed));
    const { get, flush } = manualBatcher(fetchMany);
    const urls = Promise.all([get('u/a.jpg'), get('u/b.jpg'), get('u/c.jpg')]);
    flush();
    await expect(urls).resolves.toEqual(['https://cdn.test/u/a.jpg?token=1', 'https://cdn.test/u/b.jpg?token=1', 'https://cdn.test/u/c.jpg?token=1']);
    expect(fetchMany).toHaveBeenCalledTimes(1);
    expect(fetchMany).toHaveBeenCalledWith(['u/a.jpg', 'u/b.jpg', 'u/c.jpg']);
  });

  it('asks once for a path requested twice', async () => {
    const fetchMany = jest.fn(async (paths: string[]) => paths.map(signed));
    const { get, flush } = manualBatcher(fetchMany);
    const both = Promise.all([get('u/a.jpg'), get('u/a.jpg')]);
    flush();
    await expect(both).resolves.toEqual(['https://cdn.test/u/a.jpg?token=1', 'https://cdn.test/u/a.jpg?token=1']);
    expect(fetchMany).toHaveBeenCalledWith(['u/a.jpg']);
  });

  it('rejects only the path storage could not sign', async () => {
    const { get, flush } = manualBatcher(async () => [signed('u/a.jpg'), { path: 'u/gone.jpg', signedUrl: null, error: 'Object not found' }]);
    const ok = get('u/a.jpg');
    const gone = get('u/gone.jpg');
    flush();
    await expect(ok).resolves.toBe('https://cdn.test/u/a.jpg?token=1');
    await expect(gone).rejects.toThrow('Object not found');
  });

  it('matches by position when storage leaves the path out, and never hands one path another path’s URL', async () => {
    const { get, flush } = manualBatcher(async () => [
      { path: null, signedUrl: 'https://cdn.test/first', error: null },
      { path: 'u/other.jpg', signedUrl: 'https://cdn.test/other', error: null },
    ]);
    const first = get('u/first.jpg');
    const second = get('u/second.jpg');
    flush();
    await expect(first).resolves.toBe('https://cdn.test/first');
    await expect(second).rejects.toThrow('No signed URL');
  });

  it('rejects the whole batch when the call fails, and starts a fresh batch afterwards', async () => {
    const fetchMany = jest.fn<Promise<readonly SignedUrlResult[]>, [string[]]>().mockRejectedValueOnce(new Error('offline')).mockImplementation(async (paths) => paths.map(signed));
    const { get, flush } = manualBatcher(fetchMany);
    const failed = Promise.allSettled([get('u/a.jpg'), get('u/b.jpg')]);
    flush();
    expect((await failed).map((result) => result.status)).toEqual(['rejected', 'rejected']);
    const retry = get('u/a.jpg');
    flush();
    await expect(retry).resolves.toBe('https://cdn.test/u/a.jpg?token=1');
    expect(fetchMany).toHaveBeenCalledTimes(2);
  });
});

describe('photo URL batcher scheduling', () => {
  it('fails the window when the scheduler throws, and schedules a fresh batch for the next request', async () => {
    const fetchMany = jest.fn(async (paths: string[]) => paths.map(signed));
    const flushes: (() => void)[] = [];
    let broken = true;
    const get = createPhotoUrlBatcher(fetchMany, (flush) => {
      if (broken) throw new Error('no timers');
      flushes.push(flush);
    });
    await expect(get('u/a.jpg')).rejects.toThrow('no timers');
    broken = false;
    const retry = get('u/a.jpg');
    flushes.shift()?.();
    await expect(retry).resolves.toBe('https://cdn.test/u/a.jpg?token=1');
    expect(fetchMany).toHaveBeenCalledTimes(1);
  });
});

describe('useDogPhotoUrl', () => {
  it('makes one storage request for three avatars mounting together', async () => {
    mockCreateSignedUrls.mockImplementation(async (paths) => ({ data: paths.map(signed), error: null }));
    const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, unmount } = await renderHook(() => [useDogPhotoUrl('u/rex.jpg'), useDogPhotoUrl('u/bella.jpg'), useDogPhotoUrl('u/max.jpg')], { wrapper });
    await waitFor(() => expect(result.current.every((query) => query.isSuccess)).toBe(true));
    expect(result.current.map((query) => query.data)).toEqual(['https://cdn.test/u/rex.jpg?token=1', 'https://cdn.test/u/bella.jpg?token=1', 'https://cdn.test/u/max.jpg?token=1']);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(['u/rex.jpg', 'u/bella.jpg', 'u/max.jpg'], 3600);
    // Unmount, then drop the queries: the photo query's 55-minute gc timer would otherwise keep Jest alive.
    await unmount();
    client.clear();
  });
});
