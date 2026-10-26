import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { SIZE_LABELS_HE } from '../data/breedLabels';
import type { BreedProfile } from '../types';

/** A breed in the explorer: names, origin, size, daily energy and the clinical alerts that matter most. */
export function BreedCard({ profile, onPress }: { profile: BreedProfile; onPress: () => void }) {
  const gdv = profile.clinical.bloatGdvRisk.hasHighPredisposition;
  const boas = profile.clinical.brachycephalicBoasGrade;
  const flat = boas !== undefined && boas !== 'NONE';
  const energy = profile.drives.energyStaminaHoursDaily;
  return (
    <PressableScale
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${profile.names.he}, ${profile.names.en}, ${profile.genesis.countryOfOrigin}, ${SIZE_LABELS_HE[profile.phenotype.sizeCategory]}, ${energy} שעות פעילות ביום${gdv ? ', סיכון גבוה לתסובב קיבה' : ''}${flat ? ', מבנה פנים שטוח' : ''}`}
    >
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{profile.names.he}</AppText>
          <AppText variant="caption" color="textSecondary">{`${profile.names.en} · ${profile.genesis.countryOfOrigin}`}</AppText>
        </View>
        <Badge label={SIZE_LABELS_HE[profile.phenotype.sizeCategory]} />
      </View>
      <View style={styles.row}>
        <Ionicons name="flash" size={14} color={colors.accentOrange} accessible={false} />
        <AppText variant="caption">{`${energy} שעות פעילות ביום`}</AppText>
      </View>
      {gdv || flat ? (
        <View style={styles.alerts}>
          {gdv ? <Badge tone="warning" icon="warning-outline" label="סיכון לתסובב קיבה" /> : null}
          {flat ? <Badge tone="warning" icon="cloud-outline" label="מבנה פנים שטוח" /> : null}
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  alerts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
