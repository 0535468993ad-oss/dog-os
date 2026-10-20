import { useLocalSearchParams } from 'expo-router';

import { isSupportRequestType } from '@/features/support/utils/labels';
import { RequestsScreen } from '@/features/support/RequestsScreen';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function RequestsRoute() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  return <RequestsScreen initialType={isSupportRequestType(type) ? type : undefined} />;
}
