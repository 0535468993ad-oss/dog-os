import { useLocalSearchParams } from 'expo-router';

import { ArticleScreen } from '@/features/training/screens/ArticleScreen';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function ArticleRoute() {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  return <ArticleScreen articleId={String(articleId)} />;
}
