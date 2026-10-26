import { useLocalSearchParams } from 'expo-router';

import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function AssessmentRoute() {
  // The screen checks the id against the owner's dogs and falls back to the active dog.
  const { dogId } = useLocalSearchParams<{ dogId?: string }>();
  return <OnboardingScreen mode="REASSESS" dogId={typeof dogId === 'string' ? dogId : null} />;
}
