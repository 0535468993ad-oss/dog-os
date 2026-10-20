import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChipSelect, QueryStatus, ScreenContainer, TextField, type ChipOption } from '@/components';
import { colors, spacing, typography } from '@/constants';
import { useFocusQuery } from '@/hooks';
import type { RootTabScreenProps } from '@/navigation/types';
import { createDog, deleteDog, listDogs, signOut } from '@/services';
import type { Dog, DogSize } from '@/types';
import { formatAge, isValidPastIsoDate } from '@/utils';

const SIZE_OPTIONS: readonly ChipOption<DogSize>[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const SIZE_LABELS: Record<DogSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };

interface AddDogFormProps {
  onCreated: () => void;
  onCancel?: () => void;
}

function AddDogForm({ onCreated, onCancel }: AddDogFormProps) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [size, setSize] = useState<DogSize | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return 'Enter your dog’s name.';
    if (!breed.trim()) return 'Enter a breed (or “Mixed”).';
    if (!isValidPastIsoDate(birthDate.trim())) return 'Birth date must be a past date in YYYY-MM-DD format.';
    if (!size) return 'Choose a size.';
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError || !size) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createDog({ name: name.trim(), breed: breed.trim(), birthDate: birthDate.trim(), size });
      onCreated();
    } catch (e) {
      if (__DEV__) console.warn('[createDog]', e);
      setError('Couldn’t save the dog. Try again.');
      setSaving(false);
    }
  };

  return (
    <Card title="Add a dog">
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Rex" editable={!saving} />
      <TextField label="Breed" value={breed} onChangeText={setBreed} placeholder="Labrador" editable={!saving} />
      <TextField
        label="Birth date"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
        inputMode="numeric"
        maxLength={10}
        editable={!saving}
      />
      <Text style={styles.label}>Size</Text>
      <ChipSelect options={SIZE_OPTIONS} value={size} onChange={setSize} disabled={saving} />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {onCancel ? <Button title="Cancel" variant="secondary" onPress={onCancel} disabled={saving} /> : null}
        <Button title="Save" onPress={handleSave} loading={saving} />
      </View>
    </Card>
  );
}

interface DogCardProps {
  dog: Dog;
  onRemoved: () => void;
}

// Removal is two-step instead of Alert.alert, which has no buttons on web.
function DogCard({ dog, onRemoved }: DogCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await deleteDog(dog.id);
      onRemoved();
    } catch (e) {
      if (__DEV__) console.warn('[deleteDog]', e);
      setError('Couldn’t remove the dog. Try again.');
      setRemoving(false);
    }
  };

  return (
    <Card title={dog.name}>
      <Text style={styles.body}>
        {dog.breed} · {SIZE_LABELS[dog.size]} · {formatAge(dog.birthDate)}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {confirming ? (
        <>
          <Text style={styles.caption}>This also deletes {dog.name}’s training history.</Text>
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={() => setConfirming(false)} disabled={removing} />
            <Button title="Remove" variant="danger" onPress={handleRemove} loading={removing} />
          </View>
        </>
      ) : (
        <View style={styles.actions}>
          <Button title="Remove" variant="secondary" onPress={() => setConfirming(true)} />
        </View>
      )}
    </Card>
  );
}

export function ProfileScreen(_props: RootTabScreenProps<'Profile'>) {
  const dogs = useFocusQuery(listDogs);
  const [showForm, setShowForm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // On success RootNavigator unmounts this screen via onAuthStateChange.
  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    const result = await signOut();
    if (!result.ok) {
      setSignOutError(result.message);
      setSigningOut(false);
    }
  };

  const handleCreated = () => {
    setShowForm(false);
    void dogs.refetch();
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile</Text>

      {dogs.status !== 'success' ? (
        <QueryStatus
          status={dogs.status}
          message={dogs.status === 'error' ? dogs.message : undefined}
          onRetry={() => void dogs.refetch()}
        />
      ) : (
        <>
          {dogs.data.map((dog) => (
            <DogCard key={dog.id} dog={dog} onRemoved={() => void dogs.refetch()} />
          ))}

          {dogs.data.length === 0 ? (
            <AddDogForm onCreated={handleCreated} />
          ) : showForm ? (
            <AddDogForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
          ) : (
            <Button title="Add another dog" variant="secondary" onPress={() => setShowForm(true)} />
          )}
        </>
      )}

      <View style={styles.signOut}>
        {signOutError ? <Text style={styles.error}>{signOutError}</Text> : null}
        <Button title="Sign out" variant="danger" onPress={handleSignOut} loading={signingOut} />
      </View>
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
  label: {
    ...typography.caption,
    fontWeight: '600',
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
  signOut: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
