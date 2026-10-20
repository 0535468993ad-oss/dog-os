import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ChipGroup, DateField, Screen, Select, TextField } from '@/components/ui';
import type { DogRow, DogSize } from '@/lib/database.types';
import { spacing } from '@/constants/theme';
import { todayIso } from '@/utils/date';

import { BREEDS, SIZE_LABELS } from '../breeds';
import { DeleteDogSection } from './DeleteDogSection';
import { MAX_NAME_LENGTH } from './dogFormLogic';
import { PhotoPicker } from './PhotoPicker';
import { useDogForm } from './useDogForm';

const SIZE_OPTIONS = (Object.keys(SIZE_LABELS) as DogSize[]).map((value) => ({ value, label: SIZE_LABELS[value] }));
const BREED_OPTIONS = BREEDS.map((breed) => ({ value: breed.id, label: breed.label }));

/** Add/edit dog form layout; behaviour lives in useDogForm. */
export function DogForm({ existing }: { existing?: DogRow }) {
  const form = useDogForm(existing);
  const { values, errors } = form;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: existing ? 'עריכת פרופיל' : 'הוספת כלב' }} />

      <PhotoPicker photo={form.photo} storedPhotoPath={existing?.profile_photo_path ?? null} dogName={values.name} onPick={() => void form.choosePhoto()} />

      <Card>
        <TextField label="שם" value={values.name} onChangeText={form.setName} error={errors.name} maxLength={MAX_NAME_LENGTH} placeholder="רקסי" />
        <Select
          label="גזע"
          options={BREED_OPTIONS}
          value={values.breedId}
          onChange={form.chooseBreed}
          onCustomValue={form.chooseCustomBreed}
          customDisplay={values.customBreed}
          searchable
          placeholder="חיפוש גזע…"
          error={errors.breed}
        />
        <DateField label="תאריך לידה" value={values.birthDate} onChange={form.setBirthDate} maximumDate={todayIso()} error={errors.birthDate} />
        <View style={styles.group}>
          <AppText variant="label" color="textSecondary">
            גודל
          </AppText>
          <ChipGroup options={SIZE_OPTIONS} value={values.size} onChange={form.setSize} accessibilityLabel="גודל הכלב" />
          {errors.size ? (
            <AppText variant="caption" color="dangerText" accessibilityRole="alert">
              {errors.size}
            </AppText>
          ) : null}
        </View>
        <TextField
          label="משקל נוכחי (ק״ג)"
          value={values.weight}
          onChangeText={form.setWeight}
          error={errors.weight}
          optional
          inputMode="decimal"
          keyboardType="decimal-pad"
          placeholder="12.5"
          hint="מעקב משקל מלא נמצא במסך הבריאות"
        />
      </Card>

      {form.submitError ? (
        <AppText color="dangerText" accessibilityRole="alert">
          {form.submitError}
        </AppText>
      ) : null}

      <Button title="שמירה" onPress={form.submit} loading={form.saving} fullWidth />

      {existing ? <DeleteDogSection dogName={existing.name} deleting={form.deleting} onDelete={() => void form.deleteDog()} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
});
