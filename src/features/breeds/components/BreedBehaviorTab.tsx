import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BulletList, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { RISK_LABELS_HE } from '../data/breedLabels';
import type { BreedProfile, RiskLevel } from '../types';

/** Warning tone for elevated risks; the level is always written out, never color alone. */
const tone = (level: RiskLevel | 'CRITICAL') => (level === 'LOW' ? 'neutral' : 'warning');

/** Tab 3: behavioural challenges – separation, reactivity, guarding, barking and what boredom causes. */
export function BreedBehaviorTab({ profile }: { profile: BreedProfile }) {
  const { behavior } = profile;
  const risks: { label: string; level: RiskLevel | 'CRITICAL' }[] = [
    { label: 'חרדת נטישה', level: behavior.separationAnxietyRisk },
    { label: 'תגובתיות ברצועה', level: behavior.leashReactivityPredisposition },
    { label: 'שמירה על משאבים', level: behavior.resourceGuardingTendency },
  ];
  return (
    <View style={styles.root}>
      <Card>
        <View style={styles.card}>
          {risks.map((risk) => (
            <View key={risk.label} style={styles.row}>
              <AppText style={styles.flex}>{risk.label}</AppText>
              <Badge tone={tone(risk.level)} label={`סיכון ${RISK_LABELS_HE[risk.level]}`} />
            </View>
          ))}
          <View style={styles.row}>
            <AppText style={styles.flex}>נטייה לנביחות</AppText>
            <Badge label={`${behavior.vocalizationProfile.tendency}/5`} />
          </View>
          <BulletList items={behavior.vocalizationProfile.commonTriggersHe} />
        </View>
      </Card>
      {behavior.separationAnxietyRisk === 'HIGH' || behavior.separationAnxietyRisk === 'CRITICAL' ? (
        <Card tone="warning">
          <AppText accessibilityRole="alert">גזע עם נטייה גבוהה לחרדת נטישה: בונים עצמאות בהדרגה – יציאות קצרות שמתארכות – ולא משאירים לבד שעות ארוכות.</AppText>
        </Card>
      ) : null}
      <Card>
        <View style={styles.card}>
          <AppText variant="label">כשחסר גירוי</AppText>
          <AppText>{behavior.understimulationFalloutHe}</AppText>
          <AppText variant="label">פרוטוקול גירוי מחשבתי</AppText>
          <AppText>{profile.drives.mentalStimulationRequirementHe}</AppText>
          <AppText variant="label">גישה מומלצת</AppText>
          <AppText>{behavior.recommendedHandlingStyleHe}</AppText>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
