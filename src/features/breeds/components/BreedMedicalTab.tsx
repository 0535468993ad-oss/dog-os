import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, Disclaimer } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { BOAS_LABELS_HE, SEVERITY_LABELS_HE } from '../data/breedLabels';
import type { BreedProfile } from '../types';

/** Tab 4: the veterinary profile – inherited conditions with their screening, bloat and MDR1 warnings, longevity. */
export function BreedMedicalTab({ profile }: { profile: BreedProfile }) {
  const { clinical } = profile;
  const boas = clinical.brachycephalicBoasGrade;
  return (
    <View style={styles.root}>
      {clinical.bloatGdvRisk.hasHighPredisposition ? (
        <Card tone="danger">
          <View style={styles.card} accessibilityRole="alert">
            <AppText variant="bodyStrong" color="dangerText">
              אזהרה: נטייה גבוהה לתסובב קיבה (GDV)
            </AppText>
            <AppText>{clinical.bloatGdvRisk.chestConformationNotesHe}</AppText>
            <AppText variant="caption">בטן נפוחה, ריור וניסיונות הקאה בלי תוצאה – נוסעים מיד לווטרינר חירום.</AppText>
          </View>
        </Card>
      ) : null}
      {clinical.geneticVulnerabilities.map((condition) => (
        <Card key={condition.conditionNameEn}>
          <View style={styles.card}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {condition.conditionNameHe}
              </AppText>
              <Badge tone={condition.severity === 'LIFE_THREATENING' ? 'danger' : 'warning'} label={SEVERITY_LABELS_HE[condition.severity]} />
            </View>
            <AppText variant="caption" color="textSecondary">
              {condition.conditionNameEn}
            </AppText>
            <AppText>{condition.pathologySummaryHe}</AppText>
            <AppText variant="label">בדיקה מומלצת</AppText>
            <AppText>{condition.recommendedScreeningProtocol}</AppText>
          </View>
        </Card>
      ))}
      <Card>
        <View style={styles.card}>
          <AppText variant="label">רגישות לתרופות והרדמה (MDR1)</AppText>
          <AppText>{`${clinical.anesthesiaMdr1Risk.isMdr1Prone ? 'גזע בסיכון מוכר. ' : ''}${clinical.anesthesiaMdr1Risk.precautionsHe}`}</AppText>
          {boas ? (
            <>
              <AppText variant="label">מבנה פנים שטוח (BOAS)</AppText>
              <AppText>{`נטייה ${BOAS_LABELS_HE[boas]} – כל כלב מקבל הערכת נשימה אישית.`}</AppText>
            </>
          ) : null}
          <AppText variant="label">תוחלת חיים ממוצעת</AppText>
          <AppText>{`${clinical.averageLongevityYears.min}–${clinical.averageLongevityYears.max} שנים`}</AppText>
        </View>
      </Card>
      <Disclaimer>מידע כללי על נטיות הגזע, לא אבחנה. כל החלטה רפואית – עם וטרינר.</Disclaimer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.xs,
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
