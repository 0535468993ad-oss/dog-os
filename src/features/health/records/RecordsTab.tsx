import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { useActiveDog } from '@/features/dogs/hooks';
import type { DogRow } from '@/lib/database.types';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { useHealth } from '../hooks';
import { FoodList } from './FoodList';
import { NotesList } from './NotesList';
import { VaccinationList } from './VaccinationList';
import { WeightCard } from './WeightCard';

/** "My records" tab: resolves the active dog, or invites the user to add one. */
export function RecordsTab() {
  const { activeDog, isLoading } = useActiveDog();
  if (isLoading) return <LoadingState />;
  if (!activeDog) {
    return (
      <EmptyState
        icon="paw-outline"
        title="עדיין אין כלב"
        body="הוסיפו כלב כדי לתעד חיסונים, משקל ותזונה."
        action={<Button title="הוספת כלב" onPress={() => router.push('/dogs/edit')} />}
      />
    );
  }
  return <DogRecords dog={activeDog} />;
}

/** Loads one dog's health data and lays out its record sections. */
function DogRecords({ dog }: { dog: DogRow }) {
  const health = useHealth(dog.id);

  if (health.isLoading) return <LoadingState />;
  if (health.error || !health.data) return <ErrorState message={toUserMessage(health.error)} onRetry={() => void health.refetch()} />;
  const { vaccinations, weights, food, notes } = health.data;

  return (
    <View style={styles.list}>
      <VaccinationList vaccinations={vaccinations} />
      <WeightCard dogId={dog.id} weights={weights} />
      <FoodList food={food} />
      <NotesList notes={notes} />
      <Button title="דוח בריאות והתנהגות לווטרינר / למאלף" icon="document-text-outline" variant="secondary" onPress={() => router.push('/report')} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
