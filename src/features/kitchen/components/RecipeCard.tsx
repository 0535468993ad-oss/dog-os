import { StyleSheet, View } from 'react-native';

import { AppText, Divider, GlassCard } from '@/components/ui';
import { spacing } from '@/constants/theme';

import type { EmergencyPortionPlan } from '../types';

type ReadyPlan = Extract<EmergencyPortionPlan, { status: 'ready' }>;

/** The bland-diet meal: grams per ingredient for one meal, the preparation steps, and how to serve it. */
export function RecipeCard({ plan }: { plan: ReadyPlan }) {
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        {plan.recipe.titleHe}
      </AppText>
      <AppText variant="caption" color="textSecondary">{`כמויות לארוחה אחת · ${plan.mealsPerDay} ארוחות ביום · משקל אחרי בישול`}</AppText>

      <View style={styles.table}>
        {plan.breakdownHe.map((line) => (
          <View key={line.item} style={styles.row} accessible accessibilityLabel={`${line.item}: ${line.grams} גרם`}>
            <AppText style={styles.flex}>{line.item}</AppText>
            <AppText variant="bodyStrong" color="accentOrange">{`${line.grams} גרם`}</AppText>
          </View>
        ))}
        <Divider />
        <View style={styles.row} accessible accessibilityLabel={`סך הכול לארוחה: ${plan.totalMealGrams} גרם`}>
          <AppText variant="bodyStrong" style={styles.flex}>
            סך הכול לארוחה
          </AppText>
          <AppText variant="bodyStrong">{`${plan.totalMealGrams} גרם`}</AppText>
        </View>
      </View>

      <AppText variant="subheading" accessibilityRole="header">
        איך מכינים
      </AppText>
      {plan.instructionsHe.map((step, index) => (
        <View key={step} style={styles.step}>
          <AppText variant="label" color="accentBronze" style={styles.stepNumber}>{`${index + 1}.`}</AppText>
          <AppText style={styles.flex}>{step}</AppText>
        </View>
      ))}

      <AppText variant="subheading" accessibilityRole="header">
        איך מגישים
      </AppText>
      <AppText color="textSecondary">{plan.recipe.servingAdviceHe}</AppText>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  table: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepNumber: {
    minWidth: 20,
  },
});
