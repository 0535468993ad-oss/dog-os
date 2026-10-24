import { StyleSheet, View } from 'react-native';

import { AppText, IconButton, ProgressBar } from '@/components/ui';
import { spacing } from '@/constants/theme';

interface StepSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** The value as read aloud and shown, e.g. "16 קילוהרץ". */
  valueText: string;
  onChange: (value: number) => void;
}

/**
 * A stepped slider: −/+ buttons around a track. Exposed as one "adjustable" control, so screen readers
 * change it with swipe up/down; the buttons give everyone a precise, tap-sized way to do the same.
 */
export function StepSlider({ label, value, min, max, step, valueText, onChange }: StepSliderProps) {
  const ratio = (value - min) / Math.max(1, max - min);
  return (
    <View style={styles.root}>
      <AppText variant="label">{label}</AppText>
      <View
        style={styles.row}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: valueText }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => onChange(event.nativeEvent.actionName === 'increment' ? Math.min(max, value + step) : Math.max(min, value - step))}
      >
        <IconButton icon="remove" accessibilityLabel={`הורדת ${label}`} onPress={() => onChange(Math.max(min, value - step))} disabled={value <= min} />
        <View style={styles.track}>
          <ProgressBar value={ratio} label={label} />
          <AppText variant="bodyStrong" center>
            {valueText}
          </AppText>
        </View>
        <IconButton icon="add" accessibilityLabel={`הגברת ${label}`} onPress={() => onChange(Math.min(max, value + step))} disabled={value >= max} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    flex: 1,
    gap: spacing.xs,
  },
});
