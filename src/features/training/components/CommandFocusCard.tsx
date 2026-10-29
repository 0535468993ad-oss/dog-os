import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { NERVE_LABELS_HE } from '../data/assessmentCopy';
import type { CommandMarkers, NerveProfile } from '../types';

interface CommandFocusCardProps {
  markers: CommandMarkers;
  suitableForProfiles: readonly NerveProfile[];
  dogName: string;
  /** The active dog's nerve profile, or null when there is no recommendation yet. */
  nerve: NerveProfile | null;
}

/** The command's three marker words, and whether it is a priority command for this dog's profile. */
export function CommandFocusCard({ markers, suitableForProfiles, dogName, nerve }: CommandFocusCardProps) {
  const rows = [
    { label: 'מרקר סיום', word: markers.terminal, meaning: 'התגמול מגיע, אפשר לזוז' },
    { label: 'מרקר המשך', word: markers.continuation, meaning: 'נשארים בתנוחה, התגמול מגיע אליו' },
    { label: 'שחרור', word: markers.releaseWord, meaning: 'התרגיל נגמר' },
  ];
  const priority = nerve !== null && suitableForProfiles.includes(nerve);
  return (
    <View style={styles.root}>
      <AppText variant="label" color="accentBronze">
        מילות המרקר
      </AppText>
      {rows.map((row) => (
        <AppText key={row.label} variant="caption" color="textSecondary">
          {`${row.label}: "${row.word}" – ${row.meaning}`}
        </AppText>
      ))}
      {priority && nerve ? (
        <View style={styles.priority}>
          <Ionicons name="star" size={14} color={colors.accentGold} accessible={false} />
          <AppText variant="caption" color="accentGold" style={styles.flex}>
            {`פקודה מומלצת במיוחד ל${dogName} – פרופיל ${NERVE_LABELS_HE[nerve]}`}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
