import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Button, GlassCard } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { VolhardResult, VolhardScore } from '../types';

const SCORES: readonly VolhardScore[] = [1, 2, 3, 4, 5, 6];
const TEST_COUNT = 10;

/** The temperament profile with the score distribution behind it. */
export function VolhardSummary({ result, onReview, onReset }: { result: VolhardResult; onReview: () => void; onReset: () => void }) {
  const { profile, distribution } = result;
  return (
    <View style={styles.root}>
      <GlassCard>
        <AppText variant="caption" color="accentBronze">{`פרופיל ${profile.id}${result.mixed ? ' · מעורב' : ''}`}</AppText>
        <AppText variant="heading" accessibilityRole="header">
          {profile.titleHe}
        </AppText>
        <AppText>{profile.summaryHe}</AppText>
        <AppText variant="label" color="success">
          הבית המתאים
        </AppText>
        <AppText>{profile.bestHomeHe}</AppText>
        <AppText variant="label" color="warning">
          פחות מתאים
        </AppText>
        <AppText>{profile.notForHe}</AppText>
        {result.tieBreakHe ? (
          <AppText variant="caption" color="textSecondary">
            {result.tieBreakHe}
          </AppText>
        ) : null}
      </GlassCard>

      <GlassCard>
        <AppText variant="heading" accessibilityRole="header">
          פיזור הציונים
        </AppText>
        {SCORES.map((score) => (
          <View key={score} style={styles.barRow} accessible accessibilityLabel={`ציון ${score}: ${distribution[score]} מבחנים`}>
            <AppText variant="label" style={styles.barLabel}>
              {score}
            </AppText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(distribution[score] / TEST_COUNT) * 100}%` }, score === profile.id && styles.fillTop]} />
            </View>
            <AppText variant="caption" color="textSecondary" style={styles.barCount}>
              {distribution[score]}
            </AppText>
          </View>
        ))}
      </GlassCard>

      {result.notesHe.length > 0 ? (
        <GlassCard>
          <AppText variant="heading" accessibilityRole="header">
            הערות לפי מבחן
          </AppText>
          <BulletList items={result.notesHe} />
        </GlassCard>
      ) : null}

      <View style={styles.actions}>
        <Button title="חזרה לציונים" variant="secondary" compact onPress={onReview} />
        <Button title="גור חדש" variant="ghost" compact icon="refresh" onPress={onReset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    width: 16,
    textAlign: 'center',
  },
  track: {
    flex: 1,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  fillTop: {
    backgroundColor: colors.accentBronze,
  },
  barCount: {
    width: 20,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
