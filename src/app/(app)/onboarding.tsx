import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function OnboardingRoute() {
  return <OnboardingScreen mode="FIRST_RUN" />;
}
