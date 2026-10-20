import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState, Screen } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useActiveDog } from '@/features/dogs/hooks';
import { useAiSharing } from '@/features/legal/hooks/consents';
import type { ChatHistoryRow } from '@/lib/database.types';
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
import { promptChips } from './logic/promptChips';
import { useChatConversation } from './useChatConversation';

/** AI advisor tab: composes the conversation, composer and controls for the active dog. */
export function ChatScreen() {
  const user = useUser();
  const sharing = useAiSharing(user.id);
  const { dogs, activeDog, isLoading } = useActiveDog();
  const chat = useChatConversation(activeDog?.id ?? null, !isLoading);
  const [draft, setDraft] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<FlatList<ChatHistoryRow>>(null);

  // Sends the draft (or a prompt chip's question); a failed send puts the text back in the composer.
  const submit = (text = draft) => {
    const message = text.trim();
    if (!message || chat.isSending || sharing !== 'allowed') return;
    setDraft('');
    chat.sendMessage(message, setDraft);
  };

  if (isLoading || chat.history.isLoading) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }
  if (chat.history.error) {
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

      {confirmClear ? (
        <ClearChatConfirm onCancel={() => setConfirmClear(false)} onConfirm={() => chat.clearConversation(() => setConfirmClear(false))} clearing={chat.isClearing} />
      ) : null}

      <FlatList
        ref={listRef}
        data={chat.messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        accessibilityLabel="היסטוריית השיחה"
        ListEmptyComponent={<ChatEmptyState dogName={dogName} />}
        ListFooterComponent={chat.isSending ? <TypingIndicator /> : undefined}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />
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
