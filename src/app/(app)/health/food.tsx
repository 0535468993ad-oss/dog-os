import { useLocalSearchParams } from 'expo-router';

import { FoodFormScreen } from '@/features/health/forms/FoodFormScreen';
import { isUuid } from '@/utils/params';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function FoodRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <FoodFormScreen id={isUuid(id) ? id : undefined} />;
}
