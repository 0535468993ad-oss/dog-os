import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, type ColorToken } from '@/theme';

import { AppText } from './AppText';

export type FeedbackKind = 'error' | 'info' | 'success';

export interface Feedback {
  kind: FeedbackKind;
  text: string;
}

const PALETTE: Record<FeedbackKind, { bg: ColorToken; fg: ColorToken }> = {
  error: { bg: 'dangerMuted', fg: 'dangerText' },
  info: { bg: 'infoMuted', fg: 'info' },
  success: { bg: 'successMuted', fg: 'success' },
};

/** Result message after a form action, read out as one announcement by screen readers. */
export function FeedbackBanner({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null;
  const palette = PALETTE[feedback.kind];
  return (
    <View style={[styles.banner, { backgroundColor: colors[palette.bg] }]} accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
      <AppText variant="label" color={palette.fg}>
        {feedback.text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
  },
});
