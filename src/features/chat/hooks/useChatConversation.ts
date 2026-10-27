import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import type { ChatHistoryRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';
import { toUserMessage } from '@/utils/errors';

import { CHAT_PAGE_SIZE, clearChat, fetchChat, fetchChatBefore, sendChatMessage } from '../api/chat';
import { cursorFor, mergeOlderMessages } from '../utils/chatCursor';
import { chatErrorMessage, mergeSentMessages, optimisticUserMessage, withoutMessage } from '../utils/chatMessages';

/**
 * Server state of one conversation (per dog, or general when dogId is null): the newest page of history with
 * older pages on demand, optimistic sending and clearing, plus the last error to show under the composer.
 */
export function useChatConversation(dogId: string | null, enabled: boolean) {
  const client = useQueryClient();
  const key = queryKeys.chat(dogId);
  const olderKey = queryKeys.chatHasOlder(dogId);
  const history = useQuery({
    queryKey: key,
    queryFn: async () => {
      const rows = await fetchChat(dogId);
      client.setQueryData(olderKey, rows.length === CHAT_PAGE_SIZE);
      return rows;
    },
    enabled,
  });
  // Written by each page fetch and read from the cache, so it survives leaving and returning to the screen.
  const olderFlag = useQuery({ queryKey: olderKey, queryFn: () => false, enabled: false, staleTime: Infinity });
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const loadingOlder = useRef(false);

  const send = useMutation({
    mutationFn: (message: string) => sendChatMessage(dogId, message),
    onMutate: async (message) => {
      await client.cancelQueries({ queryKey: key, exact: true });
      const optimistic = optimisticUserMessage(dogId, message);
      client.setQueryData<ChatHistoryRow[]>(key, (old = []) => [...old, optimistic]);
      return { optimisticId: optimistic.id };
    },
    onSuccess: (rows, _message, context) => {
      client.setQueryData<ChatHistoryRow[]>(key, (old = []) => (context ? mergeSentMessages(old, context.optimisticId, rows) : [...old, ...rows]));
    },
    onError: (e, _message, context) => {
      if (context) client.setQueryData<ChatHistoryRow[]>(key, (old = []) => withoutMessage(old, context.optimisticId));
      setError(chatErrorMessage(e));
    },
  });

  const clear = useMutation({
    mutationFn: () => clearChat(dogId),
    onSuccess: () => {
      client.setQueryData(key, []);
      client.setQueryData(olderKey, false);
    },
    onError: (e) => setError(toUserMessage(e, 'מחיקת השיחה נכשלה. נסו שוב.')),
  });

  // Prepends the page before the oldest cached message. A result is dropped when the cache moved on meanwhile
  // (a refetch or a clear changed the oldest message), so a late page can never splice into a newer window.
  const loadOlder = async () => {
    const oldest = client.getQueryData<ChatHistoryRow[]>(key)?.[0];
    const cursor = oldest ? cursorFor(oldest) : null;
    if (loadingOlder.current || !oldest || !cursor) return;
    loadingOlder.current = true;
    setIsLoadingOlder(true);
    setError(null);
    try {
      const older = await fetchChatBefore(dogId, cursor);
      const current = client.getQueryData<ChatHistoryRow[]>(key) ?? [];
      if (current[0]?.id !== oldest.id) return;
      client.setQueryData(key, mergeOlderMessages(current, older));
      client.setQueryData(olderKey, older.length === CHAT_PAGE_SIZE);
    } catch (e) {
      setError(toUserMessage(e, 'טעינת ההודעות הקודמות נכשלה. נסו שוב.'));
    } finally {
      loadingOlder.current = false;
      setIsLoadingOlder(false);
    }
  };

  const messages = history.data ?? [];
  return {
    history,
    messages,
    error,
    isSending: send.isPending,
    isClearing: clear.isPending,
    /** Older messages exist on the server beyond what is shown. */
    hasOlder: olderFlag.data === true && messages.length > 0,
    isLoadingOlder,
    loadOlder: () => void loadOlder(),
    /** Sends a message; `onFailed` gets it back so nothing typed is lost. */
    sendMessage: (message: string, onFailed: (message: string) => void) => {
      setError(null);
      send.mutate(message, { onError: () => onFailed(message) });
    },
    /** Deletes the whole conversation; `onSettled` runs either way (e.g. to close the confirmation). */
    clearConversation: (onSettled: () => void) => clear.mutate(undefined, { onSettled }),
  };
}
