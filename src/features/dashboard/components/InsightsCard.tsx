import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, Skeleton, SkeletonBlock } from '@/components/ui';
import type { AiSharing } from '@/features/legal/types';
import { colors, radius, spacing } from '@/constants/theme';

import type { InsightKind } from '../logic/insight';
import type { InsightsToShow } from '../logic/selectInsights';

const INSIGHT_ICONS: Record<InsightKind, ComponentProps<typeof Ionicons>['name']> = {
  health: 'medkit-outline',
  training: 'school-outline',
  behavior: 'happy-outline',
  nutrition: 'nutrition-outline',
};

/** "Daily insights" card: AI or rule-based insights, high-priority ones marked in text, icon and color. */
export function InsightsCard({ insights, sharing }: { insights: InsightsToShow | null; sharing: AiSharing }) {
  return (
    <Card tone="primary">
      <View style={styles.row}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={18} color={colors.onPrimary} accessible={false} />
        </View>
        <AppText variant="heading" style={styles.flex} accessibilityRole="header">
          תובנות יומיות
        </AppText>
        {insights ? <Badge label={insights.source === 'ai' ? 'AI' : 'מותאם אישית'} tone="primary" /> : null}
      </View>
      {insights ? (
        insights.list.map((insight) => {
          const high = insight.priority === 'high';
          return (
            <View key={insight.title} style={styles.insight}>
              <View style={[styles.insightIcon, high && styles.insightIconHigh]}>
                <Ionicons name={high ? 'alert-circle' : INSIGHT_ICONS[insight.kind]} size={18} color={high ? colors.dangerText : colors.primary} accessible={false} />
              </View>
              <View style={styles.flex}>
                <AppText variant="subheading" color={high ? 'dangerText' : 'textPrimary'}>
                  {high ? `חשוב: ${insight.title}` : insight.title}
                </AppText>
                <AppText variant="caption">{insight.body}</AppText>
              </View>
            </View>
          );
        })
      ) : (
        <Skeleton label="מכינים תובנות">
          {[0, 1].map((i) => (
            <View key={i} style={styles.insight}>
              <SkeletonBlock round height={34} />
              <View style={[styles.flex, styles.skeletonText]}>
                <SkeletonBlock width="60%" height={14} />
                <SkeletonBlock width="90%" height={11} />
              </View>
            </View>
          ))}
        </Skeleton>
      )}
      <AppText variant="caption" color="textSecondary">
        {sharing === 'opted_out' ? 'שיתוף המידע עם ה-AI כבוי – התובנות מחושבות במכשיר.' : 'תובנות כלליות שאינן מחליפות ייעוץ מקצועי.'}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  insight: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightIconHigh: {
    backgroundColor: colors.dangerMuted,
  },
  skeletonText: {
    gap: spacing.xs + 2,
  },
});
