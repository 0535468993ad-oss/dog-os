import { router } from 'expo-router';
import { useState } from 'react';

import { showToast } from '@/components/ui';
import type { DogRow, DogSize } from '@/lib/database.types';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import type { PickedPhoto } from '../api';
import { useDeleteDog, useSaveDog } from '../hooks';
import { buildDogInput, MAX_CUSTOM_BREED_LENGTH, suggestedSize, validateDogForm, type DogFormErrors } from './dogFormLogic';
import { pickDogPhoto } from './pickDogPhoto';

/** State and actions of the add/edit dog form, initialized once from `existing`. */
export function useDogForm(existing: DogRow | undefined) {
  const save = useSaveDog();
  const remove = useDeleteDog();

  const [name, setName] = useState(existing?.name ?? '');
  const [breedId, setBreedId] = useState<string | null>(existing?.breed_id ?? null);
  const [customBreed, setCustomBreed] = useState<string | null>(existing && !existing.breed_id ? existing.breed : null);
  const [birthDate, setBirthDate] = useState<string | null>(existing?.birth_date ?? null);
  const [size, setSize] = useState<DogSize | null>(existing?.size ?? null);
  const [weight, setWeight] = useState(existing?.weight_kg != null ? String(existing.weight_kg) : '');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [errors, setErrors] = useState<DogFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const values = { name, breedId, customBreed, birthDate, size, weight };

  // Picks a listed breed and suggests its typical size if none was chosen yet.
  const chooseBreed = (id: string) => {
    setBreedId(id);
    setCustomBreed(null);
    setSize(suggestedSize(size, id));
  };

  // Uses typed text as the breed (an unlisted breed).
  const chooseCustomBreed = (text: string) => {
    setBreedId(null);
    setCustomBreed(text.slice(0, MAX_CUSTOM_BREED_LENGTH));
  };

  // Opens the photo library; a failure (e.g. permission denied) is reported instead of failing silently.
  const choosePhoto = async () => {
    const result = await pickDogPhoto();
    if (result.status === 'picked') setPhoto(result.photo);
    else if (result.status === 'failed') showToast('לא הצלחנו לפתוח את התמונות. בדקו את ההרשאה לגישה לתמונות בהגדרות המכשיר.');
  };

  // Validates, saves (a failed photo upload doesn't fail the save) and returns to the previous screen.
  const submit = async () => {
    const today = todayIso();
    setErrors(validateDogForm(values, today));
    const input = buildDogInput(values, today);
    if (!input) return;
    setSubmitError(null);
    try {
      const { photoFailed } = await save.mutateAsync({ id: existing?.id, input, photo });
      if (photoFailed) showToast('הכלב נשמר, אך העלאת התמונה נכשלה. אפשר לנסות שוב מעריכת הפרופיל.');
      router.back();
    } catch (error) {
      setSubmitError(toUserMessage(error, 'לא הצלחנו לשמור את הכלב. נסו שוב.'));
    }
  };

  // Deletes the dog and everything recorded for it, then leaves the form.
  const deleteDog = async () => {
    if (!existing) return;
    try {
      await remove.mutateAsync(existing);
      router.back();
    } catch (error) {
      setSubmitError(toUserMessage(error));
    }
  };

  return {
    values,
    setName,
    setBirthDate,
    setSize,
    setWeight,
    photo,
    errors,
    submitError,
    saving: save.isPending,
    deleting: remove.isPending,
    chooseBreed,
    chooseCustomBreed,
    choosePhoto,
    submit,
    deleteDog,
  };
}
