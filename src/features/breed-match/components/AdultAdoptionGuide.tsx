import { StyleSheet, View } from 'react-native';

import { AppText, Checkbox, GlassCard, ProgressBar } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { ADULT_ASSESSMENT_CHECKLIST, DECOMPRESSION_STAGES } from '../data/adultProtocol';
import { useAdoptionChecklist } from '../hooks/useAdoptionChecklist';
import { EthicalDirectory } from './EthicalDirectory';

/** Tab 3: the 3-3-3 rule, the safe assessment checklist, and the ethical directory. */
export function AdultAdoptionGuide() {
  const { checked, progress, toggle } = useAdoptionChecklist();

  return (
    <View style={styles.root}>
      <GlassCard>
        <AppText variant="heading" accessibilityRole="header">
          כלל 3-3-3: הסתגלות של כלב מאומץ
        </AppText>
        {DECOMPRESSION_STAGES.map((stage) => (
          <View key={stage.id} style={styles.stage}>
            <AppText variant="bodyStrong" color="accentGold">
              {stage.titleHe}
            </AppText>
            <AppText color="textSecondary">{stage.bodyHe}</AppText>
          </View>
        ))}
      </GlassCard>

      <GlassCard>
        <AppText variant="heading" accessibilityRole="header">
          אבחון כלב בוגר – רשימת ביקור
        </AppText>
        <ProgressBar value={progress.total ? progress.done / progress.total : 0} label={`${progress.done} מתוך ${progress.total} שלבים`} />
        {ADULT_ASSESSMENT_CHECKLIST.map((item) => (
          <Checkbox key={item.id} checked={checked.includes(item.id)} onChange={() => toggle(item.id)} label={item.titleHe}>
            <AppText variant="bodyStrong">{item.critical ? `${item.titleHe} · חובה` : item.titleHe}</AppText>
            <AppText variant="caption" color="textSecondary">
              {item.detailHe}
            </AppText>
          </Checkbox>
        ))}
        <View style={[styles.status, progress.readyToDecide ? styles.ready : styles.notReady]} accessibilityLiveRegion="polite">
          <AppText variant="caption" color={progress.readyToDecide ? 'success' : 'warning'}>
            {progress.readyToDecide
              ? 'כל שלבי הבטיחות בוצעו. עכשיו אפשר להחליט – בלב שקט.'
              : `לפני החלטה חסרים שלבי חובה: ${progress.missingCritical.map((item) => item.titleHe).join(' · ')}`}
          </AppText>
        </View>
      </GlassCard>

      <EthicalDirectory />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  stage: {
    gap: spacing.xxs,
  },
  status: {
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  ready: {
    backgroundColor: colors.successMuted,
  },
  notReady: {
    backgroundColor: colors.warningMuted,
  },
});
