// Chat history paging: the newest 50 messages on open (the old query returned the oldest 200, hiding new ones),
// a validated composite keyset cursor for older pages, stale older pages dropped, and clear resetting "load older".
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { ChatHistoryRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';

import { CHAT_PAGE_SIZE, fetchChat, fetchChatBefore } from '../api/chat';
import { useChatConversation } from '../hooks/useChatConversation';
import { compareChronological, cursorFor, mergeOlderMessages, olderThanFilter } from '../utils/chatCursor';

type Call = [string, unknown[]];
const mockCalls: Call[] = [];
const mockResults: unknown[] = [];

// A recording query builder: every chained call is logged, and awaiting it answers with the next queued result.
jest.mock('@/lib/supabase', () => {
  const builder: Record<string, unknown> = {};
  for (const name of ['select', 'eq', 'is', 'or', 'order', 'limit', 'range', 'delete']) {
    builder[name] = (...args: unknown[]) => {
      mockCalls.push([name, args]);
      return builder;
    };
  }
  builder.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => {
    mockCalls.push(['then', []]);
    return Promise.resolve(mockResults.length ? mockResults.shift() : { data: [], error: null }).then(resolve, reject);
  };
  return {
    supabase: {
      from: (table: string) => {
        mockCalls.push(['from', [table]]);
        return builder;
      },
      functions: { invoke: jest.fn() },
    },
    unwrap: (result: { data: unknown; error: unknown }) => {
      if (result.error) throw result.error;
      return result.data;
    },
  };
});

/** A stored message: UUID id, server-style ISO timestamp, `second` seconds into the conversation. */
function row(second: number, role: ChatHistoryRow['role'] = 'user'): ChatHistoryRow {
  return {
    id: `00000000-0000-4000-8000-${String(second).padStart(12, '0')}`,
    user_id: 'u1',
    dog_id: 'd1',
    role,
    message: `הודעה ${second}`,
    created_at: new Date(Date.UTC(2026, 9, 1, 0, 0, second)).toISOString(),
  };
}

/** Rows `from`..`to` as the server sends them: newest first. */
const serverPage = (from: number, to: number) => ({ data: Array.from({ length: to - from + 1 }, (_, i) => row(to - i)), error: null });
const callsOf = (name: string) => mockCalls.filter(([called]) => called === name).map(([, args]) => args);

beforeEach(() => {
  mockCalls.length = 0;
  mockResults.length = 0;
});

describe('chat history queries', () => {
  it("asks for a dog's newest 50 messages in (created_at, id) order and returns them oldest first", async () => {
    mockResults.push(serverPage(51, 100));
    const rows = await fetchChat('d1');
    expect(callsOf('from')).toEqual([['chat_history']]);
    expect(callsOf('eq')).toEqual([['dog_id', 'd1']]);
    expect(callsOf('order')).toEqual([
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
    expect(callsOf('limit')).toEqual([[CHAT_PAGE_SIZE]]);
    expect(rows.map((message) => message.message)).toEqual(Array.from({ length: 50 }, (_, i) => `הודעה ${51 + i}`));
  });

  it('reads the general conversation as dog_id null', async () => {
    await fetchChat(null);
    expect(callsOf('is')).toEqual([['dog_id', null]]);
  });

  it('pages strictly before a composite cursor, quoting the timestamp for PostgREST', async () => {
    await fetchChatBefore('d1', { createdAt: '2026-10-01T00:00:00.123+00:00', id: '00000000-0000-4000-8000-000000000051' });
    expect(callsOf('or')).toEqual([
      ['created_at.lt."2026-10-01T00:00:00.123+00:00",and(created_at.eq."2026-10-01T00:00:00.123+00:00",id.lt.00000000-0000-4000-8000-000000000051)'],
    ]);
    expect(callsOf('limit')).toEqual([[CHAT_PAGE_SIZE]]);
  });

  it('refuses an invalid cursor before any request is sent', async () => {
    await expect(fetchChatBefore('d1', { createdAt: '2026-10-01),id.gt.0', id: 'x' })).rejects.toThrow('Invalid chat cursor');
    expect(callsOf('then')).toEqual([]);
    expect(() => olderThanFilter({ createdAt: '2026-10-01T00:00:00Z', id: 'not-a-uuid' })).toThrow('Invalid chat cursor');
  });
});

describe('chat cursor helpers', () => {
  it('has no cursor for an optimistic placeholder the server has not stored', () => {
    expect(cursorFor({ id: 'pending-1793036253000', created_at: '2026-10-01T00:00:00.000Z' })).toBeNull();
    expect(cursorFor(row(5))).toEqual({ createdAt: row(5).created_at, id: row(5).id });
  });

  it('orders rows with equal timestamps by id, and keeps one copy of a row on both pages', () => {
    const tied = { ...row(9), id: '00000000-0000-4000-8000-0000000000ff', created_at: row(9).created_at };
    expect([tied, row(9)].sort(compareChronological).map((message) => message.id)).toEqual([row(9).id, tied.id]);
    const merged = mergeOlderMessages([row(9), tied, row(10)], [row(8), row(9)]);
    expect(merged.map((message) => message.id)).toEqual([row(8).id, row(9).id, tied.id, row(10).id]);
  });
});

describe('useChatConversation paging', () => {
  async function renderConversation() {
    const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const view = await renderHook(() => useChatConversation('d1', true), { wrapper });
    await waitFor(() => expect(view.result.current.history.isSuccess).toBe(true));
    return { ...view, client };
  }

  it('offers older messages after a full page, prepends them, and stops after a short page', async () => {
    mockResults.push(serverPage(51, 100));
    const { result } = await renderConversation();
    expect(result.current.hasOlder).toBe(true);

    mockResults.push(serverPage(41, 50));
    await act(async () => result.current.loadOlder());
    await waitFor(() => expect(result.current.isLoadingOlder).toBe(false));
    expect(callsOf('or').at(-1)).toEqual([olderThanFilter({ createdAt: row(51).created_at, id: row(51).id })]);
    expect(result.current.messages).toHaveLength(60);
    expect(result.current.messages[0]?.id).toBe(row(41).id);
    expect(result.current.hasOlder).toBe(false);
  });

  it('drops an older page that arrives after a refetch changed the oldest message', async () => {
    mockResults.push(serverPage(51, 100));
    const { result, client } = await renderConversation();
    let release: (value: unknown) => void = () => undefined;
    mockResults.push(new Promise((resolve) => (release = resolve)));
    await act(async () => result.current.loadOlder());
    // A refetch lands first: the window moved on to messages 61–110.
    await act(async () => client.setQueryData(queryKeys.chat('d1'), serverPage(61, 110).data.reverse()));
    await act(async () => release(serverPage(1, 50)));
    await waitFor(() => expect(result.current.isLoadingOlder).toBe(false));
    expect(result.current.messages[0]?.id).toBe(row(61).id);
    expect(result.current.messages).toHaveLength(50);
  });

  it('keeps an older page that races with a send: sends only append, so the oldest message is unchanged', async () => {
    mockResults.push(serverPage(51, 100));
    const { result } = await renderConversation();
    let release: (value: unknown) => void = () => undefined;
    mockResults.push(new Promise((resolve) => (release = resolve)));
    await act(async () => result.current.loadOlder());
    const stored = [row(200), row(201, 'assistant')];
    const { supabase } = jest.requireMock<{ supabase: { functions: { invoke: jest.Mock } } }>('@/lib/supabase');
    supabase.functions.invoke.mockResolvedValueOnce({ data: { messages: stored }, error: null });
    await act(async () => result.current.sendMessage('שאלה חדשה', () => undefined));
    await waitFor(() => expect(result.current.isSending).toBe(false));
    await act(async () => release(serverPage(1, 50)));
    await waitFor(() => expect(result.current.isLoadingOlder).toBe(false));
    expect(result.current.messages).toHaveLength(102);
    expect(result.current.messages[0]?.id).toBe(row(1).id);
    expect(result.current.messages.slice(-2).map((message) => message.id)).toEqual(stored.map((message) => message.id));
  });

  it('hides "load older" once the conversation is cleared', async () => {
    mockResults.push(serverPage(51, 100));
    const { result } = await renderConversation();
    expect(result.current.hasOlder).toBe(true);
    mockResults.push({ data: null, error: null });
    await act(async () => result.current.clearConversation(() => undefined));
    await waitFor(() => expect(result.current.messages).toEqual([]));
    expect(result.current.hasOlder).toBe(false);
  });
});
