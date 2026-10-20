import { ErrorState, LoadingState } from '@/components/ui';

import { DogForm } from './form/DogForm';
import { useDogs } from './hooks';

/** Route screen: add a dog, or edit the one with `dogId` once it has loaded. */
export function DogFormScreen({ dogId }: { dogId?: string }) {
  const dogs = useDogs();
  const existing = dogId ? dogs.data?.find((dog) => dog.id === dogId) : undefined;

  if (dogId && dogs.isLoading) return <LoadingState />;
  if (dogId && !existing) return <ErrorState message="הכלב לא נמצא." onRetry={() => void dogs.refetch()} />;
  // Keyed so the form initializes once per dog and later refetches never overwrite what the user typed.
  return <DogForm key={existing?.id ?? 'new'} existing={existing} />;
}
