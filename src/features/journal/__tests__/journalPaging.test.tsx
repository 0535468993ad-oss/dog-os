// Journal paging: 15 entries per server page through .range(), no request after a short page, one copy of an
// entry that two pages both returned, bounded "recent" reads for the dashboard and report, and writes that
// refresh both the list and the recent entries.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { makeJournal } from '@/test/fixtures';

import { useJournalFeed, useJournalMutations, useRecentJournal } from '../hooks/useJournal';
import type { JournalEntryRow } from '../types';
import { flattenJournalPages, JOURNAL_PAGE_SIZE, nextJournalOffset, REPORT_JOURNAL_LIMIT } from '../utils/journalPaging';

type Call = [string, unknown[]];
const mockCalls: Call[] = [];
const mockPages = new Map<number, JournalEntryRow[]>();

// A recording query builder, one per from() so concurrent queries never share state: .range(from) answers with
// the page stored for that offset, .limit(n) with the first n rows, and a write with no data.
jest.mock('@/lib/supabase', () => {
  const makeBuilder = () => {
    const state: { from: number | null; limit: number | null } = { from: null, limit: null };
    const builder: Record<string, unknown> = {};
    for (const name of ['select', 'eq', 'order', 'insert', 'delete']) {
      builder[name] = (...args: unknown[]) => {
        mockCalls.push([name, args]);
        return builder;
      };
    }
    builder.range = (from: number, to: number) => {
      mockCalls.push(['range', [from, to]]);
      state.from = from;
      return builder;
    };
    builder.limit = (count: number) => {
      mockCalls.push(['limit', [count]]);
      state.limit = count;
      return builder;
    };
    builder.then = (resolve: (value: unknown) => unknown) => {
      const data = state.from !== null ? (mockPages.get(state.from) ?? []) : state.limit !== null ? [...mockPages.values()].flat().slice(0, state.limit) : null;
      return Promise.resolve({ data, error: null }).then(resolve);
    };
    return builder;
  };
  return {
    supabase: { from: () => makeBuilder() },
    unwrap: (result: { data: unknown; error: unknown }) => {
      if (result.error) throw result.error;
      return result.data;
    },
  };
});

const entries = (from: number, count: number) => Array.from({ length: count }, (_, i) => makeJournal({ id: `j-${from + i}` }));
const callsOf = (name: string) => mockCalls.filter(([called]) => called === name).map(([, args]) => args);

async function setup<T>(hook: () => T) {
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(hook, { wrapper });
}

beforeEach(() => {
  mockCalls.length = 0;
  mockPages.clear();
});

describe('journal paging helpers', () => {
  it('offers the next offset only after a full page', () => {
    expect(nextJournalOffset([entries(0, 15)])).toBe(15);
    expect(nextJournalOffset([entries(0, 15), entries(15, 15)])).toBe(30);
    expect(nextJournalOffset([entries(0, 15), entries(15, 4)])).toBeUndefined();
    expect(nextJournalOffset([])).toBeUndefined();
  });

  it('keeps one copy of an entry that two pages returned (an insert elsewhere shifted the offsets)', () => {
    const shifted = [...entries(0, 15), ...entries(14, 1)];
    expect(flattenJournalPages([shifted.slice(0, 15), shifted.slice(14)]).map((entry) => entry.id)).toEqual(entries(0, 15).map((entry) => entry.id));
  });
});

describe('useJournalFeed', () => {
  it('asks for range 0–14, then 15–29, and stops after a short page', async () => {
    mockPages.set(0, entries(0, JOURNAL_PAGE_SIZE));
    mockPages.set(15, entries(15, 6));
    const { result } = await setup(() => useJournalFeed('d1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callsOf('eq')).toEqual([['dog_id', 'd1']]);
    expect(callsOf('range')).toEqual([[0, 14]]);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => void (await result.current.fetchNextPage()));
    expect(callsOf('range')).toEqual([
      [0, 14],
      [15, 29],
    ]);
    await waitFor(() => expect(result.current.data).toHaveLength(21));
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('useRecentJournal', () => {
  it('reads 20 rows for the dashboard and 30 for the report, never the whole journal', async () => {
    mockPages.set(0, entries(0, 40));
    const dashboard = await setup(() => useRecentJournal('d1'));
    await waitFor(() => expect(dashboard.result.current.isSuccess).toBe(true));
    const report = await setup(() => useRecentJournal('d1', REPORT_JOURNAL_LIMIT));
    await waitFor(() => expect(report.result.current.isSuccess).toBe(true));
    expect(callsOf('limit')).toEqual([[20], [30]]);
    expect(dashboard.result.current.data).toHaveLength(20);
    expect(report.result.current.data).toHaveLength(30);
  });
});

describe('useJournalMutations', () => {
  it('refreshes both the list and the recent entries after an add and after a delete', async () => {
    mockPages.set(0, entries(0, 3));
    const { result } = await setup(() => ({ feed: useJournalFeed('d1'), recent: useRecentJournal('d1'), mutations: useJournalMutations('d1') }));
    await waitFor(() => expect(result.current.feed.isSuccess && result.current.recent.isSuccess).toBe(true));
    expect([callsOf('range').length, callsOf('limit').length]).toEqual([1, 1]);

    await act(async () => result.current.mutations.add.mutateAsync({ dogId: 'd1', note: 'טיול', category: 'general', mood: null, entryDate: '2026-10-28' }));
    await waitFor(() => expect([callsOf('range').length, callsOf('limit').length]).toEqual([2, 2]));

    await act(async () => void result.current.mutations.remove.mutate('j-0'));
    await waitFor(() => expect([callsOf('range').length, callsOf('limit').length]).toEqual([3, 3]));
  });
});
