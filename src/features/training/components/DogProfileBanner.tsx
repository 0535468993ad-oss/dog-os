import { StyleSheet, View } from 'react-native';

import { AppText, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { TRACK_LABELS_HE } from '../data/methodology';
import type { TemperamentTrait, TrainingCommand, TrainingRecommendation } from '../types';
import { breedNoteFor } from '../utils/temperamentEngine';

interface DogProfileBannerProps {
  command: TrainingCommand;
  dogName: string;
  breedLabel: string | null;
  breedId: string | null;
  trait: TemperamentTrait | null;
  recommendation: TrainingRecommendation | null;
}

/** The tip for this dog and command: the sensitive-dog adjustment first, then the track's first principle. */
function tipFor(command: TrainingCommand, trait: TemperamentTrait | null, recommendation: TrainingRecommendation | null): string {
  if (trait === 'ANXIOUS_SENSITIVE' || recommendation?.nerve === 'SENSITIVE_SOFT') return command.anxiousDogAdjustmentHe;
  return recommendation?.principlesHe[0] ?? 'בחרו בלשונית הפקודות איך הכלב מתנהג ביומיום, ותקבלו המלצה אישית.';
}

/** The sticky banner over a command story: who is training, the recommended track and this dog's caution notes. */
export function DogProfileBanner({ command, dogName, breedLabel, breedId, trait, recommendation }: DogProfileBannerProps) {
  const breedNote = breedNoteFor(breedId);
  return (
    <View style={styles.root} accessible accessibilityRole="summary">
      <View style={styles.row}>
        <AppText variant="bodyStrong" style={styles.flex}>
          {breedLabel ? `${dogName} · ${breedLabel}` : dogName}
        </AppText>
        {recommendation ? (
          <Badge
            tone={recommendation.track === 'BALANCED' ? 'warning' : 'success'}
            label={`מומלץ: ${TRACK_LABELS_HE[recommendation.track]}${recommendation.track === 'BALANCED' && recommendation.requiresProfessional ? ', עם מאלף' : ''}`}
          />
        ) : null}
      </View>
      <AppText variant="caption" color="textSecondary">
        {tipFor(command, trait, recommendation)}
      </AppText>
      {breedNote ? (
        <AppText variant="caption" color="accentCyan">
          {breedNote}
        </AppText>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
