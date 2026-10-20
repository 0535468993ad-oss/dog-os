import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import type { PickedPhoto } from '../api';
import { DogAvatar } from '../components';

interface PhotoPickerProps {
  /** A newly picked photo (not yet uploaded), shown in preference to the stored one. */
  photo: PickedPhoto | null;
  storedPhotoPath: string | null;
  dogName: string;
  onPick: () => void;
}

/** Tappable avatar for adding or replacing the dog's profile photo. */
export function PhotoPicker({ photo, storedPhotoPath, dogName, onPick }: PhotoPickerProps) {
  const hasPhoto = !!photo || !!storedPhotoPath;
  return (
    <View style={styles.row}>
      <Pressable onPress={onPick} accessibilityRole="button" accessibilityLabel={hasPhoto ? 'החלפת תמונת פרופיל' : 'הוספת תמונת פרופיל'} style={styles.button}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel="התמונה שנבחרה" alt="התמונה שנבחרה" />
        ) : (
          <DogAvatar dog={{ name: dogName || 'הכלב', profile_photo_path: storedPhotoPath }} size={96} />
        )}
        <AppText variant="label" color="primary">
          {hasPhoto ? 'החלפת תמונה' : 'הוספת תמונה (רשות)'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.md,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceAlt,
  },
});
