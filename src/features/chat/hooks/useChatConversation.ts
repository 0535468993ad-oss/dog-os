import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { ChatHistoryRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';
import { toUserMessage } from '@/utils/errors';

import { clearChat, fetchChat, sendChatMessage } from '../api/chat';
import { chatErrorMessage, mergeSentMessages, optimisticUserMessage, withoutMessage } from '../utils/chatMessages';

/**
 * Server state of one conversation (per dog, or general when dogId is null): history, optimistic sending
 * and clearing, plus the last error to show under the composer.
 */
export function useChatConversation(dogId: string | null, enabled: boolean) {
  const client = useQueryClient();
  const key = queryKeys.chat(dogId);
  const history = useQuery({ queryKey: key, queryFn: () => fetchChat(dogId), enabled });
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: (message: string) => sendChatMessage(dogId, message),
    onMutate: async (message) => {
      await client.cancelQueries({ queryKey: key });
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
    onSuccess: () => client.setQueryData(key, []),
    onError: (e) => setError(toUserMessage(e, 'מחיקת השיחה נכשלה. נסו שוב.')),
  });

  return {
    history,
    messages: history.data ?? [],
    error,
    isSending: send.isPending,
    isClearing: clear.isPending,
    /** Sends a message; `onFailed` gets it back so nothing typed is lost. */
    sendMessage: (message: string, onFailed: (message: string) => void) => {
      setError(null);
      send.mutate(message, { onError: () => onFailed(message) });
    },
    /** Deletes the whole conversation; `onSettled` runs either way (e.g. to close the confirmation). */
    clearConversation: (onSettled: () => void) => clear.mutate(undefined, { onSettled }),
  };
}
