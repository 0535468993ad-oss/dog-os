import { useLocalSearchParams } from 'expo-router';

import { ModuleScreen } from '@/features/training/ModuleScreen';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function ModuleRoute() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  return <ModuleScreen moduleId={String(moduleId)} />;
}
