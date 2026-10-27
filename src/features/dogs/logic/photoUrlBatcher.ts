// Groups the signed-URL requests of avatars that mount together (the dog picker, the dogs section) into one
// storage call. React Query starts each avatar's query function separately, so requests are collected for one
// macrotask: a microtask can flush before the sibling observers have started theirs.

/** One entry of a batched signed-URL response, as storage returns it (in request order). */
export interface SignedUrlResult {
  path: string | null;
  signedUrl: string | null;
  error: string | null;
}

export type FetchSignedUrls = (paths: string[]) => Promise<readonly SignedUrlResult[]>;
export type ScheduleFlush = (flush: () => void) => void;

interface Waiter {
  resolve: (url: string) => void;
  reject: (error: unknown) => void;
}

const nextMacrotask: ScheduleFlush = (flush) => {
  setTimeout(flush, 0);
};

/** The entry for a path: matched by path, else by position when storage left the path out. */
function resultFor(results: readonly SignedUrlResult[], path: string, index: number): SignedUrlResult | undefined {
  const byPath = results.find((entry) => entry.path === path);
  if (byPath) return byPath;
  const byIndex = results[index];
  return byIndex && byIndex.path === null ? byIndex : undefined;
}

/** A getter that resolves one path's signed URL, sharing a single fetchMany call with every path asked for in the same window. */
export function createPhotoUrlBatcher(fetchMany: FetchSignedUrls, schedule: ScheduleFlush = nextMacrotask): (path: string) => Promise<string> {
  let pending = new Map<string, Waiter[]>();
  let scheduled = false;

  const flush = async () => {
    const batch = pending;
    pending = new Map();
    scheduled = false;
    const paths = [...batch.keys()];
    let results: readonly SignedUrlResult[];
    try {
      results = await fetchMany(paths);
    } catch (error) {
      for (const waiters of batch.values()) for (const waiter of waiters) waiter.reject(error);
      return;
    }
    paths.forEach((path, index) => {
      const result = resultFor(results, path, index);
      const url = result && !result.error ? result.signedUrl : null;
      for (const waiter of batch.get(path) ?? []) {
        if (url) waiter.resolve(url);
        else waiter.reject(new Error(result?.error ?? 'No signed URL returned for this photo.'));
      }
    });
  };

  return (path) =>
    new Promise<string>((resolve, reject) => {
      const waiters = pending.get(path);
      if (waiters) waiters.push({ resolve, reject });
      else pending.set(path, [{ resolve, reject }]);
      if (scheduled) return;
      scheduled = true;
      try {
        schedule(() => void flush());
      } catch (error) {
        // No flush is coming: fail this window's waiters and let the next request start a fresh batch.
        const stuck = pending;
        pending = new Map();
        scheduled = false;
        for (const waiters of stuck.values()) for (const waiter of waiters) waiter.reject(error);
      }
    });
}
