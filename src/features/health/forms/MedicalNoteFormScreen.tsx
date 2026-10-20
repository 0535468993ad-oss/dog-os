import { router } from 'expo-router';
import { useState } from 'react';

import { Card, DateField, ErrorState, LoadingState, TextField } from '@/components/ui';
import type { DogRow, MedicalNoteRow } from '@/lib/database.types';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { deleteNote, saveNote, type NoteInput } from '../api';
import { useHealth, useHealthMutation } from '../hooks';
import { FormActions } from './FormActions';
import { SubmitError } from './SubmitError';
import { WithDog } from './WithDog';

/** Route screen: add a medical note, or edit the one with `id`. */
export function MedicalNoteFormScreen({ id }: { id?: string }) {
  return <WithDog title={id ? 'עריכת הערה' : 'הערה רפואית'}>{(dog) => <NoteLoader dog={dog} id={id} />}</WithDog>;
}

/** Finds the note being edited; keyed fields initialize once, so refetches never overwrite typing. */
function NoteLoader({ dog, id }: { dog: DogRow; id?: string }) {
  const health = useHealth(dog.id);
  const existing = id ? health.data?.notes.find((n) => n.id === id) : undefined;
  if (id && health.isLoading) return <LoadingState />;
  if (id && !existing) return <ErrorState message="ההערה לא נמצאה." />;
  return <NoteFields key={existing?.id ?? 'new'} dog={dog} existing={existing} />;
}

/** The medical-note form: title, date and free-text details. */
function NoteFields({ dog, existing }: { dog: DogRow; existing?: MedicalNoteRow }) {
  const id = existing?.id;
  const save = useHealthMutation(dog.id, (input: NoteInput) => saveNote(dog.id, input, id));
  const remove = useHealthMutation(dog.id, () => deleteNote(id!));

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [notedOn, setNotedOn] = useState<string>(existing?.noted_on ?? todayIso());
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Requires a title, saves, and returns to the previous screen.
  const submit = async () => {
    if (!title.trim()) {
      setError('הזינו כותרת.');
      return;
    }
    setError(null);
    try {
      await save.mutateAsync({ title: title.trim(), body: body.trim(), notedOn });
      router.back();
    } catch (e) {
      setSubmitError(toUserMessage(e));
    }
  };

  return (
    <>
      <Card>
        <TextField label="כותרת" value={title} onChangeText={setTitle} error={error} maxLength={120} placeholder="ביקור שגרתי, אבחנה, תרופה…" />
        <DateField label="תאריך" value={notedOn} onChange={setNotedOn} maximumDate={todayIso()} />
        <TextField label="פירוט" value={body} onChangeText={setBody} multiline optional maxLength={5000} />
      </Card>
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
