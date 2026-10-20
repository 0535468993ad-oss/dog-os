import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { AppText } from '@/components/ui';
import type { WeightLogRow } from '@/lib/database.types';
import { colors, spacing } from '@/constants/theme';
import { formatShortDate } from '@/utils/date';

const HEIGHT = 140;
const PAD = 12;

/** Weight trend line. Time runs left-to-right (chart convention) inside the RTL layout. */
export function WeightChart({ weights }: { weights: WeightLogRow[] }) {
  const [width, setWidth] = useState(0);
  const points = weights.slice(-12);

  if (points.length < 2) return null;

  const values = points.map((p) => p.weight_kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const x = (i: number) => PAD + (i * (width - PAD * 2)) / (points.length - 1);
  const y = (v: number) => PAD + (1 - (v - min) / range) * (HEIGHT - PAD * 2);

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const delta = Math.round((last.weight_kg - first.weight_kg) * 10) / 10;
  const summary = `גרף משקל: ${delta === 0 ? 'יציב' : delta > 0 ? `עלייה של ${delta} ק״ג` : `ירידה של ${-delta} ק״ג`}, מ-${first.weight_kg} ק״ג ב${formatShortDate(first.measured_on)} ל-${last.weight_kg} ק״ג ב${formatShortDate(last.measured_on)}.`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <View style={styles.chart} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Line x1={PAD} y1={HEIGHT - PAD} x2={width - PAD} y2={HEIGHT - PAD} stroke={colors.border} strokeWidth={1} />
            <Polyline
              points={points.map((p, i) => `${x(i)},${y(p.weight_kg)}`).join(' ')}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <Circle key={p.id} cx={x(i)} cy={y(p.weight_kg)} r={3.5} fill={colors.surface} stroke={colors.primary} strokeWidth={2} />
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={styles.axis}>
        <AppText variant="caption" color="textSecondary">
          {`${formatShortDate(first.measured_on)} · ${first.weight_kg} ק״ג`}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {`${formatShortDate(last.measured_on)} · ${last.weight_kg} ק״ג`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // No direction style needed: the SVG positions every point by absolute x, so the RTL layout can't flip it.
  chart: {
    height: HEIGHT,
  },
  axis: {
    flexDirection: 'row-reverse', // oldest on the left, matching the chart
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
});
