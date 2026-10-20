import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** Empty conversation: who the advisor is. Starter questions are the prompt chips above the composer. */
export function ChatEmptyState({ dogName }: { dogName: string | null }) {
  return (
    <View style={styles.empty}>
      <View style={styles.icon}>
        <Ionicons name="sparkles" size={30} color={colors.ai} accessible={false} />
      </View>
      <AppText variant="heading" center>
        {dogName ? `היועץ מכיר את ${dogName}` : 'היועץ החכם של Dog OS'}
      </AppText>
      <AppText center color="textSecondary">
        מומחה להתנהגות כלבים עם ידע וטרינרי כללי. התשובות אינן מחליפות וטרינר.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.aiMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
