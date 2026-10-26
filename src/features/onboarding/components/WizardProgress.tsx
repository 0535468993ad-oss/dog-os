import { StyleSheet, View } from 'react-native';

import { AppText, ProgressBar } from '@/components/ui';
import { spacing } from '@/constants/theme';

/** "Step x of y" with a progress bar, announced as one progress value. */
export function WizardProgress({ index, total }: { index: number; total: number }) {
  return (
    <View style={styles.root}>
      <AppText variant="caption" color="textSecondary">{`שלב ${index} מתוך ${total}`}</AppText>
      <ProgressBar value={index / total} label={`התקדמות באבחון: שלב ${index} מתוך ${total}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
});
