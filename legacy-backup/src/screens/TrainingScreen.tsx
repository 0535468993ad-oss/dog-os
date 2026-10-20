import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChipSelect, QueryStatus, ScreenContainer, TextField } from '@/components';
import { colors, spacing, typography } from '@/constants';
import { useFocusQuery } from '@/hooks';
import type { RootTabScreenProps } from '@/navigation/types';
import { listDogs, listTrainingSessions, logTrainingSession } from '@/services';
import type { Dog } from '@/types';
import { formatDateTime } from '@/utils';

const MAX_SESSION_MINUTES = 600;

interface LogSessionFormProps {
  dog: Dog;
  onLogged: () => void;
}

function LogSessionForm({ dog, onLogged }: LogSessionFormProps) {
  const [skill, setSkill] = useState('');
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const durationMinutes = Number(minutes);
    if (!skill.trim()) {
      setError('Enter the skill you practiced.');
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > MAX_SESSION_MINUTES) {
      setError(`Duration must be a whole number between 1 and ${MAX_SESSION_MINUTES} minutes.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await logTrainingSession({
        dogId: dog.id,
        skill: skill.trim(),
        durationMinutes,
        completedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });
      setSkill('');
      setMinutes('');
      setNotes('');
      onLogged();
    } catch (e) {
      if (__DEV__) console.warn('[logTrainingSession]', e);
      setError('Couldn’t log the session. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={`Log a session for ${dog.name}`}>
      <TextField label="Skill" value={skill} onChangeText={setSkill} placeholder="Sit, recall, heel…" editable={!saving} />
      <TextField
        label="Duration (minutes)"
        value={minutes}
        onChangeText={setMinutes}
        placeholder="10"
        inputMode="numeric"
        maxLength={3}
        editable={!saving}
      />
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="How did it go?"
        multiline
        editable={!saving}
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button title="Log session" onPress={handleSave} loading={saving} />
      </View>
    </Card>
  );
}

interface DogSessionsProps {
  dog: Dog;
}

function DogSessions({ dog }: DogSessionsProps) {
  const fetchSessions = useCallback(() => listTrainingSessions(dog.id), [dog.id]);
  const sessions = useFocusQuery(fetchSessions);

  return (
    <>
      <LogSessionForm dog={dog} onLogged={() => void sessions.refetch()} />

      {sessions.status !== 'success' ? (
        <QueryStatus
          status={sessions.status}
          message={sessions.status === 'error' ? sessions.message : undefined}
          onRetry={() => void sessions.refetch()}
        />
      ) : sessions.data.length === 0 ? (
        <Card title="No sessions yet">
          <Text style={styles.body}>Sessions you log for {dog.name} will show up here.</Text>
        </Card>
      ) : (
        sessions.data.map((session) => (
          <Card key={session.id} title={session.skill}>
            <Text style={styles.body}>
              {session.durationMinutes} min · {formatDateTime(session.completedAt)}
            </Text>
            {session.notes ? <Text style={styles.caption}>{session.notes}</Text> : null}
          </Card>
        ))
      )}
    </>
  );
}

export function TrainingScreen({ navigation }: RootTabScreenProps<'Training'>) {
  const dogs = useFocusQuery(listDogs);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);

  if (dogs.status !== 'success') {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Training</Text>
        <QueryStatus
          status={dogs.status}
          message={dogs.status === 'error' ? dogs.message : undefined}
          onRetry={() => void dogs.refetch()}
        />
      </ScreenContainer>
    );
  }

  // Falls back to the first dog if nothing is selected yet or the selected dog was removed.
  const selectedDog = dogs.data.find((dog) => dog.id === selectedDogId) ?? dogs.data[0];

  return (
    <ScreenContainer>
      <Text style={styles.title}>Training</Text>

      {selectedDog ? (
        <>
          {dogs.data.length > 1 ? (
            <ChipSelect
              options={dogs.data.map((dog) => ({ value: dog.id, label: dog.name }))}
              value={selectedDog.id}
              onChange={setSelectedDogId}
            />
          ) : null}
          <DogSessions key={selectedDog.id} dog={selectedDog} />
        </>
      ) : (
        <Card title="Add a dog first" onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.body}>Add your dog on the Profile tab to start logging training.</Text>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
