import { Stack } from 'expo-router';
import type { ReactNode } from 'react';

import { EmptyState, LoadingState, Screen } from '@/components/ui';
import { useActiveDog } from '@/features/dogs/hooks';
import type { DogRow } from '@/lib/database.types';

/** Form screen frame: sets the header title, resolves the active dog, then renders the form for it. */
export function WithDog({ title, children }: { title: string; children: (dog: DogRow) => ReactNode }) {
  const { activeDog, isLoading } = useActiveDog();
  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title }} />
      {isLoading ? <LoadingState /> : activeDog ? children(activeDog) : <EmptyState icon="paw-outline" title="אין כלב פעיל" body="הוסיפו כלב בלשונית הפרופיל." />}
    </Screen>
  );
}
