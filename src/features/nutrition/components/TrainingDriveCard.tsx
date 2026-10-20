import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, GlassCard } from '@/components/ui';
import { spacing } from '@/constants/theme';

import type { EnergyBudget } from '../types';
import { REWARD_BITE_KCAL, TRAINING_REWARDS_HE, TRAINING_TIPS_HE } from '../utils/trainingReserve';

/** The training-reward reserve: how many kcal it holds, what to reward with, and how to train hungry-but-happy. */
export function TrainingDriveCard({ budget }: { budget: EnergyBudget }) {
  const bites = Math.floor(budget.treatKcal / REWARD_BITE_KCAL);
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        שמורת האימונים
      </AppText>
      <View style={styles.stats}>
        <Stat label="סך היום" value={`${budget.dailyKcal} קק״ל`} />
        <Stat label={`לפרסים (${budget.treatSharePercent}%)`} value={`${budget.treatKcal} קק״ל`} accent />
        <Stat label="לקערה" value={`${budget.bowlKcal} קק״ל`} />
      </View>
      <AppText variant="caption" color="textSecondary">{`זה בערך ${bites} ביסים קטנים של פרס לאורך היום.`}</AppText>
      <AppText variant="subheading">במה מתגמלים</AppText>
      <BulletList items={TRAINING_REWARDS_HE} />
      <AppText variant="subheading">איך מתאמנים</AppText>
      <BulletList items={TRAINING_TIPS_HE} />
    </GlassCard>
  );
}

/** One labelled number in the stats row. */
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="bodyStrong" color={accent ? 'accentOrange' : 'textPrimary'}>
        {value}
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    gap: spacing.xxs,
  },
});
