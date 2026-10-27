import { useCallback, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View, type ListRenderItem } from 'react-native';

import { Button, ErrorState, LoadingState, Screen, StaleDataNotice } from '@/components/ui';
import { EmergencyAlertPanel } from '@/features/ai-advisor/components/EmergencyAlertPanel';
import { useEmergencyIntercept } from '@/features/ai-advisor/hooks/useEmergencyIntercept';
import { useUser } from '@/features/auth/AuthProvider';
import { useActiveDog } from '@/features/dogs/hooks';
import { useAiSharing } from '@/features/legal/hooks/consents';
import type { ChatHistoryRow } from '@/lib/database.types';
import { cacheState } from '@/lib/queryView';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { AiSharingNotice } from './components/AiSharingNotice';
import { ChatComposer } from './components/ChatComposer';
import { ChatEmptyState } from './components/ChatEmptyState';
import { ChatHeader } from './components/ChatHeader';
import { ClearChatConfirm } from './components/ClearChatConfirm';
import { MessageBubble } from './components/MessageBubble';
import { SmartPromptChips } from './components/SmartPromptChips';
import { TypingIndicator } from './components/TypingIndicator';
import { promptChips } from './utils/promptChips';
import { useChatConversation } from './hooks/useChatConversation';

// Stable list callbacks: with memoized bubbles, typing in the composer no longer re-renders the conversation.
const messageKey = (item: ChatHistoryRow) => item.id;
const renderMessage: ListRenderItem<ChatHistoryRow> = ({ item }) => <MessageBubble message={item} />;

/** AI advisor tab: composes the conversation, composer and controls for the active dog. */
export function ChatScreen() {
  const user = useUser();
  const sharing = useAiSharing(user.id);
  const { dogs, activeDog, isLoading } = useActiveDog();
  const chat = useChatConversation(activeDog?.id ?? null, !isLoading);
  const [draft, setDraft] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<FlatList<ChatHistoryRow>>(null);
  const lastShownId = useRef<string | null>(null);
  const emergency = useEmergencyIntercept();
  const newestId = chat.messages.at(-1)?.id ?? null;
  // Scrolls to the end only when the newest message changes (a send or a reply), not when older pages load.
  const followNewest = useCallback(() => {
    if (newestId === lastShownId.current) return;
    lastShownId.current = newestId;
    listRef.current?.scrollToEnd({ animated: true });
  }, [newestId]);

  // Sends the draft (or a prompt chip's question); a failed send puts the text back in the composer.
  // The on-device emergency guardrail runs first: an emergency gets fixed first-aid steps at once, not the model.
  const submit = (text = draft) => {
    const message = text.trim();
    if (!message || chat.isSending || sharing !== 'allowed') return;
    setDraft('');
    if (emergency.intercept(message)) return;
    chat.sendMessage(message, setDraft);
  };
  const sendAnyway = () => {
    const message = emergency.release();
    if (message) chat.sendMessage(message, setDraft);
  };
  const closeEmergency = () => setDraft(emergency.release() ?? '');

  if (isLoading || chat.history.isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }
  const view = cacheState(chat.history.error, chat.history.data !== undefined);
  if (view === 'failed') {
    return (
      <Screen scroll={false}>
        <ErrorState message={toUserMessage(chat.history.error)} onRetry={() => void chat.history.refetch()} />
      </Screen>
    );
  }

  const dogName = activeDog?.name ?? null;

  return (
    <Screen
      scroll={false}
      footer={
        sharing !== 'allowed' ? (
          <AiSharingNotice state={sharing} />
        ) : (
          <View>
            {/* Hidden while typing, so the chips never compete with the user's own question. */}
            {draft ? null : <SmartPromptChips chips={promptChips(dogName)} onPick={submit} disabled={chat.isSending} />}
            <ChatComposer
              draft={draft}
              onChangeDraft={setDraft}
              onSubmit={() => submit()}
              placeholder={dogName ? `שאלו על ${dogName}…` : 'שאלו כל שאלה על כלבים…'}
              sending={chat.isSending}
              error={chat.error}
            />
          </View>
        )
      }
    >
      <ChatHeader dogs={dogs} activeDog={activeDog} hasMessages={chat.messages.length > 0} onRequestClear={() => setConfirmClear(true)} />
      <StaleDataNotice visible={view === 'stale'} onRetry={() => void chat.history.refetch()} />

      {confirmClear ? (
        <ClearChatConfirm onCancel={() => setConfirmClear(false)} onConfirm={() => chat.clearConversation(() => setConfirmClear(false))} clearing={chat.isClearing} />
      ) : null}

      {emergency.alerts ? (
        <ScrollView contentContainerStyle={styles.list}>
          <EmergencyAlertPanel alerts={emergency.alerts} onSendAnyway={sendAnyway} onClose={closeEmergency} />
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={messageKey}
          contentContainerStyle={styles.list}
          // Older pages are prepended: keep the reader where they were instead of jumping.
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onContentSizeChange={followNewest}
          accessibilityLabel="היסטוריית השיחה"
          ListHeaderComponent={
            chat.hasOlder ? <Button title="טעינת הודעות קודמות" variant="ghost" icon="time-outline" compact onPress={chat.loadOlder} loading={chat.isLoadingOlder} /> : undefined
          }
          ListEmptyComponent={<ChatEmptyState dogName={dogName} />}
          ListFooterComponent={chat.isSending ? <TypingIndicator /> : undefined}
          renderItem={renderMessage}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
});
