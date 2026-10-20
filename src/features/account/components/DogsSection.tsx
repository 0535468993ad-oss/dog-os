import { router } from 'expo-router';
import Animated from 'react-native-reanimated';

import { enterAt } from '@/components/motion';
import { AppText, Button, Card, ErrorState, LoadingState, SectionHeader } from '@/components/ui';
import type { DogRow } from '@/lib/database.types';
import { toUserMessage } from '@/utils/errors';

import { DogProfileCard } from './DogProfileCard';

interface DogsSectionProps {
  dogs: DogRow[];
  activeDogId: string | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onActivate: (dogId: string) => void;
}

const addDog = () => router.push('/dogs/edit');

/** "My dogs": the user's dogs with loading, error and empty states, and an add action. */
export function DogsSection({ dogs, activeDogId, isLoading, error, onRetry, onActivate }: DogsSectionProps) {
  return (
    <>
      <SectionHeader title="הכלבים שלי" action={<Button title="הוספה" icon="add" variant="ghost" compact onPress={addDog} accessibilityLabel="הוספת כלב" />} />
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={toUserMessage(error)} onRetry={onRetry} />
      ) : dogs.length === 0 ? (
        <Card>
          <AppText color="textSecondary">עדיין לא הוספתם כלב.</AppText>
          <Button title="הוספת כלב" onPress={addDog} />
        </Card>
      ) : (
        dogs.map((dog, index) => (
          <Animated.View key={dog.id} entering={enterAt(index)}>
            <DogProfileCard
              dog={dog}
              isActive={dog.id === activeDogId}
              onActivate={() => onActivate(dog.id)}
              onEdit={() => router.push({ pathname: '/dogs/edit', params: { id: dog.id } })}
            />
          </Animated.View>
        ))
      )}
    </>
  );
}
