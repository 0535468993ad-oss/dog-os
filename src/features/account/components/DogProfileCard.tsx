import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card } from '@/components/ui';
import { BreedIntelBadge } from '@/features/breeds/components/BreedIntelBadge';
import { SIZE_SHORT_LABELS } from '@/features/dogs/breeds';
import { DogAvatar } from '@/features/dogs/components';
import type { DogRow } from '@/lib/database.types';
import { colors, radius, spacing } from '@/constants/theme';
import { formatAge } from '@/utils/date';

interface DogProfileCardProps {
  dog: DogRow;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
}

/** One dog in the profile list: ringed avatar, summary line, and one row of breed / activate / edit actions. */
export function DogProfileCard({ dog, isActive, onActivate, onEdit }: DogProfileCardProps) {
  const weight = dog.weight_kg != null ? ` · ${dog.weight_kg} ק״ג` : '';
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatarRing} testID="dog-avatar-ring">
          <DogAvatar dog={dog} size={56} />
        </View>
        <View style={styles.flex}>
          <View style={styles.row}>
            <AppText variant="subheading">{dog.name}</AppText>
            {isActive ? <Badge label="פעיל" tone="primary" icon="checkmark" /> : null}
          </View>
          <AppText variant="caption" color="textSecondary">
            {`${dog.breed} · ${formatAge(dog.birth_date)} · ${SIZE_SHORT_LABELS[dog.size]}${weight}`}
          </AppText>
        </View>
      </View>
      <View style={styles.actions} testID="dog-card-actions">
        <BreedIntelBadge breedId={dog.breed_id} />
        {!isActive ? <Button title="הפוך לפעיל" variant="secondary" compact onPress={onActivate} accessibilityLabel={`הפיכת ${dog.name} לכלב הפעיל`} /> : null}
        <Button title="עריכה" variant="secondary" compact onPress={onEdit} accessibilityLabel={`עריכת הפרופיל של ${dog.name}`} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarRing: {
    padding: 2,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
