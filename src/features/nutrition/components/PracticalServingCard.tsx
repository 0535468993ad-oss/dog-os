import { StyleSheet, View } from 'react-native';

import { AppText, GlassCard, TextField } from '@/components/ui';
import { colors, spacing, textGlow } from '@/constants/theme';

import type { EnergyBudget, FoodProduct, ServingPlan } from '../types';
import { LABEL_KCAL_RANGE } from '../utils/profile';

interface PracticalServingCardProps {
  dogName: string;
  product: FoodProduct;
  serving: ServingPlan;
  budget: EnergyBudget;
  labelKcalText: string;
  onLabelKcalChange: (text: string) => void;
}

/** Today's portion of the chosen product, big and practical – or what's needed before it can be shown. */
export function PracticalServingCard({ dogName, product, serving, budget, labelKcalText, onLabelKcalChange }: PracticalServingCardProps) {
  return (
    <GlassCard accessibilityLabel={serving.status === 'ready' ? `המנה של ${dogName}: ${serving.headlineHe}. ${serving.detailHe}` : undefined}>
      <AppText variant="label" color="textSecondary">{`המנה היומית של ${dogName} · ${product.nameHe}`}</AppText>

      {serving.status === 'ready' ? (
        <>
          <AppText variant="display" color="accentBronze" style={styles.glowBronze}>
            {serving.headlineHe}
          </AppText>
          <AppText variant="bodyStrong" color="accentGold" style={styles.glowGold}>
            {serving.detailHe}
          </AppText>
          <AppText variant="caption" color="textSecondary">{`${budget.bowlKcal} קק״ל לקערה, אחרי ש־${budget.treatSharePercent}% נשמרו לאימונים`}</AppText>
          {serving.noteHe ? <AppText variant="caption" color="warning">{serving.noteHe}</AppText> : null}
        </>
      ) : null}

      {serving.status === 'needs_label_kcal' ? (
        <AppText>היצרן לא מפרסם ערך קלורי שהצלחנו לאמת, אז לא ננחש. הסתכלו על האריזה ומלאו כאן – והמנה תופיע מיד.</AppText>
      ) : null}
      {/* Stays visible once the portion shows, so a typo can be corrected. */}
      {product.specSource === 'label-required' && product.category !== 'SUPPLEMENT' && product.dietRole !== 'COMPLEMENTARY' ? (
        <TextField
          label="קלוריות ל־100 גרם (מהאריזה)"
          value={labelKcalText}
          onChangeText={onLabelKcalChange}
          error={labelKcalText.trim() && serving.status === 'needs_label_kcal' ? `ערך בין ${LABEL_KCAL_RANGE.min} ל־${LABEL_KCAL_RANGE.max}. אם כתוב kcal/kg – מחלקים ב־10.` : null}
          hint='מחפשים על האריזה "אנרגיה מטבולית" או ME. אם כתוב kcal/kg – מחלקים ב־10.'
          inputMode="decimal"
          keyboardType="decimal-pad"
          maxLength={6}
        />
      ) : null}

      {serving.status === 'complementary_only' ? (
        <AppText color="warning">
          {`${product.nameHe} הוא "מזון משלים" לפי היצרן – הוא לא נותן את כל הוויטמינים והמינרלים, ולכן לא מחשבים ממנו מנה כאוכל יחיד. אפשר לשלב אותו כתוספת לקערה של מזון מלא, ולהוריד מהמזון המלא בהתאם.`}
        </AppText>
      ) : null}

      {serving.status === 'supplement' ? (
        <View style={styles.block}>
          <AppText>{serving.labelDosingHe}</AppText>
          {serving.omega3TargetHe ? <AppText variant="caption" color="accentGold">{serving.omega3TargetHe}</AppText> : null}
        </View>
      ) : null}

      {serving.status === 'unsupported_age' ? <AppText>{serving.reasonHe}</AppText> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
  },
  glowBronze: {
    ...textGlow(colors.accentBronze),
  },
  glowGold: {
    ...textGlow(colors.accentGold),
  },
});
