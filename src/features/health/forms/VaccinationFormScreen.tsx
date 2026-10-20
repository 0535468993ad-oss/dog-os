import { router } from 'expo-router';
import { useState } from 'react';

import { AppText, Card, ChipGroup, DateField, ErrorState, LoadingState, TextField } from '@/components/ui';
import type { DogRow, VaccinationRow } from '@/lib/database.types';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { deleteVaccination, saveVaccination, type VaccinationInput } from '../api';
import { useHealth, useHealthMutation } from '../hooks';
import { FormActions } from './FormActions';
import { SubmitError } from './SubmitError';
import { WithDog } from './WithDog';

const COMMON_VACCINES = ['כלבת', 'משושה (DHPP)', 'שעלת המלונות', 'לפטוספירה'];

/** Route screen: add a vaccination, or edit the one with `id`. */
export function VaccinationFormScreen({ id }: { id?: string }) {
  return <WithDog title={id ? 'עריכת חיסון' : 'הוספת חיסון'}>{(dog) => <VaccinationLoader dog={dog} id={id} />}</WithDog>;
}

/** Finds the record being edited; keyed fields initialize once, so refetches never overwrite typing. */
function VaccinationLoader({ dog, id }: { dog: DogRow; id?: string }) {
  const health = useHealth(dog.id);
  const existing = id ? health.data?.vaccinations.find((v) => v.id === id) : undefined;
  if (id && health.isLoading) return <LoadingState />;
  if (id && !existing) return <ErrorState message="החיסון לא נמצא." />;
  return <VaccinationFields key={existing?.id ?? 'new'} dog={dog} existing={existing} />;
}

/** The vaccination form: name (with common shortcuts), dates and notes. */
function VaccinationFields({ dog, existing }: { dog: DogRow; existing?: VaccinationRow }) {
  const id = existing?.id;
  const save = useHealthMutation(dog.id, (input: VaccinationInput) => saveVaccination(dog.id, input, id));
  const remove = useHealthMutation(dog.id, () => deleteVaccination(id!));

  const [name, setName] = useState(existing?.name ?? '');
  const [lastGiven, setLastGiven] = useState<string | null>(existing?.last_given ?? null);
  const [dueDate, setDueDate] = useState<string | null>(existing?.due_date ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<{ name?: string; dates?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validates (a name and at least one date), saves, and returns to the previous screen.
  const submit = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'הזינו שם חיסון.';
    if (!lastGiven && !dueDate) next.dates = 'הזינו לפחות תאריך אחד.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await save.mutateAsync({ name: name.trim(), lastGiven, dueDate, notes: notes.trim() || null });
      router.back();
    } catch (error) {
      setSubmitError(toUserMessage(error));
    }
  };

  return (
    <>
      <Card>
        <TextField label="שם החיסון" value={name} onChangeText={setName} error={errors.name} maxLength={80} />
        <ChipGroup
          options={COMMON_VACCINES.map((v) => ({ value: v, label: v }))}
          value={COMMON_VACCINES.includes(name) ? name : null}
          onChange={setName}
          accessibilityLabel="חיסונים נפוצים"
        />
        <DateField label="ניתן לאחרונה" value={lastGiven} onChange={setLastGiven} onClear={() => setLastGiven(null)} maximumDate={todayIso()} optional />
        <DateField label="מועד החיסון הבא" value={dueDate} onChange={setDueDate} onClear={() => setDueDate(null)} optional error={errors.dates} />
        <TextField label="הערות" value={notes} onChangeText={setNotes} multiline optional maxLength={1000} />
      </Card>
      <AppText variant="caption" color="textSecondary">
        בישראל חיסון כלבת שנתי הוא חובה על פי חוק.
      </AppText>
      <SubmitError message={submitError} />
      <FormActions
        onSave={submit}
        saving={save.isPending}
        onDelete={
          existing
            ? async () => {
                await remove.mutateAsync(undefined);
                router.back();
              }
            : undefined
        }
        deleting={remove.isPending}
      />
    </>
  );
}
