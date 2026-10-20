import { useLocalSearchParams } from 'expo-router';

import { ErrorState } from '@/components/ui';
import { isLegalDocId } from '@/features/legal/documents';
import { LegalDocumentScreen } from '@/features/legal/LegalDocumentScreen';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function LegalRoute() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  return isLegalDocId(doc) ? <LegalDocumentScreen doc={doc} /> : <ErrorState message="המסמך לא נמצא." />;
}
