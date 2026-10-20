import { useLocalSearchParams } from 'expo-router';

import { VaccinationFormScreen } from '@/features/health/forms/VaccinationFormScreen';
import { isUuid } from '@/utils/params';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function VaccinationRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <VaccinationFormScreen id={isUuid(id) ? id : undefined} />;
}
