import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface StatsRowProps {
  streak: number;
  completedModules: number;
  totalModules: number;
  lastWeightKg: number | null;
}

/** Three stat tiles: training streak, modules completed, latest weight. */
export function StatsRow({ streak, completedModules, totalModules, lastWeightKg }: StatsRowProps) {
  return (
    <View style={styles.row}>
      <StatTile icon="flame" value={String(streak)} caption="ימי רצף" label={`${streak} ימי רצף אימונים`} />
      <StatTile icon="trophy-outline" value={`${completedModules}/${totalModules}`} caption="מודולים" label={`${completedModules} מתוך ${totalModules} מודולים הושלמו`} />
      <StatTile
        icon="scale-outline"
        value={lastWeightKg != null ? String(lastWeightKg) : '—'}
        caption="ק״ג"
        label={lastWeightKg != null ? `משקל אחרון ${lastWeightKg} ק״ג` : 'אין שקילה רשומה'}
      />
    </View>
  );
}

/** One tile, read by screen readers as a single sentence (`label`) instead of separate fragments. */
function StatTile({ icon, value, caption, label }: { icon: ComponentProps<typeof Ionicons>['name']; value: string; caption: string; label: string }) {
  return (
    <Card style={styles.tile} accessibilityLabel={label}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={20} color={colors.primary} accessible={false} />
      </View>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" color="textSecondary">
        {caption}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
