import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

const TIERS = ['סביבה ביתית שקטה', 'חצר / פארק שקט', 'סביבה עירונית עם גירויים'] as const;

/** Three-star environmental mastery: which rungs of home → yard → street are done, as stars and text. */
export function MasteryStars({ stars, compact = false }: { stars: number; compact?: boolean }) {
  const label = `שליטה סביבתית: ${stars} מתוך 3 כוכבים${stars < 3 ? `. הבא: ${TIERS[stars] ?? ''}` : ''}`;
  return (
    <View style={styles.root} accessible accessibilityRole="text" accessibilityLabel={label}>
      <View style={styles.row}>
        {TIERS.map((tier, index) => (
          <Ionicons key={tier} name={index < stars ? 'star' : 'star-outline'} size={compact ? 14 : 18} color={index < stars ? colors.accentOrange : colors.textMuted} accessible={false} />
        ))}
      </View>
      {compact ? null : (
        <AppText variant="caption" color="textSecondary">
          {stars >= 3 ? 'שליטה מלאה בכל סביבה' : `הכוכב הבא: ${TIERS[stars] ?? ''}`}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
