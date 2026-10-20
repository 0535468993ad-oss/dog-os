import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { ChatHistoryRow } from '@/lib/database.types';
import { colors, fonts, spacing } from '@/theme';
import { formatTime } from '@/utils/date';

import { bubbleStyles } from './bubbleStyles';

/** One chat message, read by screen readers as "who, time: text". */
export function MessageBubble({ message }: { message: ChatHistoryRow }) {
  const mine = message.role === 'user';
  return (
    <View
      style={[bubbleStyles.bubble, mine ? bubbleStyles.user : bubbleStyles.assistant]}
      accessible
      accessibilityLabel={`${mine ? 'אתם' : 'היועץ'}, ${formatTime(message.created_at)}: ${message.message}`}
    >
      {mine ? null : (
        <View style={styles.aiLabel}>
          <Ionicons name="sparkles" size={12} color={colors.ai} accessible={false} />
          <AppText variant="caption" style={styles.aiLabelText}>
            היועץ החכם
          </AppText>
        </View>
      )}
      <AppText style={mine ? styles.userText : undefined} selectable>
        {message.message}
      </AppText>
      <AppText variant="caption" style={mine ? styles.userMeta : styles.meta}>
        {formatTime(message.created_at)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  userText: {
    color: colors.onPrimary,
  },
  userMeta: {
    color: colors.onPrimary,
    opacity: 0.9,
  },
  meta: {
    color: colors.textSecondary,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  // 5.6:1 on aiMuted.
  aiLabelText: {
    color: colors.ai,
    fontFamily: fonts.semibold,
  },
});
