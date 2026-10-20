import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, IconButton } from '@/components/ui';
import type { DogRow } from '@/lib/database.types';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/theme';
import { formatAge } from '@/utils/date';

import { useDogPhotoUrl, useSetActiveDog } from './hooks';

export function DogAvatar({ dog, size = 48 }: { dog: Pick<DogRow, 'name' | 'profile_photo_path'>; size?: number }) {
  const photo = useDogPhotoUrl(dog.profile_photo_path);
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (photo.data) {
    return (
      <Image
        source={{ uri: photo.data }}
        style={style}
        contentFit="cover"
        accessibilityLabel={`תמונה של ${dog.name}`}
        alt={`תמונה של ${dog.name}`}
      />
    );
  }
  return (
    <View style={[styles.placeholder, style]} accessible={false}>
      <Ionicons name="paw" size={size * 0.5} color={colors.primary} accessible={false} />
    </View>
  );
}

/**
 * Header control showing the active dog; opens a picker when there are several dogs.
 * `onDark` switches text and accents to their heroNavy-safe variants.
 */
export function DogSwitcher({ dogs, activeDog, onDark = false }: { dogs: DogRow[]; activeDog: DogRow; onDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const setActive = useSetActiveDog();
  const multiple = dogs.length > 1;

  return (
    <>
      <Pressable
        onPress={() => multiple && setOpen(true)}
        disabled={!multiple}
        accessibilityRole={multiple ? 'button' : 'text'}
        accessibilityLabel={multiple ? `הכלב הפעיל: ${activeDog.name}. החלפת כלב` : `הכלב: ${activeDog.name}`}
        style={({ pressed }) => [styles.switcher, pressed && styles.pressed]}
      >
        <View style={[styles.avatarRing, onDark && styles.avatarRingOnDark]}>
          <DogAvatar dog={activeDog} size={52} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title" color={onDark ? 'textOnDark' : 'textPrimary'} numberOfLines={1}>
            {activeDog.name}
          </AppText>
          <AppText variant="caption" color={onDark ? 'textOnDarkSecondary' : 'textSecondary'} numberOfLines={1}>
            {`${activeDog.breed} · ${formatAge(activeDog.birth_date)}`}
          </AppText>
        </View>
        {multiple ? <Ionicons name="chevron-down" size={20} color={onDark ? colors.primaryBright : colors.textSecondary} accessible={false} /> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <AppText variant="heading" accessibilityRole="header">
                בחירת כלב
              </AppText>
              <IconButton icon="close" accessibilityLabel="סגירה" onPress={() => setOpen(false)} />
            </View>
            {dogs.map((dog) => {
              const selected = dog.id === activeDog.id;
              return (
                <Pressable
                  key={dog.id}
                  onPress={() => {
                    setActive.mutate(dog.id);
                    setOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={`${dog.name}, ${dog.breed}`}
                  style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                >
                  <DogAvatar dog={dog} size={40} />
                  <AppText variant={selected ? 'bodyStrong' : 'body'} style={styles.flex}>
                    {dog.name}
                  </AppText>
                  {selected ? <Ionicons name="checkmark" size={20} color={colors.primary} accessible={false} /> : null}
                </Pressable>
              );
            })}
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  placeholder: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A brand-colored ring frames the active dog as the subject of the screen.
  avatarRing: {
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarRingOnDark: {
    borderColor: colors.primaryBright,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_AREA,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_AREA + 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  optionSelected: {
    backgroundColor: colors.primaryMuted,
  },
});
