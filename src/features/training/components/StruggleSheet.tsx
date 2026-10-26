import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { STRUGGLE_CAUSE_LABELS_HE } from '../data/struggleDiagnostics';
import type { StruggleCause, TrainingCommand } from '../types';

const CAUSES = Object.keys(STRUGGLE_CAUSE_LABELS_HE) as StruggleCause[];

interface StruggleSheetProps {
  command: TrainingCommand;
  /** The persona's coaching line. */
  coachHe: string;
  onClose: () => void;
}

/** The "we're stuck" micro-sheet: three likely causes, each with an instant fix. The session timer keeps running. */
export function StruggleSheet({ command, coachHe, onClose }: StruggleSheetProps) {
  const [cause, setCause] = useState<StruggleCause | null>(null);
  return (
    <View style={styles.root} accessibilityRole="alert">
      <AppText variant="bodyStrong">{coachHe}</AppText>
      <AppText variant="caption" color="textSecondary">
        מה קרה? הטיימר ממשיך לרוץ.
      </AppText>
      <View style={styles.causes}>
        {CAUSES.map((value) => (
          <Button key={value} title={STRUGGLE_CAUSE_LABELS_HE[value]} variant={cause === value ? 'primary' : 'secondary'} compact onPress={() => setCause(value)} />
        ))}
      </View>
      {cause ? (
        <AppText accessibilityLiveRegion="polite">{command.struggleDiagnostics[cause]}</AppText>
      ) : null}
      <Button title="חוזרים לאימון" variant="ghost" compact onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.surface,
  },
  causes: {
    gap: spacing.xs,
  },
});
