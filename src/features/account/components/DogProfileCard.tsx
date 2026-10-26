import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card } from '@/components/ui';
import { BreedIntelBadge } from '@/features/breeds/components/BreedIntelBadge';
import { SIZE_SHORT_LABELS } from '@/features/dogs/breeds';
import { DogAvatar } from '@/features/dogs/components';
import type { DogRow } from '@/lib/database.types';
import { spacing } from '@/constants/theme';
import { formatAge } from '@/utils/date';

interface DogProfileCardProps {
  dog: DogRow;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
}

/** One dog in the profile list: avatar, summary line, and make-active / edit actions. */
export function DogProfileCard({ dog, isActive, onActivate, onEdit }: DogProfileCardProps) {
  const weight = dog.weight_kg != null ? ` · ${dog.weight_kg} ק״ג` : '';
  return (
    <Card>
      <View style={styles.row}>
        <DogAvatar dog={dog} size={56} />
        <View style={styles.flex}>
          <View style={styles.row}>
            <AppText variant="subheading">{dog.name}</AppText>
            {isActive ? <Badge label="פעיל" tone="primary" icon="checkmark" /> : null}
          </View>
          <AppText variant="caption" color="textSecondary">
            {`${dog.breed} · ${formatAge(dog.birth_date)} · ${SIZE_SHORT_LABELS[dog.size]}${weight}`}
          </AppText>
          <BreedIntelBadge breedId={dog.breed_id} />
        </View>
      </View>
      <View style={styles.actions}>
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
