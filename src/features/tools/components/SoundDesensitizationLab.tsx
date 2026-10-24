import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Button, ChipGroup } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { DESENSITIZATION_PROTOCOL_HE, RECORDING_MISSING_HE, SOUND_TRIGGERS, VOLUME_STEPS } from '../data/soundLab';
import { useSoundLab } from '../hooks/useSoundLab';
import type { SoundTriggerId } from '../types';
import { StepSlider } from './StepSlider';

const OPTIONS = SOUND_TRIGGERS.map((trigger) => ({ value: trigger.id, label: trigger.titleHe }));

/** Level 3 reward: graded exposure to everyday noises, paired with treats, one fader step at a time. */
export function SoundDesensitizationLab() {
  const lab = useSoundLab();
  return (
    <View style={styles.root}>
      <AppText variant="heading" accessibilityRole="header">
        מעבדת הרגלה לרעשים
      </AppText>
      <ChipGroup<SoundTriggerId> options={OPTIONS} value={lab.triggerId} onChange={lab.selectTrigger} accessibilityLabel="סוג הרעש" />
      {lab.trigger ? <AppText color="textSecondary">{lab.trigger.whyHe}</AppText> : null}
      <StepSlider label="עוצמה" value={lab.step} min={1} max={VOLUME_STEPS} step={1} valueText={`שלב ${lab.step} מתוך ${VOLUME_STEPS}`} onChange={lab.setStep} />
      {lab.hasRecording ? (
        <Button title={lab.playing ? 'עצירה' : 'השמעה'} icon={lab.playing ? 'pause' : 'play'} onPress={lab.toggle} />
      ) : (
        <View style={styles.notice} accessibilityRole="text">
          <AppText variant="caption" color="info">
            {RECORDING_MISSING_HE}
          </AppText>
        </View>
      )}
      <AppText variant="subheading">הפרוטוקול</AppText>
      <BulletList items={DESENSITIZATION_PROTOCOL_HE} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  notice: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.infoMuted,
  },
});
