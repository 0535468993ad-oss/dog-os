import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { DRIVE_KEYS, DRIVE_LABELS_HE, EXPERIENCE_LABELS_HE, LIVING_LABELS_HE } from '../data/breedLabels';
import type { BreedProfile } from '../types';
import { findBreedProfile, isHighDriveWorkingBreed, WORK_DRIVE_FLAG_HE } from '../utils/breedTraits';
import { DriveBars } from './DriveBars';

/** Tab 2: the drive radar as 5-point bars, daily energy and mental-stimulation needs. */
export function BreedTemperamentTab({ profile }: { profile: BreedProfile }) {
  const { drives } = profile;
  const highDrive = isHighDriveWorkingBreed(findBreedProfile(profile.id) ?? profile);
  return (
    <View style={styles.root}>
      <Card>
        <View style={styles.card}>
          <AppText variant="subheading" accessibilityRole="header">
            רדאר יצרים
          </AppText>
          <DriveBars rows={DRIVE_KEYS.map((key) => ({ labelHe: DRIVE_LABELS_HE[key], value: drives[key] }))} />
          <AppText variant="caption" color="textSecondary">
            נטיות של הגזע – כל כלב שונה, וגנטיקה, גידול וסביבה משפיעים יחד.
          </AppText>
        </View>
      </Card>
      {highDrive ? (
        <Card tone="info">
          <AppText variant="bodyStrong">{WORK_DRIVE_FLAG_HE}</AppText>
        </Card>
      ) : null}
      <Card>
        <View style={styles.card}>
          <AppText variant="label">אנרגיה וסיבולת</AppText>
          <AppText>{`כ־${drives.energyStaminaHoursDaily} שעות פעילות ביום`}</AppText>
          <AppText variant="label">גירוי מחשבתי</AppText>
          <AppText>{drives.mentalStimulationRequirementHe}</AppText>
          <AppText variant="label">התאמה</AppText>
          <AppText>{`${LIVING_LABELS_HE[profile.suitability.living]} · ${EXPERIENCE_LABELS_HE[profile.suitability.experience]}`}</AppText>
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
    gap: spacing.xs,
  },
});
