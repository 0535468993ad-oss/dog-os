import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { bubbleStyles } from './bubbleStyles';

/** "Thinking…" bubble while the advisor replies; announced politely to screen readers. */
export function TypingIndicator() {
  return (
    <View style={[bubbleStyles.bubble, bubbleStyles.assistant, styles.row]} accessibilityLiveRegion="polite" accessibilityLabel="היועץ כותב תשובה">
      <ActivityIndicator size="small" color={colors.ai} />
      <AppText variant="caption" color="textSecondary">
        חושב…
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
