import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

export interface DriveBarRow {
  labelHe: string;
  value: number;
  /** A second value to compare against (the other breed), drawn as an outline marker. */
  compare?: number;
}

/** 5-point bars for drive and temperament ratings; each row reads as "label: N of 5". */
export function DriveBars({ rows }: { rows: readonly DriveBarRow[] }) {
  return (
    <View style={styles.root}>
      {rows.map((row) => (
        <View
          key={row.labelHe}
          style={styles.row}
          accessible
          accessibilityLabel={row.compare === undefined ? `${row.labelHe}: ${row.value} מתוך 5` : `${row.labelHe}: ${row.value} מול ${row.compare} מתוך 5`}
        >
          <AppText variant="caption" style={styles.label}>
            {row.labelHe}
          </AppText>
          <View style={styles.track}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View key={step} style={[styles.cell, step <= row.value && styles.filled, row.compare !== undefined && step <= row.compare && styles.compared]} />
            ))}
          </View>
          <AppText variant="caption" color="textSecondary">
            {row.compare === undefined ? `${row.value}/5` : `${row.value} · ${row.compare}`}
          </AppText>
        </View>
      ))}
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
  label: {
    width: 104,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  cell: {
    flex: 1,
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  filled: {
    backgroundColor: colors.accentCyan,
    borderColor: colors.accentCyan,
  },
  compared: {
    borderColor: colors.accentOrange,
    borderWidth: 2,
  },
});
