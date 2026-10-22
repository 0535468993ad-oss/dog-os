import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, GlassCard } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { BreedMetrics, MonthlyCost, Rating } from '../types';
import { formatILS } from '../utils/costs';
import { METRIC_LABELS_HE, ratingText } from '../utils/labels';

const METRIC_KEYS = Object.keys(METRIC_LABELS_HE) as (keyof BreedMetrics)[];
const DOTS: readonly Rating[] = [1, 2, 3, 4, 5];

/** The 1–5 ratings as rows of five dots (the number is spoken, not just drawn). */
export function MetricsSection({ metrics }: { metrics: BreedMetrics }) {
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        מאפיינים
      </AppText>
      {METRIC_KEYS.map((key) => (
        <View key={key} style={styles.metricRow} accessible accessibilityLabel={`${METRIC_LABELS_HE[key]}: ${ratingText(metrics[key])}`}>
          <AppText variant="caption" style={styles.metricLabel}>
            {METRIC_LABELS_HE[key]}
          </AppText>
          <View style={styles.dots}>
            {DOTS.map((dot) => (
              <View key={dot} style={[styles.dot, dot <= metrics[key] && styles.dotOn]} />
            ))}
          </View>
        </View>
      ))}
    </GlassCard>
  );
}

/** Monthly upkeep broken into its parts. */
export function CostSection({ cost, priceRange, isRescue }: { cost: MonthlyCost; priceRange: { min: number; max: number }; isRescue: boolean }) {
  const rows = [
    { label: 'מזון', value: cost.foodILS },
    { label: 'ביטוח וטיפול מונע', value: cost.insuranceAndVetILS },
    { label: 'טיפוח', value: cost.groomingILS },
  ];
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        עלות חודשית משוערת
      </AppText>
      {rows.map((row) => (
        <View key={row.label} style={styles.costRow} accessible accessibilityLabel={`${row.label}: ${formatILS(row.value)}`}>
          <AppText color="textSecondary">{row.label}</AppText>
          <AppText>{formatILS(row.value)}</AppText>
        </View>
      ))}
      <View style={styles.costRow} accessible accessibilityLabel={`סך הכול בחודש: ${formatILS(cost.totalILS)}`}>
        <AppText variant="bodyStrong">סך הכול בחודש</AppText>
        <AppText variant="bodyStrong" color="accentCyan">
          {formatILS(cost.totalILS)}
        </AppText>
      </View>
      <AppText variant="caption" color="textSecondary">
        {isRescue
          ? `סל אימוץ: ${formatILS(priceRange.min)}–${formatILS(priceRange.max)} (חיסונים, שבב, עיקור/סירוס).`
          : `גור ממגדל רשום בהתאחדות: ${formatILS(priceRange.min)}–${formatILS(priceRange.max)}.`}
      </AppText>
    </GlassCard>
  );
}

/** A titled list inside a glass card. */
export function ListSection({ title, items, tone = 'default' }: { title: string; items: readonly string[]; tone?: 'default' | 'warning' }) {
  return (
    <GlassCard style={tone === 'warning' ? styles.warning : undefined}>
      <AppText variant="heading" accessibilityRole="header" color={tone === 'warning' ? 'warning' : 'textPrimary'}>
        {title}
      </AppText>
      <BulletList items={items} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricLabel: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  dotOn: {
    backgroundColor: colors.accentCyan,
    borderColor: colors.accentCyan,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  warning: {
    borderColor: colors.warning,
  },
});
