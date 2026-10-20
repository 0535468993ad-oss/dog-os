import { useLocalSearchParams } from 'expo-router';

import { VetArticleScreen } from '@/features/health/VetArticleScreen';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function VetArticleRoute() {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  return <VetArticleScreen articleId={String(articleId)} />;
}
