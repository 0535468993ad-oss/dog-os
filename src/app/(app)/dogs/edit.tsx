import { useLocalSearchParams } from 'expo-router';

import { DogFormScreen } from '@/features/dogs/DogFormScreen';
import { isUuid } from '@/utils/params';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function DogEditRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <DogFormScreen dogId={isUuid(id) ? id : undefined} />;
}
