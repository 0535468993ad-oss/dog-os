import { ErrorState, LoadingState } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { ConsentGateScreen } from '@/features/legal/ConsentGateScreen';
import { useConsents } from '@/features/legal/hooks/consents';
import { consentGate } from '@/features/legal/utils/consentRules';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function ConsentRoute() {
  const user = useUser();
  const consents = useConsents(user.id);
  const gate = consentGate(consents);

  if (gate.state === 'loading') return <LoadingState />;
  if (gate.state === 'error') return <ErrorState message="לא הצלחנו לטעון את המסמכים לאישור." onRetry={() => void consents.refetch()} />;
  // The root layout leaves this route once consent is satisfied (or bypassed in development).
  if (gate.state === 'satisfied' || gate.state === 'bypassed_dev') return <LoadingState />;
  return <ConsentGateScreen missing={gate.missing} />;
}
