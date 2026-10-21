import type { ChatHistoryRow } from '@/lib/database.types';
import { toUserMessage } from '@/utils/errors';

import { CHAT_ERROR_MESSAGES, ChatError } from './chatErrors';

export const MAX_MESSAGE_LENGTH = 4000;

/** Placeholder row shown immediately while the user's message is being sent. */
export function optimisticUserMessage(dogId: string | null, message: string, now = new Date()): ChatHistoryRow {
  return { id: `pending-${now.getTime()}`, user_id: '', dog_id: dogId, role: 'user', message, created_at: now.toISOString() };
}

/** Swaps the optimistic placeholder for the stored user + assistant rows returned by the server. */
export function mergeSentMessages(history: ChatHistoryRow[], optimisticId: string, stored: ChatHistoryRow[]): ChatHistoryRow[] {
  return [...history.filter((m) => m.id !== optimisticId), ...stored];
}

/** Removes one message (rolls back an optimistic placeholder after a failed send). */
export function withoutMessage(history: ChatHistoryRow[], id: string): ChatHistoryRow[] {
  return history.filter((m) => m.id !== id);
}

/** Hebrew explanation for a failed send: known Edge Function codes first, otherwise a generic message. */
export function chatErrorMessage(error: unknown): string {
  if (error instanceof ChatError && CHAT_ERROR_MESSAGES[error.code]) return CHAT_ERROR_MESSAGES[error.code]!;
  return toUserMessage(error);
}
