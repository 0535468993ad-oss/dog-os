import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ProgressBar } from '@/components/ui';
import { spacing, tabularNums } from '@/constants/theme';

import type { Vitality, VitalityMeter } from '../types';

const METER_LABELS_HE: Readonly<Record<VitalityMeter, string>> = {
  sharpness: 'חדות מוחית',
  drive: 'פריקת דחף',
  calm: 'ויסות רגשי',
  bond: 'עוצמת קשר',
};
const ORDER: readonly VitalityMeter[] = ['sharpness', 'drive', 'calm', 'bond'];

interface DogVitalityCardProps {
  dogName: string;
  vitality: Vitality;
  /** The persona's comment for a high or a low overall score. */
  commentHe: string;
  suggestedCommandNameHe: string;
  onLaunch: () => void;
}

/** The dog's training "digital twin": four game meters, a persona comment and a one-tap tailored session. */
export function DogVitalityCard({ dogName, vitality, commentHe, suggestedCommandNameHe, onLaunch }: DogVitalityCardProps) {
  return (
    <Card>
      <View style={styles.root}>
        <AppText variant="subheading" accessibilityRole="header">{`המצב של ${dogName}`}</AppText>
        <AppText>{commentHe}</AppText>
        {ORDER.map((meter) => (
          <View key={meter} style={styles.meter}>
            <AppText variant="caption" style={styles.meterLabel}>{METER_LABELS_HE[meter]}</AppText>
            <View style={styles.flex}>
              <ProgressBar value={vitality.meters[meter] / 100} label={`${METER_LABELS_HE[meter]}: ${vitality.meters[meter]}%`} />
            </View>
            <AppText variant="caption" color="textSecondary" style={[styles.meterValue, tabularNums]}>{`${vitality.meters[meter]}%`}</AppText>
          </View>
        ))}
        <Button title={`הזנק אימון מותאם: ${suggestedCommandNameHe}`} icon="flash-outline" onPress={onLaunch} />
        <AppText variant="caption" color="textSecondary" style={styles.disclaimer}>
          מדדי משחק שמחושבים מיומן האימונים בלבד – לא מדד בריאותי.
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  // One line per meter (label, bar, value) keeps the four meters compact.
  meter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meterLabel: {
    minWidth: 76,
  },
  meterValue: {
    minWidth: 36,
  },
  flex: {
    flex: 1,
  },
  disclaimer: {
    marginTop: spacing.xs,
  },
});
