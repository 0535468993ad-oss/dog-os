import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme';

/**
 * Shared chat bubble shapes. In RTL, flex-start is the right side: the user's messages sit on the right.
 * The user speaks in brand amber; the advisor in AI indigo (tint + accent edge) with navy text.
 */
export const bubbleStyles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  user: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderBottomStartRadius: spacing.xs,
  },
  assistant: {
    alignSelf: 'flex-end',
    backgroundColor: colors.aiMuted,
    borderWidth: 1,
    borderColor: colors.aiMuted,
    borderEndWidth: 3,
    borderEndColor: colors.aiBright,
    borderBottomEndRadius: spacing.xs,
  },
});
