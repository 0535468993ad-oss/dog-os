import { useLocalSearchParams } from 'expo-router';

import { MedicalNoteFormScreen } from '@/features/health/forms/MedicalNoteFormScreen';
import { isUuid } from '@/utils/params';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function NoteRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <MedicalNoteFormScreen id={isUuid(id) ? id : undefined} />;
}
