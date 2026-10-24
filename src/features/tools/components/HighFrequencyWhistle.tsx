import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Button } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { WHISTLE_GUIDE_HE, WHISTLE_MAX_HZ, WHISTLE_MIN_HZ, WHISTLE_STEP_HZ } from '../data/whistle';
import { useWhistle } from '../hooks/useWhistle';
import { StepSlider } from './StepSlider';

/** "16.5 קילוהרץ" */
const kHz = (hz: number) => `${(hz / 1000).toFixed(1).replace(/\.0$/, '')} קילוהרץ`;

/** Level 6 reward: a 15–22 kHz whistle with a frequency slider and a haptic pulse on each blast. */
export function HighFrequencyWhistle() {
  const whistle = useWhistle();
  return (
    <View style={styles.root}>
      <AppText variant="heading" accessibilityRole="header">
        משרוקית בתדר גבוה
      </AppText>
      <StepSlider
        label="תדר"
        value={whistle.frequencyHz}
        min={WHISTLE_MIN_HZ}
        max={WHISTLE_MAX_HZ}
        step={WHISTLE_STEP_HZ}
        valueText={kHz(whistle.frequencyHz)}
        onChange={whistle.setFrequency}
      />
      <Button title="שריקה" icon="radio-outline" onPress={whistle.blast} accessibilityHint="משמיע שריקה קצרה בתדר שנבחר" />
      {whistle.failed ? (
        <AppText variant="caption" color="dangerText" accessibilityRole="alert">
          המכשיר לא הצליח להשמיע את הצליל. נסו תדר נמוך יותר או בדקו את עוצמת השמע.
        </AppText>
      ) : null}
      <BulletList items={WHISTLE_GUIDE_HE} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
