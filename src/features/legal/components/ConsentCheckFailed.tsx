import { Button, ErrorState, Screen } from '@/components/ui';

/** Consent couldn't be verified: hold the user here (fail closed) with a retry and a way out. */
export function ConsentCheckFailed({ onRetry, onSignOut }: { onRetry: () => void; onSignOut: () => void }) {
  return (
    <Screen>
      <ErrorState message="לא הצלחנו לאמת את הגדרות הפרטיות שלכם. בדקו את החיבור ונסו שוב." onRetry={onRetry} />
      <Button title="יציאה מהחשבון" variant="ghost" onPress={onSignOut} />
    </Screen>
  );
}
